import datetime

from sqlalchemy.orm import joinedload
from sqlalchemy.sql.operators import or_

from database.models import CalendarEvent as CalendarEventEntity
from models.view import CalendarEvent
from repositories.base import SQLAlchemyRepository


class CalendarEventsRepository(SQLAlchemyRepository):
    model = CalendarEventEntity

    async def find_all_by_owner(self, owner_id: int):
        events = await super().find_all_by(
            self.model.owner_user_id,
            owner_id
        )
        return [
            CalendarEvent(
                id=str(event.id),
                owner_user_id=event.owner_user_id,
                invited_user_id=event.invited_user_id,
                appointment_time=event.appointment_time,
                duration=event.duration
            ) for event in events
        ]

    async def find_all_by_user_id(self, user_id: int):
        events = await super().find_all_by_filter(
            [or_(self.model.owner_user_id == user_id, self.model.invited_user_id == user_id)]
        )
        print(events)
        return [
            CalendarEvent(
                id=str(event.id),
                owner_user_id=event.owner_user_id,
                invited_user_id=event.invited_user_id,
                appointment_time=event.appointment_time,
                duration=event.duration
            ) for event in events
        ]

    async def find_one(self, id: str, **kwargs):
        event = await super().find_one(id)
        return CalendarEvent(
            id=str(event.id),
            owner_user_id=event.owner_user_id,
            invited_user_id=event.invited_user_id,
            appointment_time=event.appointment_time,
            duration=event.duration
        )

    async def find_one_or_none(self, id: str, **kwargs):
        event = await super().find_one_or_none(id)

        return CalendarEvent(
            id=str(event.id),
            owner_user_id=event.owner_user_id,
            invited_user_id=event.invited_user_id,
            appointment_time=event.appointment_time,
            duration=event.duration
        ) if event else None

    async def find_one_or_none_by_user_id(self, user_id: int):
        event = await super().find_one_or_none_by(self.model.user_id, user_id)

        return CalendarEvent(
            id=str(event.id),
            owner_user_id=event.owner_user_id,
            invited_user_id=event.invited_user_id,
            appointment_time=event.appointment_time,
            duration=event.duration
        ) if event else None

    async def find_one_by_user_id(self, event_id: str, user_id: int):
        event = await super().find_one_by_filter([
            (self.model.id == event_id), (self.model.owner_user_id == user_id)
        ])

        return CalendarEvent(
            id=str(event.id),
            owner_user_id=event.owner_user_id,
            invited_user_id=event.invited_user_id,
            appointment_time=event.appointment_time,
            duration=event.duration
        ) if event else None

    async def find_all_at_date(self, user_id: int, date: datetime.date):
        events = await super().find_all_by_filter([
            (self.model.owner_user_id == user_id),
            (self.model.appointment_time >= date),
            (self.model.appointment_time < date + datetime.timedelta(days=1))
        ])

        return [
            CalendarEvent(
                id=str(event.id),
                owner_user_id=event.owner_user_id,
                invited_user_id=event.invited_user_id,
                appointment_time=event.appointment_time,
                duration=event.duration
            ) for event in events
        ]

    async def find_all_at_date_any_user(self, user_id: int, date: datetime.date):
        events = await super().find_all_by_filter([
            (self.model.owner_user_id == user_id),
            (self.model.invited_user_id == user_id),
            (self.model.appointment_time >= date),
            (self.model.appointment_time < date + datetime.timedelta(days=1))
        ], options=[
            joinedload(self.model.owner_user)
        ])

        return [
            CalendarEvent(
                id=str(event.id),
                owner_user_id=event.owner_user_id,
                invited_user_id=event.invited_user_id,
                appointment_time=event.appointment_time,
                duration=event.duration
            ) for event in events
        ]
