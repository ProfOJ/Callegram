import datetime

from models.schema import CalendarEventSchemaAdd, CalendarEventSchemaUpdate
from database.models import CalendarEvent as CalendarEventEntity
from unit_of_work.unit_of_work import AbstractUnitOfWork


class CalendarEventService:
    """
    Calendar event service

    This class is used to perform operations on calendar events.

    List of responsibilities:
    - get events
    - get single event by id
    - get events for date by user id (only owner or all)
    - get events by user id (only owner)
    - add event
    - update event
    - delete event
    """

    @staticmethod
    async def get_events(owner_id: int, uow: AbstractUnitOfWork) -> list[CalendarEventEntity]:
        """
        Get events

        This method is used to get all events of a user from the database.

        :param owner_id: user id as integer
        :param uow: unit of work instance
        :return: list of events
        """
        async with uow:
            return await uow.calendar_events.find_all_by_owner(owner_id)

    @staticmethod
    async def get_events_for_date(
            user_id: int,
            date: datetime.date,
            uow: AbstractUnitOfWork,
            only_owner: bool = False
    ) -> list[CalendarEventEntity]:
        """
        Get events for date

        This method is used to get all events of a user for a specific date from the database. If only_owner is True,
        only events where the user is the owner are returned. Otherwise, all events where the user is either the owner
        or the invited user are returned.

        :param user_id: user id as integer
        :param date: date with no time
        :param uow: unit of work instance
        :param only_owner: boolean value indicating whether to return only events where the user is the owner or all
        :return: list of events
        """
        async with uow:
            if only_owner:
                return await uow.calendar_events.find_all_at_date(user_id, date)
            return await uow.calendar_events.find_all_at_date_any_user(user_id, date)

    @staticmethod
    async def get_events_by_user_id(user_id: int, uow: AbstractUnitOfWork) -> list[CalendarEventEntity]:
        """
        Get events by user id

        This method is used to get all events where the user is the owner from the database.

        :param user_id: user id as integer
        :param uow: unit of work instance
        :return: list of events
        """
        async with uow:
            return await uow.calendar_events.find_all_by_user_id(user_id)

    @staticmethod
    async def get_event(event_id: str, uow: AbstractUnitOfWork) -> CalendarEventEntity | None:
        """
        Get event

        This method is used to get a single event by id from the database. If event doesn't exist, None is returned.

        :param event_id: event id as string
        :param uow: unit of work instance
        :return: event entity
        """
        async with uow:
            return await uow.calendar_events.find_one_or_none(event_id)

    @staticmethod
    async def add_event(uow: AbstractUnitOfWork, event: CalendarEventSchemaAdd) -> CalendarEventEntity:
        """
        Add event

        This method is used to create an event in the database.

        :param uow: unit of work instance
        :param event: event view model
        :return: event entity
        """
        async with uow:
            event_id = await uow.calendar_events.add_one({
                'owner_user_id': event.owner_user_id,
                'invited_user_id': event.invited_user_id,
                'appointment_time': event.appointment_time.replace(tzinfo=None),
                'duration': event.duration,
            })
            await uow.commit()
            return await CalendarEventService.get_event(event_id, uow)

    @staticmethod
    async def delete_event(uow: AbstractUnitOfWork, event_id: str) -> str:
        """
        Delete event

        This method is used to delete an event from the database.

        :param uow: unit of work instance
        :param event_id: event id as string
        :return: event id as string
        """
        async with uow:
            await uow.calendar_events.delete_one(event_id)
            await uow.commit()
            return event_id

    @staticmethod
    async def edit_event(
            uow: AbstractUnitOfWork,
            event_id: str,
            event: CalendarEventSchemaUpdate
    ) -> CalendarEventEntity:
        """
        Edit event

        This method is used to update an event in the database.

        :param uow: unit of work instance
        :param event_id: event id as string
        :param event: event view model
        :return: event entity
        """
        async with uow:
            await uow.calendar_events.update_one(event_id, {
                'appointment_time': event.appointment_time.replace(tzinfo=None),
                'duration': event.duration,
            })
            await uow.commit()
            event = await CalendarEventService.get_event(event_id, uow)
            return event
