from sqlalchemy import Column
from sqlalchemy.orm import joinedload, selectinload

from database.models import User
from .base import SQLAlchemyRepository


class UsersRepository(SQLAlchemyRepository):
    model = User

    async def find_one(self, id: str, **kwargs):
        return await super().find_one(id, options=joinedload(User.schedule))

    async def find_one_or_none(self, id: str, **kwargs):
        return await super().find_one_or_none(id, options=joinedload(User.schedule))

    async def find_one_by(self, column: Column, value, **kwargs):
        return await super().find_one_by(column, value, options=joinedload(User.schedule))

    async def find_one_or_none_by(self, column: Column, value, **kwargs):
        return await super().find_one_or_none_by(column, value, options=joinedload(User.schedule))

    async def find_all(self, **kwargs):
        return await super().find_all(**kwargs)
