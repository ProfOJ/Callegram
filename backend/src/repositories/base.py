from abc import ABC, abstractmethod

from sqlalchemy import insert, select, Column, delete, update

from database.database import async_session_maker


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

    async def add_one(self, data: dict) -> str:
        async with async_session_maker() as session:
            stmt = insert(self.model).values(**data).returning(self.model.id)
            res = await session.execute(stmt)
            await session.commit()
            return res.scalar_one()

    async def find_all(self):
        async with async_session_maker() as session:
            stmt = select(self.model)
            res = await session.execute(stmt)
            res = [row[0].to_read_model() for row in res.all()]
            return res

    async def find_one(self, id: str):
        async with async_session_maker() as session:
            stmt = select(self.model).where(self.model.id == id)
            res = await session.execute(stmt)
            res = res.scalar_one()
            return res

    async def find_one_or_none(self, id: str):
        async with async_session_maker() as session:
            stmt = select(self.model).where(self.model.id == id)
            res = await session.execute(stmt)
            res = res.scalar_one_or_none()
            return res

    async def update_one(self, id: str, data: dict):
        async with async_session_maker() as session:
            stmt = update(self.model).where(self.model.id == id).values(**data)
            res = await session.execute(stmt)
            await session.commit()
            return res

    async def delete_one(self, id: str):
        async with async_session_maker() as session:
            stmt = delete(self.model).where(self.model.id == id)
            res = await session.execute(stmt)
            await session.commit()
            return res

    async def find_one_by(self, column: Column, value):
        async with async_session_maker() as session:
            stmt = select(self.model).where(column == value)
            res = await session.execute(stmt)
            res = res.scalar_one()
            return res

    async def find_one_or_none_by(self, column: Column, value):
        async with async_session_maker() as session:
            stmt = select(self.model).where(column == value)
            res = await session.execute(stmt)
            res = res.scalar_one_or_none()
            return res
