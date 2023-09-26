import datetime

from fastapi import APIRouter, Depends

from dependencies import UOWDep, auth_service
from models.schema import ApiResponse, ScheduleSchemaDayAvailability
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
