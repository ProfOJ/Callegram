import datetime

from models.view import Schedule
from unit_of_work.unit_of_work import AbstractUnitOfWork


class ScheduleService:

    @staticmethod
    async def get_schedules(uow: AbstractUnitOfWork):
        async with uow:
            return await uow.schedules.find_all()

    @staticmethod
    async def get_schedule(uow: AbstractUnitOfWork, schedule_id: str):
        async with uow:
            return await uow.schedules.find_one_or_none(schedule_id)

    @staticmethod
    async def add_schedule(uow: AbstractUnitOfWork, schedule: Schedule):
        async with uow:
            schedule_id = await uow.schedules.add_one({
                'user_id': schedule.user_id,
                'windows': schedule.windows,
            })
            await uow.commit()
            return schedule_id

    @staticmethod
    async def update_schedule(uow: AbstractUnitOfWork, schedule_id: str, schedule: Schedule):
        async with uow:
            schedule = await uow.schedules.update_one(schedule_id, {
                'user_id': schedule.user_id,
                'windows': schedule.windows,
            })
            await uow.commit()
            return schedule

    @staticmethod
    async def delete_schedule(uow: AbstractUnitOfWork, schedule_id: str):
        async with uow:
            schedule_id = await uow.schedules.delete_one(schedule_id)
            await uow.commit()
            return schedule_id

    @staticmethod
    async def find_one_by_user_id(uow: AbstractUnitOfWork, user_id: int) -> Schedule:
        async with uow:
            schedule = await uow.schedules.find_one_by_user_id(user_id)
            return Schedule(
                user_id=schedule.user_id,
                windows=schedule.windows
            )

    @staticmethod
    async def get_date_availability(uow: AbstractUnitOfWork, user_id: int, date: datetime.date):
        async with uow:
            schedule = await uow.schedules.find_one_by_user_id(user_id)
            if not schedule:
                return None

            events = await uow.calendar_events.find_all_at_date(user_id, date)

            availability = {}
            weekday = date.weekday()
            start_hour = schedule.windows[weekday][0] // 60
            end_hour = schedule.windows[weekday][1] // 60

            for hour in range(start_hour, end_hour):
                availability[hour] = [0, 30]

            for event in events:
                event_start_hour = event.appointment_time.hour
                event_start_minute = event.appointment_time.minute

                if len(availability[event_start_hour]) == 2:
                    availability[event_start_hour].remove(event_start_minute)
                else:
                    availability.pop(event_start_hour)

            return availability
