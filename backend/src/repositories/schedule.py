from sqlalchemy.orm import joinedload

from database.models import Schedule
from repositories.base import SQLAlchemyRepository


class SchedulesRepository(SQLAlchemyRepository):
    model = Schedule

    async def find_one(self, id: str, **kwargs):
        return await super().find_one(id, options=joinedload(Schedule.user))

    async def find_one_or_none(self, id: str, **kwargs):
        return await super().find_one_or_none(id, options=joinedload(Schedule.user))

    async def find_one_by_user_id(self, user_id: str):
        return await super().find_one_or_none_by(self.model.user_id, user_id, options=joinedload(Schedule.user))
