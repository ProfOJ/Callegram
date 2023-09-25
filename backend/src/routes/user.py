from fastapi import APIRouter, Depends

from dependencies import UOWDep, auth_service
from models.schema import UserSchemaAuth, ApiResponse
from models.view import User
from services.auth import AuthService
from services.schedule import ScheduleService
from services.user import UserService

router = APIRouter()


@router.post("/auth")
async def root(
        user_auto_data: UserSchemaAuth,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
) -> ApiResponse:
    user = await UserService.get_user(uow, auth.init_data.user.id)

    if not user:
        await UserService.register_user(uow, User(
            id=auth.init_data.user.id,
            name=auth.init_data.user.first_name,
            timezone=user_auto_data.timezone,
            notification_time=[]  # default notification time is decided by the service
        ))
        schedule = await ScheduleService.find_one_by_user_id(uow, auth.init_data.user.id)
    else:
        schedule = user.schedule

    return ApiResponse(
        success=True,
        message="User authenticated",
        data={
            "user": User(
                id=auth.init_data.user.id,
                name=auth.init_data.user.first_name,
                timezone=user_auto_data.timezone,
                notification_time=user.notification_time,
                schedule=schedule
            )
        }
    )
