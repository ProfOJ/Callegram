from database.models import Schedule
from repositories.base import SQLAlchemyRepository


class SchedulesRepository(SQLAlchemyRepository):
    model = Schedule

    async def find_one_by_user_id(self, user_id: int):
        return await self.find_one_by(Schedule.user_id, user_id)
