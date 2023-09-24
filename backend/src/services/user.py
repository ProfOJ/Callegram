from models.schema import UserSchemaUpdate, User
from unit_of_work.unit_of_work import AbstractUnitOfWork


class UserService:

    @staticmethod
    async def register_user(uow: AbstractUnitOfWork, user: User) -> int:
        async with uow:
            user_id = await uow.users.add_one({
                'id': user.id,
                'name': user.name,
                'timezone': user.timezone,
                'notification_time': [15, 30]  # default notification time
            })
            await uow.schedules.add_one({
                'user_id': user_id,
                'windows': [[9 * 60, 19 * 60] for _ in range(7)],  # 9:00 - 19:00 for every day
            })
            return user_id

    @staticmethod
    async def add_user(uow: AbstractUnitOfWork, user: User) -> int:
        async with uow:
            return await uow.users.add_one({
                'id': user.id,
                'name': user.name,
                'timezone': user.timezone,
                'notification_time': user.notification_time
            })

    @staticmethod
    async def get_users(uow: AbstractUnitOfWork):
        async with uow:
            return await uow.users.find_all()

    @staticmethod
    async def get_user(uow: AbstractUnitOfWork, user_id: str):
        async with uow:
            return await uow.users.find_one_or_none(user_id)

    @staticmethod
    async def update_user(uow: AbstractUnitOfWork, user_id: str, user: UserSchemaUpdate):
        async with uow:
            return await uow.users.update_one(user_id, {
                'name': user.name,
                'timezone': user.timezone,
                'notification_time': user.notification_time
            })

    @staticmethod
    async def delete_user(uow: AbstractUnitOfWork, user_id: str):
        async with uow:
            return await uow.users.delete_one(user_id)
