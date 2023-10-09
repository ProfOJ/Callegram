import datetime
from datetime import timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.schedulers.base import JobLookupError
from fastapi import APIRouter
from fastapi import Depends

from dependencies import auth_service, UOWDep, get_notification_service, get_scheduler
from models.schema import CalendarEventSchemaAdd, CalendarEventSchemaUpdate, ApiResponse
from models.view import CalendarEvent, Schedule
from services.auth import AuthService
from services.event import CalendarEventService
from services.notification import TelegramNotificationService, send_call_reminder_notification, \
    send_call_started_notification
from services.user import UserService

router = APIRouter()


def is_event_overlapping(
        new_event: CalendarEventSchemaAdd | CalendarEventSchemaUpdate | CalendarEvent,
        events: list[CalendarEvent],
        old_event_id: str | None = None
) -> bool:
    """
    Check if event is overlapping with given events

    :param new_event: event to check
    :param events: existing events
    :param old_event_id: id of event to skip, if this check is performed for editing
    :return: boolean indicating whether the event is overlapping with existing events or not
    """
    for event in events:
        if event.appointment_time.weekday() != new_event.appointment_time.weekday():
            continue

        if event.appointment_time.date() != new_event.appointment_time.date():
            continue

        if event.id == old_event_id:
            continue

        event_start_time = event.appointment_time.hour * 60 + event.appointment_time.minute
        event_end_time = event_start_time + event.duration.seconds // 60

        start_time = new_event.appointment_time.hour * 60 + new_event.appointment_time.minute
        end_time = start_time + new_event.duration.seconds // 60

        latest_start_time = max(start_time, event_start_time)
        earliest_end_time = min(end_time, event_end_time)

        if latest_start_time < earliest_end_time:
            return True

    return False


def is_event_inside_schedule(
        new_event: CalendarEventSchemaAdd | CalendarEventSchemaUpdate | CalendarEvent,
        schedule: Schedule
) -> bool:
    """
    Check if event is inside the given schedule

    :param new_event: event to check against the schedule
    :param schedule: schedule of any user
    :return: boolean indicating whether the event is inside the given schedule
    """
    weekday = new_event.appointment_time.weekday()
    start_time = new_event.appointment_time.hour * 60 + new_event.appointment_time.minute
    end_time = start_time + new_event.duration.seconds // 60

    if start_time < schedule.windows[weekday][0] or end_time > schedule.windows[weekday][1]:
        return False

    return True


@router.get("/get/{event_id}")
async def get_event(
        event_id: str,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
) -> ApiResponse:
    """
    Get event details

    :param event_id: event id as string
    :param uow: unit of work instance
    :param auth: auth service
    :return: api response with event details
    """
    event = await CalendarEventService.get_event(event_id, uow)

    if not event:
        return ApiResponse(
            success=False,
            message="Event not found",
        )

    if event.owner_user_id != auth.init_data.user.id and event.invited_user_id != auth.init_data.user.id:
        return ApiResponse(
            success=False,
            message="You are not authorized to get this event",
        )

    return ApiResponse(
        success=True,
        message="Event retrieved",
        data={
            "event": event
        }
    )


@router.post("/create")
async def create_event(
        event_data: CalendarEventSchemaAdd,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
        notification_service: TelegramNotificationService = Depends(get_notification_service),
        scheduler: AsyncIOScheduler = Depends(get_scheduler),
) -> ApiResponse:
    """
    Create a new event

    :param event_data: new event data
    :param uow: unit of work instance
    :param auth: auth service instance
    :param notification_service: notification service instance
    :param scheduler: scheduler instance
    :return: api response with newly created event and boolean indicating whether telegram notification was successfully
    delivered
    """
    if event_data.invited_user_id != auth.init_data.user.id:
        return ApiResponse(
            success=False,
            message="You are not authorized to create this event",
        )

    user = await UserService.get_user(uow, event_data.owner_user_id)

    if not user:
        return ApiResponse(
            success=False,
            message="Owner user not found",
        )

    # default duration is 30 minutes
    # custom durations can be implemented on users' demand
    event_data.duration = timedelta(minutes=30)

    if not is_event_inside_schedule(event_data, user.schedule):
        return ApiResponse(
            success=False,
            message="Event is not inside the user's schedule",
        )

    # get events of schedule owner and user who's creating the event to check all overlaps
    events = await CalendarEventService.get_events_by_user_id(event_data.owner_user_id, uow)
    events += await CalendarEventService.get_events_by_user_id(event_data.invited_user_id, uow)

    if is_event_overlapping(event_data, events):
        return ApiResponse(
            success=False,
            message="Event is overlapping with existing event in the schedule",
        )

    event = await CalendarEventService.add_event(uow, event_data)

    await notification_service.send_owner_call_booked_notification(event)
    was_sent = await notification_service.send_invited_call_booked_notification(event)

    min20_notification_time = event.appointment_time - timedelta(minutes=20)
    min10_notification_time = event.appointment_time - timedelta(minutes=10)

    event_hour_minute_id = f"{event.appointment_time.hour}{event.appointment_time.minute}"

    scheduler.add_job(
        send_call_reminder_notification, trigger='date',
        kwargs={
            'booking_details': event,
            'minutes_before_start': 20,
        },
        id=f"{event.id}_{event_hour_minute_id}_20min", run_date=min20_notification_time
    )
    scheduler.add_job(
        send_call_reminder_notification, trigger='date',
        kwargs={
            'booking_details': event,
            'minutes_before_start': 10,
        },
        id=f"{event.id}_{event_hour_minute_id}_10min", run_date=min10_notification_time
    )
    scheduler.add_job(
        send_call_started_notification, trigger='date',
        kwargs={
            'booking_details': event,
        },
        id=f"{event.id}_{event_hour_minute_id}_call_start", run_date=event.appointment_time
    )

    return ApiResponse(
        success=True,
        message="Event scheduled",
        data={
            "event": event,
            "was_sent": was_sent
        }
    )


@router.get("/get_all")
async def get_events(
        date: datetime.date,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
) -> ApiResponse:
    """
    Get events for the given date

    :param date: date without time
    :param uow: unit of work instance
    :param auth: auth service
    :return: api response with the list of current user's events for the given date
    """
    events = await CalendarEventService.get_events_for_date(auth.init_data.user.id, date, uow)

    return ApiResponse(
        success=True,
        message="Events retrieved",
        data={
            "events": events
        }
    )


@router.delete("/delete/{event_id}")
async def delete_event(
        event_id: str,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
        notification_service: TelegramNotificationService = Depends(get_notification_service),
        scheduler: AsyncIOScheduler = Depends(get_scheduler),
) -> ApiResponse:
    """
    Delete event by id

    :param event_id: event id as string
    :param uow: unit of work instance
    :param auth: auth service
    :param notification_service: notification service
    :param scheduler: scheduler instance
    :return: api response with boolean indicating whether telegram notification was delivered
    """
    event = await CalendarEventService.get_event(event_id, uow)

    if not event:
        return ApiResponse(
            success=False,
            message="Event not found",
        )

    if event.owner_user_id != auth.init_data.user.id and event.invited_user_id != auth.init_data.user.id:
        return ApiResponse(
            success=False,
            message="You are not authorized to delete this event",
        )

    await CalendarEventService.delete_event(uow, event_id)

    await notification_service.send_call_canceled_of_user_notification(auth.init_data.user.id, event)
    was_sent = await notification_service.send_call_canceled_by_user_notification(auth.init_data.user.id, event)
    event_hour_minute_id = f"{event.appointment_time.hour}{event.appointment_time.minute}"

    try:
        scheduler.remove_job(f"{event.id}_{event_hour_minute_id}_20min")
    except JobLookupError:  # we don't care about this error
        pass

    try:
        scheduler.remove_job(f"{event.id}_{event_hour_minute_id}_10min")
    except JobLookupError:  # we don't care about this error
        pass

    try:
        scheduler.remove_job(f"{event.id}_{event_hour_minute_id}_call_start")
    except JobLookupError:  # we don't care about this error
        pass

    return ApiResponse(
        success=True,
        message="Event deleted",
        data={
            "was_sent": was_sent
        }
    )


@router.patch("/edit/{event_id}")
async def edit_event(
        event_id: str,
        event_data: CalendarEventSchemaUpdate,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
        notification_service: TelegramNotificationService = Depends(get_notification_service),
        scheduler: AsyncIOScheduler = Depends(get_scheduler),
) -> ApiResponse:
    """
    Edit event by id

    :param event_id: event id as string
    :param event_data: new event data
    :param uow: unit of work instance
    :param auth: auth service
    :param notification_service: notification service
    :param scheduler: scheduler instance
    :return: api response with updated event details and boolean indicating whether telegram notification was delivered
    """
    event: CalendarEvent = await CalendarEventService.get_event(event_id, uow)

    if not event:
        return ApiResponse(
            success=False,
            message="Event not found",
        )

    if event.invited_user_id != auth.init_data.user.id:
        return ApiResponse(
            success=False,
            message="You are not authorized to edit this event",
        )

    user = await UserService.get_user(uow, event.owner_user_id)

    if not user:
        return ApiResponse(
            success=False,
            message="Owner user not found",
        )

    event_data.duration = timedelta(minutes=30)  # default duration is 30 minutes

    if not is_event_inside_schedule(event_data, user.schedule):
        return ApiResponse(
            success=False,
            message="Event is not inside the user's schedule",
        )

    events = await CalendarEventService.get_events_by_user_id(event.owner_user_id, uow)
    events += await CalendarEventService.get_events_by_user_id(event.invited_user_id, uow)

    if is_event_overlapping(event_data, events, event_id):
        return ApiResponse(
            success=False,
            message="Event is overlapping with existing events in the schedule",
        )

    old_event_hour_minute_id = f"{event.appointment_time.hour}{event.appointment_time.minute}"

    event = await CalendarEventService.edit_event(uow, event_id, event_data)

    event_hour_minute_id = f"{event.appointment_time.hour}{event.appointment_time.minute}"
    min20_notification_time = event.appointment_time - timedelta(minutes=20)
    min10_notification_time = event.appointment_time - timedelta(minutes=10)

    await notification_service.send_call_edited_of_user_notification(auth.init_data.user.id, event)
    was_sent = await notification_service.send_call_edited_by_user_notification(auth.init_data.user.id, event)

    try:
        scheduler.remove_job(
            f"{event.id}_{old_event_hour_minute_id}_20min"
        )
    except JobLookupError:  # we don't care about this error
        pass

    scheduler.add_job(
        send_call_reminder_notification, trigger='date',
        kwargs={
            'booking_details': event,
            'minutes_before_start': 20,
        },
        id=f"{event.id}_{event_hour_minute_id}_20min", run_date=min20_notification_time
    )

    try:
        scheduler.remove_job(
            f"{event.id}_{old_event_hour_minute_id}_10min"
        )
    except JobLookupError:  # we don't care about this error
        pass

    scheduler.add_job(
        send_call_reminder_notification, trigger='date',
        kwargs={
            'booking_details': event,
            'minutes_before_start': 10,
        },
        id=f"{event.id}_{event_hour_minute_id}_10min", run_date=min10_notification_time
    )

    try:
        scheduler.remove_job(
            f"{event.id}_{old_event_hour_minute_id}_call_start"
        )
    except JobLookupError:  # we don't care about this error
        pass

    scheduler.add_job(
        send_call_started_notification, trigger='date',
        kwargs={
            'booking_details': event,
        },
        id=f"{event.id}_{event_hour_minute_id}_call_start", run_date=event.appointment_time
    )

    return ApiResponse(
        success=True,
        message="Event edited",
        data={
            "event": event,
            "was_sent": was_sent
        }
    )
