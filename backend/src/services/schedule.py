import datetime

from models.view import Schedule
from database.models import Schedule as ScheduleEntity
from unit_of_work.unit_of_work import AbstractUnitOfWork


class ScheduleService:
    """
    Schedule service

    This class is used to perform operations on schedules.

    List of responsibilities:
    - get schedules
    - get schedule
    - add schedule
    - update schedule
    - delete schedule
    - find schedule by user id
    - get date availability
    - get busy days
    """

    @staticmethod
    async def get_schedules(uow: AbstractUnitOfWork) -> list[Schedule]:
        """
        Get schedules

        This method is used to get all schedules from the database.

        :param uow: unit of work instance
        :return: list of schedules
        """
        async with uow:
            return await uow.schedules.find_all()

    @staticmethod
    async def get_schedule(uow: AbstractUnitOfWork, schedule_id: str) -> Schedule | None:
        """
        Get schedule

        This method is used to get a schedule from the database by id. If schedule doesn't exist, None is returned.

        :param uow: unit of work instance
        :param schedule_id: schedule id as string
        :return: schedule view model
        """
        async with uow:
            return await uow.schedules.find_one_or_none(schedule_id)

    @staticmethod
    async def add_schedule(uow: AbstractUnitOfWork, schedule: Schedule) -> str:
        """
        Add schedule

        This method is used to create a schedule in the database.

        :param uow: unit of work instance
        :param schedule: schedule view model
        :return: schedule id as string
        """
        async with uow:
            schedule_id = await uow.schedules.add_one({
                'user_id': schedule.user_id,
                'windows': schedule.windows,
            })
            await uow.commit()
            return str(schedule_id)

    @staticmethod
    async def update_schedule(uow: AbstractUnitOfWork, schedule_id: str, schedule: Schedule) -> ScheduleEntity:
        """
        Update schedule

        This method is used to update a schedule in the database.

        :param uow: unit of work instance
        :param schedule_id: schedule id as string
        :param schedule: schedule view model
        :return: schedule entity
        """
        async with uow:
            schedule = await uow.schedules.update_one(schedule_id, {
                'user_id': schedule.user_id,
                'windows': schedule.windows,
            })
            await uow.commit()
            return schedule

    @staticmethod
    async def delete_schedule(uow: AbstractUnitOfWork, schedule_id: str) -> str:
        """
        Delete schedule

        This method is used to delete a schedule from the database.

        :param uow: unit of work instance
        :param schedule_id: schedule id as string
        :return: schedule id as string
        """
        async with uow:
            schedule_id = await uow.schedules.delete_one(schedule_id)
            await uow.commit()
            return schedule_id

    @staticmethod
    async def find_one_by_user_id(uow: AbstractUnitOfWork, user_id: int) -> Schedule:
        """
        Find schedule by user id

        This method is used to find a schedule by user id.

        :param uow: unit of work instance
        :param user_id: user id as integer
        :return: schedule view model
        """
        async with uow:
            schedule = await uow.schedules.find_one_by_user_id(user_id)
            return Schedule(
                user_id=schedule.user_id,
                windows=schedule.windows
            )

    @staticmethod
    async def get_date_availability(
            uow: AbstractUnitOfWork,
            user_id: int,
            date: datetime.date
    ) -> dict[int, list[int]] | None:
        """
        Get date availability

        This method is used to get date availability for a user. If user doesn't have a schedule, None is returned. If
        user has a schedule, but there are no events at the specified date, the schedule is returned. If there are any
        events at the specified date, the schedule is returned with the events removed from the availability.

        :param uow: unit of work instance
        :param user_id: user id as integer
        :param date: date without time
        :return: list of available hours or None in the format {hour: [minute, minute]}
        """
        async with uow:
            schedule = await uow.schedules.find_one_by_user_id(user_id)
            if not schedule:
                return None

            events = await uow.calendar_events.find_all_at_date_any_user(user_id, date)

            availability = {}
            weekday = date.weekday()
            start_hour = schedule.windows[weekday][0] // 60
            end_hour = schedule.windows[weekday][1] // 60

            for hour in range(start_hour, end_hour):
                availability[hour] = [0, 30]

            for event in events:
                event_start_hour = event.appointment_time.hour
                event_start_minute = event.appointment_time.minute

                if event_start_hour not in availability:
                    continue

                if len(availability[event_start_hour]) == 2:
                    availability[event_start_hour].remove(event_start_minute)
                else:
                    availability.pop(event_start_hour)

            return availability

    @staticmethod
    async def get_busy_days(
            uow: AbstractUnitOfWork,
            user_id: int,
            from_date: datetime.date,
            to_date: datetime.date
    ) -> list[datetime.date]:
        """
        Get busy days

        This method is used to get busy days for a user. If user doesn't have any events at the specified date range,
        an empty list is returned. If user has any events at the specified date range, a list of busy days is returned.

        :param uow: unit of work instance
        :param user_id: user id as integer
        :param from_date: start date without time
        :param to_date: end date without time
        :return: list of busy days in the format [date, date]
        """
        async with uow:
            events = await uow.calendar_events.find_all_by_user_id(user_id)

            busy_days = []

            for event in events:
                if from_date <= event.appointment_time.date() <= to_date:
                    if event.appointment_time.date() not in busy_days:
                        busy_days.append(event.appointment_time.date())

            return busy_days
