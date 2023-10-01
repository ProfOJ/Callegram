from datetime import timezone, timedelta

from aiogram import Bot
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.client.telegram import TelegramAPIServer
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

from config import ENVIRONMENT, WEB_APP_HOST
from models.view import CalendarEvent


class TelegramBotService:
    def __init__(self, token: str, ):
        environment_path = 'test/' if ENVIRONMENT == "test" else ''
        session = AiohttpSession(
            api=TelegramAPIServer(
                base='https://api.telegram.org/bot{token}/' + environment_path + '{method}',
                file='https://api.telegram.org/file/bot{token}' + environment_path + '/{path}'
            )
        )

        self.bot = Bot(token=token, session=session)

    async def send_owner_call_booked_notification(self, booking_details: CalendarEvent):
        local_datetime = booking_details.appointment_time.astimezone(
            timezone(timedelta(minutes=booking_details.owner_user.timezone * -1))
        )
        await self.bot.send_message(
            booking_details.owner_user_id,
            f"[{booking_details.invited_user.name}](tg://user?id={booking_details.invited_user_id})" +
            f" has booked a call with you at {local_datetime.strftime('%d/%m/%y %H:%M')}.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(text="View booking", web_app=WebAppInfo(
                    url=f"{WEB_APP_HOST}/eventDetails?eventId={booking_details.id}"))
            ]]),
            parse_mode="Markdown"
        )

    async def send_invited_call_booked_notification(self, booking_details: CalendarEvent):
        local_datetime = booking_details.appointment_time.astimezone(
            timezone(timedelta(minutes=booking_details.invited_user.timezone * -1))
        )
        await self.bot.send_message(
            booking_details.invited_user_id,
            f"You have booked a call with [{booking_details.owner_user.name}](tg://user?id={booking_details.owner_user_id})" +
            f" at {local_datetime.strftime('%d/%m/%y %H:%M')}.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(text="View booking", web_app=WebAppInfo(
                    url=f"{WEB_APP_HOST}/eventDetails?eventId={booking_details.id}"))
            ]]),
            parse_mode="Markdown"
        )

    async def send_call_canceled_by_user_notification(self, canceled_by: int, booking_details: CalendarEvent):
        canceled_by_user = booking_details.owner_user if canceled_by == booking_details.owner_user_id else booking_details.invited_user
        opposite_user = booking_details.invited_user if canceled_by == booking_details.owner_user_id else booking_details.owner_user
        local_datetime = booking_details.appointment_time.astimezone(
            timezone(timedelta(minutes=canceled_by_user.timezone * -1))
        )

        await self.bot.send_message(
            canceled_by,
            f"You have canceled your call at {local_datetime.strftime('%d/%m/%y %H:%M')} with " +
            f"[{opposite_user.name}](tg://user?id={opposite_user.id}).",
            parse_mode="Markdown"
        )

    async def send_call_canceled_of_user_notification(self, canceled_by: int, booking_details: CalendarEvent):
        canceled_by_user = booking_details.owner_user if canceled_by == booking_details.owner_user_id else booking_details.invited_user
        opposite_user = booking_details.invited_user if canceled_by == booking_details.owner_user_id else booking_details.owner_user
        local_datetime = booking_details.appointment_time.astimezone(
            timezone(timedelta(minutes=opposite_user.timezone * -1))
        )
        await self.bot.send_message(
            opposite_user.id,
            f"[{canceled_by_user.name}](tg://user?id={canceled_by_user.id}) has canceled the call with you at " +
            f"{local_datetime.strftime('%d/%m/%y %H:%M')}.",
            parse_mode="Markdown"
        )

    async def send_call_edited_by_user_notification(self, edited_by: int, booking_details: CalendarEvent):
        edited_by_user = booking_details.owner_user if edited_by == booking_details.owner_user_id else booking_details.invited_user
        opposite_user = booking_details.invited_user if edited_by == booking_details.owner_user_id else booking_details.owner_user
        local_datetime = booking_details.appointment_time.astimezone(
            timezone(timedelta(minutes=edited_by_user.timezone * -1))
        )
        await self.bot.send_message(
            edited_by,
            f"Your new call with [{opposite_user.name}](tg://user?id={opposite_user.id}) will be at " +
            f"{local_datetime.strftime('%d/%m/%y %H:%M')}.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(text="View updated booking", web_app=WebAppInfo(
                    url=f"{WEB_APP_HOST}/eventDetails?eventId={booking_details.id}"))
            ]]),
            parse_mode="Markdown"
        )

    async def send_call_edited_of_user_notification(self, edited_by: int, booking_details: CalendarEvent):
        edited_by_user = booking_details.owner_user if edited_by == booking_details.owner_user_id else booking_details.invited_user
        opposite_user = booking_details.invited_user if edited_by == booking_details.owner_user_id else booking_details.owner_user
        local_datetime = booking_details.appointment_time.astimezone(
            timezone(timedelta(minutes=opposite_user.timezone * -1))
        )
        await self.bot.send_message(
            opposite_user.id,
            f"[{edited_by_user.name}](tg://user?id={edited_by_user.id}) has edited the call with you to " +
            f"{local_datetime.strftime('%d/%m/%y %H:%M')}.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(text="View updated booking", web_app=WebAppInfo(
                    url=f"{WEB_APP_HOST}/eventDetails?eventId={booking_details.id}"))
            ]]),
            parse_mode="Markdown"
        )
