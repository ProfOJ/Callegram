from fastapi import APIRouter, Depends

from dependencies import UOWDep, auth_service
from models.schema import UserSchemaAuth, ApiResponse, UserSchemaProfileUpdate
from models.view import User
from services.auth import AuthService
from services.user import UserService

router = APIRouter()


@router.post("/auth")
async def user_auth(
        user_auth_data: UserSchemaAuth,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
) -> ApiResponse:
    """
    User authentication

    This method is used to authenticate a user. If user doesn't exist, it is created.

    :param user_auth_data: user auth data
    :param uow: unit of work instance
    :param auth: auth service
    :return: api response with user data
    """
    user = await UserService.get_user(uow, auth.init_data.user.id)

    if not user:
        await UserService().register_user(uow, User(
            id=auth.init_data.user.id,
            name=auth.init_data.user.first_name,
            timezone=user_auth_data.timezone,
            notification_time=[],  # default notification time is decided by the service
            schedule=None
        ))
        user = await UserService.get_user(uow, auth.init_data.user.id)

    return ApiResponse(
        success=True,
        message="User authenticated",
        data={
            "user": User(
                id=user.id,
                name=user.name,
                timezone=user.timezone,
                notification_time=user.notification_time,
                schedule=user.schedule
            )
        }
    )


@router.get("/info/{user_id}")
async def get_user_info(
        user_id: int,
        uow: UOWDep,
        _: AuthService = Depends(auth_service),
) -> ApiResponse:
    """
    Get user info

    This method is used to get user info by id on the "New event" screen.

    :param user_id: user id as integer
    :param uow: unit of work instance
    :param _: auth service (not used)
    :return: api response with user data without notification time
    """
    user = await UserService.get_user(uow, user_id)

    if not user:
        return ApiResponse(
            success=False,
            message="User not found",
        )

    return ApiResponse(
        success=True,
        message="User info retrieved",
        data={
            "user": User(
                id=user.id,
                name=user.name,
                timezone=user.timezone,
                notification_time=[],
                schedule=user.schedule
            )
        }
    )


@router.post("/update/{user_id}")
async def update_user_info(
        user_id: int,
        user_data: UserSchemaProfileUpdate,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
) -> ApiResponse:
    """
    Update user info

    This method is used to update user info on the "Profile" screen.

    :param user_id: user id as integer
    :param user_data: new user data
    :param uow: unit of work instance
    :param auth: auth service
    :return: api response with new user data
    """
    if user_id != auth.init_data.user.id:
        return ApiResponse(
            success=False,
            message="You are not authorized to update this user",
        )

    user = await UserService.get_user(uow, user_id)

    if not user:
        return ApiResponse(
            success=False,
            message="User not found",
        )

    await UserService().update_user_profile(uow, user_id, user_data)

    user = await UserService.get_user(uow, user_id)

    return ApiResponse(
        success=True,
        message="User updated",
        data={
            "user": user
        }
    )
