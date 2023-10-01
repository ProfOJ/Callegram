from models.schema import UserSchemaUpdate, UserSchemaProfileUpdate
from models.view import Schedule, User
from unit_of_work.unit_of_work import AbstractUnitOfWork

SCHEDULE_TYPE_EARLY = {
    'start': 7 * 60,
    'end': 16 * 60
}

SCHEDULE_TYPE_DEFAULT = {
    'start': 9 * 60,
    'end': 18 * 60
}

SCHEDULE_TYPE_LATE = {
    'start': 12 * 60,
    'end': 21 * 60
}


class UserService:

    @staticmethod
    def get_windows(schedule_type: str, weekdays: list[int], timezone: int = 0):
        windows = []
        for day in range(7):
            if day not in weekdays:
                windows.append([0, 0])
                continue

            match schedule_type:
                case 'early':
                    windows.append([SCHEDULE_TYPE_EARLY['start'] + timezone, SCHEDULE_TYPE_EARLY['end'] + timezone])
                case 'default':
                    windows.append([SCHEDULE_TYPE_DEFAULT['start'] + timezone, SCHEDULE_TYPE_DEFAULT['end'] + timezone])
                case 'late':
                    windows.append([SCHEDULE_TYPE_LATE['start'] + timezone, SCHEDULE_TYPE_LATE['end'] + timezone])
                case _:
                    windows.append([0, 0])

        return windows

    async def register_user(self, uow: AbstractUnitOfWork, user: User) -> int:
        async with uow:
            user_id = await uow.users.add_one({
                'id': user.id,
                'name': user.name,
                'timezone': user.timezone,
                'notification_time': [15, 30]  # default notification time
            })
            await uow.schedules.add_one({
                'user_id': user_id,
                'windows': self.get_windows('default', list(range(5)), user.timezone)
            })
            await uow.commit()
            return user_id

    @staticmethod
    async def add_user(uow: AbstractUnitOfWork, user: User) -> int:
        async with uow:
            user_id = await uow.users.add_one({
                'id': user.id,
                'name': user.name,
                'timezone': user.timezone,
                'notification_time': user.notification_time
            })
            await uow.commit()
            return user_id

    @staticmethod
    async def get_users(uow: AbstractUnitOfWork):
        async with uow:
            return await uow.users.find_all()

    @staticmethod
    async def get_user(uow: AbstractUnitOfWork, user_id: int):
        async with uow:
            user = await uow.users.find_one_or_none(user_id)

            if not user:
                return None

            return User(
                id=user.id,
                name=user.name,
                timezone=user.timezone,
                notification_time=user.notification_time,
                schedule=Schedule(
                    user_id=user.schedule.user_id,
                    windows=user.schedule.windows
                ) if user.schedule else None
            )

    @staticmethod
    async def update_user(uow: AbstractUnitOfWork, user_id: int, user: UserSchemaUpdate):
        async with uow:
            user = await uow.users.update_one(user_id, {
                'name': user.name,
                'timezone': user.timezone,
                'notification_time': user.notification_time
            })
            await uow.commit()
            return user

    async def update_user_profile(self, uow: AbstractUnitOfWork, user_id: int, user: UserSchemaProfileUpdate):
        async with uow:
            await uow.users.update_one(user_id, {'name': user.name})
            schedule = await uow.schedules.find_one_by_user_id(user_id)

            await uow.schedules.update_one(schedule.id, {
                'windows': self.get_windows(user.schedule_type, user.schedule_days, user.timezone),
            })
            await uow.commit()
            return user_id

    @staticmethod
    async def delete_user(uow: AbstractUnitOfWork, user_id: int):
        async with uow:
            user_id = await uow.users.delete_one(user_id)
            await uow.commit()
            return user_id
