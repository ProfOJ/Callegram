from typing import Type

from models.schema import UserSchemaUpdate, User
from repositories.base import AbstractRepository


class UserService:
    def __init__(self, users_repo: Type[AbstractRepository]):
        self.users_repo: AbstractRepository = users_repo()

    async def add_user(self, user: User) -> str:
        return await self.users_repo.add_one({
            'id': user.id,
            'name': user.name,
            'timezone': user.timezone,
            'notification_time': user.notification_time
        })

    async def get_users(self):
        return await self.users_repo.find_all()

    async def get_user(self, user_id: str):
        return await self.users_repo.find_one_or_none(user_id)

    async def update_user(self, user_id: str, user: UserSchemaUpdate):
        return await self.users_repo.update_one(user_id, {
            'name': user.name,
            'timezone': user.timezone,
            'notification_time': user.notification_time
        })

    async def delete_user(self, user_id: str):
        return await self.users_repo.delete_one(user_id)
