import datetime

from fastapi import APIRouter, Depends

from dependencies import UOWDep, auth_service
from models.schema import ApiResponse
from services.auth import AuthService
from services.schedule import ScheduleService
from services.user import UserService

router = APIRouter()


@router.get("/day_availability/{user_id}")
async def get_day_availability(
        user_id: int,
        date: datetime.date,
        uow: UOWDep,
        _: AuthService = Depends(auth_service),
) -> ApiResponse:
    """
    Get single day availability

    This endpoint returns user's available slots for the given day, according to events in their calendar.

    :param user_id: user id as integer
    :param date: date without time
    :param uow: unit of work instance
    :param _: auth service (unused)
    :return: api response with user's day availability
    """
    user = await UserService.get_user(uow, user_id)

    if not user:
        return ApiResponse(
            success=False,
            message="User not found",
        )

    day_availability = await ScheduleService.get_date_availability(uow, user_id, date)

    return ApiResponse(
        success=True,
        message="Day availability retrieved",
        data={
            "day_availability": day_availability,
        }
    )


@router.get("/busy_days")
async def get_busy_days(
        from_date: datetime.date,
        to_date: datetime.date,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
) -> ApiResponse:
    """
    Get busy days

    This endpoint returns list of dates in given range without time for which the given user has any calls scheduled.

    :param from_date start date of the range without time
    :param to_date: end date of the range without time
    :param uow: unit of work instance
    :param auth: auth service
    :return: api response with the list of dates
    """
    user = await UserService.get_user(uow, auth.init_data.user.id)

    if not user:
        return ApiResponse(
            success=False,
            message="User not found",
        )

    busy_days = await ScheduleService.get_busy_days(uow, auth.init_data.user.id, from_date, to_date)

    return ApiResponse(
        success=True,
        message="Busy days retrieved",
        data={
            "busy_days": busy_days,
        }
    )
