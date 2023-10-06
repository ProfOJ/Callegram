from abc import ABC, abstractmethod

from database.database import async_session_maker
from repositories.event import CalendarEventsRepository
from repositories.schedule import SchedulesRepository
from repositories.user import UsersRepository


class AbstractUnitOfWork(ABC):
    users: UsersRepository
    schedules: SchedulesRepository
    calendar_events: CalendarEventsRepository

    @abstractmethod
    def __init__(self):
        ...

    @abstractmethod
    async def __aenter__(self):
        ...

    @abstractmethod
    async def __aexit__(self, *args):
        ...

    @abstractmethod
    async def commit(self):
        ...

    @abstractmethod
    async def rollback(self):
        ...


class UnitOfWork:
    """
    Unit of work pattern implementation
    """

    def __init__(self):
        self.session_factory = async_session_maker

    async def __aenter__(self):
        self.session = self.session_factory()

        self.users: UsersRepository = UsersRepository(self.session)
        self.schedules: SchedulesRepository = SchedulesRepository(self.session)
        self.calendar_events: CalendarEventsRepository = CalendarEventsRepository(self.session)

    async def __aexit__(self, *args):
        await self.rollback()
        await self.session.close()

    async def commit(self):
        await self.session.commit()

    async def rollback(self):
        await self.session.rollback()
