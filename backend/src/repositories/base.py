from abc import ABC, abstractmethod

from sqlalchemy import insert, select, Column, delete, update
from sqlalchemy.ext.asyncio import AsyncSession


class AbstractRepository(ABC):
    @abstractmethod
    async def add_one(self, data):
        raise NotImplementedError

    @abstractmethod
    async def find_all(self):
        raise NotImplementedError

    @abstractmethod
    def find_one(self, id):
        raise NotImplementedError

    @abstractmethod
    def find_one_or_none(self, id):
        raise NotImplementedError

    @abstractmethod
    async def update_one(self, id, data):
        raise NotImplementedError

    @abstractmethod
    async def delete_one(self, id):
        raise NotImplementedError

    @abstractmethod
    async def find_one_by(self, column, value):
        raise NotImplementedError

    @abstractmethod
    async def find_one_or_none_by(self, column, value):
        raise NotImplementedError


class SQLAlchemyRepository(AbstractRepository):
    model = None

    def __init__(self, session: AsyncSession):
        self.session = session

    async def add_one(self, data: dict) -> str | int:
        stmt = insert(self.model).values(**data).returning(self.model.id)
        res = await self.session.execute(stmt)
        return res.scalar_one()

    async def find_all(self):
        stmt = select(self.model)
        res = await self.session.execute(stmt)
        return [row[0].to_read_model() for row in res.all()]

    async def find_one(self, id: str):
        stmt = select(self.model).where(self.model.id == id)
        res = await self.session.execute(stmt)
        return res.scalar_one()

    async def find_one_or_none(self, id: str):
        stmt = select(self.model).where(self.model.id == id)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def update_one(self, id: str, data: dict):
        stmt = update(self.model).where(self.model.id == id).values(**data)
        res = await self.session.execute(stmt)
        return res

    async def delete_one(self, id: str):
        stmt = delete(self.model).where(self.model.id == id)
        res = await self.session.execute(stmt)
        return res

    async def find_one_by(self, column: Column, value):
        stmt = select(self.model).where(column == value)
        res = await self.session.execute(stmt)
        return res.scalar_one()

    async def find_one_or_none_by(self, column: Column, value):
        stmt = select(self.model).where(column == value)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()
