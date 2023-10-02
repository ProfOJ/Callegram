import asyncio
from datetime import timezone, timedelta

from aiogram import Bot
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from bot.bot import get_bot_instance
from config import WEB_APP_HOST
from models.view import CalendarEvent


class TelegramNotificationService:

    def __init__(self, bot: Bot):
        self.bot = bot

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


def send_call_reminder_notification(**kwargs):
    bot = get_bot_instance()
    booking_details: CalendarEvent = kwargs.get("booking_details")
    minutes_before_start: int = kwargs.get("minutes_before_start")
    loop = asyncio.new_event_loop()
    loop.run_until_complete(
        bot.send_message(
            booking_details.owner_user_id,
            f"Your call with [{booking_details.invited_user.name}](tg://user?id={booking_details.invited_user_id}) "
            f"will start in {minutes_before_start} minutes.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(text="View booking", web_app=WebAppInfo(
                    url=f"{WEB_APP_HOST}/eventDetails?eventId={booking_details.id}"))
            ]]),
            parse_mode="Markdown"
        )
    )
    loop.run_until_complete(
        bot.send_message(
            booking_details.invited_user_id,
            f"Your call with [{booking_details.owner_user.name}](tg://user?id={booking_details.owner_user_id}) "
            f"will start in {minutes_before_start} minutes.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(text="View booking", web_app=WebAppInfo(
                    url=f"{WEB_APP_HOST}/eventDetails?eventId={booking_details.id}"))
            ]]),
            parse_mode="Markdown"
        )
    )


def send_call_started_notification(**kwargs):
    bot = get_bot_instance()
    booking_details: CalendarEvent = kwargs.get("booking_details")
    loop = asyncio.new_event_loop()
    loop.run_until_complete(
        bot.send_message(
            booking_details.owner_user_id,
            f"[{booking_details.invited_user.name}](tg://user?id={booking_details.invited_user_id}) will call you "
            f"right now. Please wait.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(
                    text="Go to chat",
                    url=f"tg://user?id={booking_details.invited_user_id}"
                )
            ]]),
            parse_mode="Markdown"
        )
    )
    owner_name = f"[{booking_details.owner_user.name}](tg://user?id={booking_details.owner_user_id})"
    loop.run_until_complete(
        bot.send_message(
            booking_details.invited_user_id,
            f"Please call {owner_name}. {owner_name} is waiting for you right now.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(
                    text="Call this user",
                    url=f"tg://user?id={booking_details.owner_user_id}"
                )
            ]]),
            parse_mode="Markdown"
        )
    )
