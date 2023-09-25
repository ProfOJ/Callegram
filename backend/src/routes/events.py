from fastapi import APIRouter
from fastapi import Depends

from dependencies import auth_service, UOWDep
from models.schema import CalendarEventSchemaAdd, CalendarEventSchemaUpdate
from models.view import ApiResponse
from services.auth import AuthService
from services.event import CalendarEventService
from services.user import UserService

router = APIRouter()


@router.post("/create")
async def schedule_appointment(
        appointment: CalendarEventSchemaAdd,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
):
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

    # check if the appointment is inside the schedule

    weekday = appointment.appointment_time.weekday()
    start_time = appointment.appointment_time.hour * 60 + appointment.appointment_time.minute
    end_time = start_time + appointment.duration.seconds // 60

    if start_time < user.schedule.windows[weekday][0] or end_time > user.schedule.windows[weekday][1]:
        print(start_time, end_time, user.schedule.windows[weekday])
        return ApiResponse(
            success=False,
            message="Appointment is not inside the schedule",
        )

    # check if there is no overlapping or intersecting appointment for owner or invited user

    events = await CalendarEventService.get_events(appointment.owner_user_id, uow)
    events += await CalendarEventService.get_events(appointment.invited_user_id, uow)

    for event in events:
        if event.appointment_time.weekday() != weekday:
            continue

        event_start_time = event.appointment_time.hour * 60 + event.appointment_time.minute
        event_end_time = event_start_time + event.duration.seconds // 60

        latest_start_time = max(start_time, event_start_time)
        earliest_end_time = min(end_time, event_end_time)

        if latest_start_time < earliest_end_time:
            return ApiResponse(
                success=False,
                message="Appointment is overlapping with existing appointment",
            )

    event_id = await CalendarEventService.add_event(uow, appointment)

    return ApiResponse(
        success=True,
        message="Appointment scheduled",
        data={
            "event_id": event_id
        }
    )


@router.get("/get_all")
async def get_appointments(
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
):
    events = await CalendarEventService.get_events_by_user_id(auth.init_data.user.id, uow)

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
):
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
):
    event = await CalendarEventService.get_event(event_id, uow)

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

    # check for overlapping or intersecting appointment for owner or invited user

    events = await CalendarEventService.get_events(appointment.owner_user_id, uow)
    events += await CalendarEventService.get_events(appointment.invited_user_id, uow)

    for event in events:
        if event.id == event_id:
            continue

        if event.appointment_time.weekday() != appointment.appointment_time.weekday():
            continue

        event_start_time = event.appointment_time.hour * 60 + event.appointment_time.minute
        event_end_time = event_start_time + event.duration.seconds // 60

        start_time = appointment.appointment_time.hour * 60 + appointment.appointment_time.minute
        end_time = start_time + appointment.duration.seconds // 60

        latest_start_time = max(start_time, event_start_time)
        earliest_end_time = min(end_time, event_end_time)

        if latest_start_time < earliest_end_time:
            return ApiResponse(
                success=False,
                message="Appointment is overlapping with existing appointment",
            )

    await CalendarEventService.edit_event(uow, event_id, appointment)

    return ApiResponse(
        success=True,
        message="Appointment edited",
    )
