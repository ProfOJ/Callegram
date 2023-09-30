import datetime

from config import BOT_TOKEN
from models.schema import CalendarEventSchemaAdd, CalendarEventSchemaUpdate
from services.bot import TelegramBotService

from unit_of_work.unit_of_work import AbstractUnitOfWork


class CalendarEventService:

    @staticmethod
    async def get_events(owner_id: int, uow: AbstractUnitOfWork):
        async with uow:
            return await uow.calendar_events.find_all_by_owner(owner_id)

    @staticmethod
    async def get_events_for_date(user_id: int, date: datetime.date, uow: AbstractUnitOfWork, only_owner: bool = False):
        async with uow:
            if only_owner:
                return await uow.calendar_events.find_all_at_date(user_id, date)
            return await uow.calendar_events.find_all_at_date_any_user(user_id, date)

    @staticmethod
    async def get_events_by_user_id(user_id: int, uow: AbstractUnitOfWork):
        async with uow:
            return await uow.calendar_events.find_all_by_user_id(user_id)

    @staticmethod
    async def get_event(event_id: str, uow: AbstractUnitOfWork):
        async with uow:
            return await uow.calendar_events.find_one_or_none(event_id)

    @staticmethod
    async def add_event(uow: AbstractUnitOfWork, event: CalendarEventSchemaAdd):
        async with uow:
            event_id = await uow.calendar_events.add_one({
                'owner_user_id': event.owner_user_id,
                'invited_user_id': event.invited_user_id,
                'appointment_time': event.appointment_time.replace(tzinfo=None),
                'duration': event.duration,
            })
            await uow.commit()
            event = await CalendarEventService.get_event(event_id, uow)
            telegram_bot_service = TelegramBotService(BOT_TOKEN, test_server=True)
            await telegram_bot_service.send_owner_call_booked_notification(event)
            await telegram_bot_service.send_invited_call_booked_notification(event)
            return event_id

    @staticmethod
    async def delete_event(uow: AbstractUnitOfWork, event_id: str, deleted_by_user_id: int):
        async with uow:
            event = await CalendarEventService.get_event(event_id, uow)
            event_id = await uow.calendar_events.delete_one(event_id)
            telegram_bot_service = TelegramBotService(BOT_TOKEN, test_server=True)
            await telegram_bot_service.send_call_canceled_by_user_notification(deleted_by_user_id, event)
            await telegram_bot_service.send_call_canceled_of_user_notification(deleted_by_user_id, event)
            await uow.commit()
            return event_id

    @staticmethod
    async def edit_event(uow: AbstractUnitOfWork, event_id: str, event: CalendarEventSchemaUpdate,
                         edited_by_user_id: int):
        async with uow:
            await uow.calendar_events.update_one(event_id, {
                'appointment_time': event.appointment_time.replace(tzinfo=None),
                'duration': event.duration,
            })
            event = await CalendarEventService.get_event(event_id, uow)
            telegram_bot_service = TelegramBotService(BOT_TOKEN, test_server=True)
            await telegram_bot_service.send_call_edited_by_user_notification(edited_by_user_id, event)
            await telegram_bot_service.send_call_edited_of_user_notification(edited_by_user_id, event)
            await uow.commit()
            return event
