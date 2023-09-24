from models.schema import Schedule
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
