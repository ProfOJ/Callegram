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
    """
    User service

    This service is responsible for user-related operations

    List of responsibilities:
    - register user
    - get users
    - get user
    - update user (as per database schema)
    - update user profile (only for name and schedule)
    """

    @staticmethod
    def get_windows(schedule_type: str, weekdays: list[int], timezone: int = 0) -> list[list[int]]:
        """
        Get windows for schedule

        :param schedule_type: one of 'early', 'default', 'late'
        :param weekdays: list of weekdays (0 - Monday, 6 - Sunday)
        :param timezone: timezone offset in minutes
        :return: list of windows for each weekday in the format [[start, end], ...]
        """
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
        """
        Register user

        This method is used to register user in the database. It creates a schedule for the user with default values.

        :param uow: unit of work instance
        :param user: user view model
        :return: user id
        """
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
        """
        Add user

        This method is used to create a user in the database. It doesn't create a schedule for the user.

        :param uow:
        :param user:
        :return:
        """
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
    async def get_users(uow: AbstractUnitOfWork) -> list[User]:
        """
        Get users

        This method is used to get all users from the database.

        :param uow: unit of work instance
        :return: list of users
        """
        async with uow:
            return await uow.users.find_all()

    @staticmethod
    async def get_user(uow: AbstractUnitOfWork, user_id: int) -> User | None:
        """
        Get user

        This method is used to get a user from the database by id. If user doesn't exist, None is returned.

        :param uow: unit of work instance
        :param user_id: user id as integer
        :return: user view model
        """
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
    async def update_user(uow: AbstractUnitOfWork, user_id: int, user: UserSchemaUpdate) -> User:
        """
        Update user

        This method is used to update user in the database. It doesn't update user's schedule.

        :param uow: unit of work instance
        :param user_id: user id as integer
        :param user: user schema with new values
        :return: user view model
        """
        async with uow:
            user = await uow.users.update_one(user_id, {
                'name': user.name,
                'timezone': user.timezone,
                'notification_time': user.notification_time
            })
            await uow.commit()
            return user

    async def update_user_profile(self, uow: AbstractUnitOfWork, user_id: int, user: UserSchemaProfileUpdate) -> int:
        """
        Update user profile

        This method is used to update user's profile in the database. It updates user's schedule and name.

        :param uow: unit of work instance
        :param user_id: user id as integer
        :param user: user schema with new values
        :return: user id
        """
        async with uow:
            await uow.users.update_one(user_id, {'name': user.name})
            schedule = await uow.schedules.find_one_by_user_id(user_id)

            await uow.schedules.update_one(schedule.id, {
                'windows': self.get_windows(user.schedule_type, user.schedule_days, user.timezone),
            })
            await uow.commit()
            return user_id

    @staticmethod
    async def delete_user(uow: AbstractUnitOfWork, user_id: int) -> int:
        """
        Delete user

        This method is used to delete user from the database.

        :param uow: unit of work instance
        :param user_id: user id as integer
        :return: user id
        """
        async with uow:
            user_id = await uow.users.delete_one(user_id)
            await uow.commit()
            return user_id
