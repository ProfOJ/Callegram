import datetime
from datetime import timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import APIRouter
from fastapi import Depends

from dependencies import auth_service, UOWDep, get_notification_service, get_scheduler
from models.schema import CalendarEventSchemaAdd, CalendarEventSchemaUpdate, ApiResponse
from models.view import CalendarEvent, User
from services.auth import AuthService
from services.event import CalendarEventService
from services.notification import TelegramNotificationService, send_call_reminder_notification, \
    send_call_started_notification
from services.user import UserService
from apscheduler.schedulers.base import JobLookupError

router = APIRouter()


def is_event_overlapping(
        new_event: CalendarEventSchemaAdd | CalendarEventSchemaUpdate | CalendarEvent,
        events: list[CalendarEvent],
        old_event_id: str | None = None
):
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
        user: User
):
    weekday = new_event.appointment_time.weekday()
    start_time = new_event.appointment_time.hour * 60 + new_event.appointment_time.minute
    end_time = start_time + new_event.duration.seconds // 60

    if start_time < user.schedule.windows[weekday][0] or end_time > user.schedule.windows[weekday][1]:
        return False

    return True


@router.get("/get/{event_id}")
async def get_appointment(
        event_id: str,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
) -> ApiResponse:
    event = await CalendarEventService.get_event(event_id, uow)

    if not event:
        return ApiResponse(
            success=False,
            message="Appointment not found",
        )

    if event.owner_user_id != auth.init_data.user.id and event.invited_user_id != auth.init_data.user.id:
        return ApiResponse(
            success=False,
            message="You are not authorized to get this appointment",
        )

    return ApiResponse(
        success=True,
        message="Appointment retrieved",
        data={
            "event": event
        }
    )


@router.post("/create")
async def schedule_appointment(
        appointment: CalendarEventSchemaAdd,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
        notification_service: TelegramNotificationService = Depends(get_notification_service),
        scheduler: AsyncIOScheduler = Depends(get_scheduler),
) -> ApiResponse:
    if appointment.invited_user_id != auth.init_data.user.id:
        return ApiResponse(
            success=False,
            message="You are not authorized to create this appointment",
        )

    user = await UserService.get_user(uow, appointment.owner_user_id)

    if not user:
        return ApiResponse(
            success=False,
            message="Owner user not found",
        )

    appointment.duration = timedelta(minutes=30)  # default duration is 30 minutes

    if not is_event_inside_schedule(appointment, user):
        return ApiResponse(
            success=False,
            message="Appointment is not inside the schedule",
        )

    events = await CalendarEventService.get_events(appointment.owner_user_id, uow)
    events += await CalendarEventService.get_events(appointment.invited_user_id, uow)

    if is_event_overlapping(appointment, events):
        return ApiResponse(
            success=False,
            message="Appointment is overlapping with existing appointment",
        )

    event = await CalendarEventService.add_event(uow, appointment)

    await notification_service.send_owner_call_booked_notification(event)
    await notification_service.send_invited_call_booked_notification(event)

    min20_notification_time = event.appointment_time - timedelta(minutes=20)
    min10_notification_time = event.appointment_time - timedelta(minutes=10)

    scheduler.add_job(
        send_call_reminder_notification, trigger='date',
        kwargs={
            'booking_details': event,
            'minutes_before_start': 20,
        },
        id=f"{event.id}_20min", run_date=min20_notification_time
    )
    scheduler.add_job(
        send_call_reminder_notification, trigger='date',
        kwargs={
            'booking_details': event,
            'minutes_before_start': 10,
        },
        id=f"{event.id}_10min", run_date=min10_notification_time
    )
    scheduler.add_job(
        send_call_started_notification, trigger='date',
        kwargs={
            'booking_details': event,
        },
        id=f"{event.id}_call_start", run_date=event.appointment_time
    )

    return ApiResponse(
        success=True,
        message="Appointment scheduled",
        data={
            "event": event
        }
    )


@router.get("/get_all")
async def get_appointments(
        date: datetime.date,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
) -> ApiResponse:
    events = await CalendarEventService.get_events_for_date(auth.init_data.user.id, date, uow)

    return ApiResponse(
        success=True,
        message="Appointments retrieved",
        data={
            "events": events
        }
    )


@router.delete("/delete/{event_id}")
async def delete_appointment(
        event_id: str,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
        notification_service: TelegramNotificationService = Depends(get_notification_service),
        scheduler: AsyncIOScheduler = Depends(get_scheduler),
) -> ApiResponse:
    event = await CalendarEventService.get_event(event_id, uow)

    if not event:
        return ApiResponse(
            success=False,
            message="Appointment not found",
        )

    if event.owner_user_id != auth.init_data.user.id and event.invited_user_id != auth.init_data.user.id:
        return ApiResponse(
            success=False,
            message="You are not authorized to delete this appointment",
        )

    await CalendarEventService.delete_event(uow, event_id)

    await notification_service.send_call_canceled_by_user_notification(auth.init_data.user.id, event)
    await notification_service.send_call_canceled_of_user_notification(auth.init_data.user.id, event)

    try:
        scheduler.remove_job(f"{event.id}_20min")
    except JobLookupError:  # we don't care about this error
        pass

    try:
        scheduler.remove_job(f"{event.id}_10min")
    except JobLookupError:  # we don't care about this error
        pass

    try:
        scheduler.remove_job(f"{event.id}_call_start")
    except JobLookupError:  # we don't care about this error
        pass

    return ApiResponse(
        success=True,
        message="Appointment deleted",
    )


@router.patch("/edit/{event_id}")
async def edit_appointment(
        event_id: str,
        appointment: CalendarEventSchemaUpdate,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
        notification_service: TelegramNotificationService = Depends(get_notification_service),
        scheduler: AsyncIOScheduler = Depends(get_scheduler),
) -> ApiResponse:
    event: CalendarEvent = await CalendarEventService.get_event(event_id, uow)

    if not event:
        return ApiResponse(
            success=False,
            message="Appointment not found",
        )

    if event.invited_user_id != auth.init_data.user.id:
        return ApiResponse(
            success=False,
            message="You are not authorized to edit this appointment",
        )

    user = await UserService.get_user(uow, event.owner_user_id)

    if not user:
        return ApiResponse(
            success=False,
            message="Owner user not found",
        )

    appointment.duration = timedelta(minutes=30)  # default duration is 30 minutes

    if not is_event_inside_schedule(appointment, user):
        return ApiResponse(
            success=False,
            message="Appointment is not inside the schedule",
        )

    events = await CalendarEventService.get_events(event.owner_user_id, uow)
    events += await CalendarEventService.get_events(event.invited_user_id, uow)

    if is_event_overlapping(appointment, events, event_id):
        return ApiResponse(
            success=False,
            message="Appointment is overlapping with existing appointment",
        )

    event = await CalendarEventService.edit_event(uow, event_id, appointment)

    await notification_service.send_call_edited_by_user_notification(auth.init_data.user.id, event)
    await notification_service.send_call_edited_of_user_notification(auth.init_data.user.id, event)

    try:
        scheduler.reschedule_job(
            f"{event.id}_20min", trigger='date', run_date=event.appointment_time - timedelta(minutes=20)
        )
    except JobLookupError:  # we don't care about this error
        pass
    try:
        scheduler.reschedule_job(
            f"{event.id}_10min", trigger='date', run_date=event.appointment_time - timedelta(minutes=10)
        )
    except JobLookupError:  # we don't care about this error
        pass
    try:
        scheduler.reschedule_job(
            f"{event.id}_call_start", trigger='date', run_date=event.appointment_time
        )
    except JobLookupError:  # we don't care about this error
        pass

    return ApiResponse(
        success=True,
        message="Appointment edited",
    )
