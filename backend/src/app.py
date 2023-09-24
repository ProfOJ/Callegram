from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from dependencies import auth_service, UOWDep
from models.schema import User, UserSchemaAuth
from services.auth import AuthService
from services.user import UserService

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PATCH", "PUT"],
    allow_headers=["*"],
)


@app.post("/auth")
async def root(
        user_auto_data: UserSchemaAuth,
        uow: UOWDep,
        auth: AuthService = Depends(auth_service),
):
    user = await UserService.get_user(uow, auth.init_data.user.id)

    if not user:
        await UserService.register_user(uow, User(
            id=auth.init_data.user.id,
            name=auth.init_data.user.first_name,
            timezone=user_auto_data.timezone,
            notification_time=[]  # default notification time is decided by the service
        ))

    return {
        "status": "ok",
        "message": "User authenticated",
        "data": {
            "user_id": auth.init_data.user.id,
            "first_name": auth.init_data.user.first_name,
        }
    }
