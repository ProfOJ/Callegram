import asyncio
import random

from aiogram import Dispatcher
from aiogram.types import InlineQuery, InlineKeyboardMarkup, InlineKeyboardButton, \
    InlineQueryResultArticle, InputTextMessageContent, Message, WebAppInfo, BotCommand
from aiogram.filters.command import Command
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from bot.bot import get_bot_instance
from config import WEB_APP_HOST
from routes.events import router as event_router
from routes.schedules import router as schedule_router
from routes.user import router as user_router
from scheduler.scheduler import scheduler

app: FastAPI = FastAPI()

bot_dispatcher = Dispatcher()

bot = get_bot_instance()


@bot_dispatcher.inline_query()
async def inline_query_handler(inline_query: InlineQuery):
    await bot.answer_inline_query(inline_query.id, results=[
        InlineQueryResultArticle(
            id=f"booking_{inline_query.from_user.id}_{random.randint(0, 100000)}",
            thumbnail_url="https://telegra.ph/file/193cf38f7216c7471c4e2.jpg",
            input_message_content=InputTextMessageContent(
                message_text="Book a call with me using the button " \
                             "below[.](https://telegra.ph/file/da6494d3c5ea2c395c855.mp4)",
                parse_mode="Markdown"),
            title="Send your schedule",
            description="Your companion will choose your available slots for calling",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(
                    text="Book a call",
                    url=f"t.me/CallegramBot/book?startapp=user_{inline_query.from_user.id}"
                )
            ]]),
        )
    ])


@bot_dispatcher.message(Command(BotCommand(command="start", description="Start the bot")))
async def start_handler(message: Message):
    await bot.send_video(
        chat_id=message.from_user.id,
        video="https://telegra.ph/file/811e0e49e8a9a04fb4c6c.mp4",
        caption=f"*Let's get started 📆*[\n\n](https://telegra.ph/file/811e0e49e8a9a04fb4c6c.mp4)Tap the button below "
                f"to check your current calls & setup your schedule!",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(
                text="Open Calendar",
                web_app=WebAppInfo(url=WEB_APP_HOST)
            )
        ]]),
        parse_mode="Markdown"
    )


scheduler.start()


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(bot_dispatcher.start_polling(bot))


@app.on_event("shutdown")
async def shutdown_event():
    await bot_dispatcher.stop_polling()


origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    WEB_APP_HOST
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PATCH", "PUT"],
    allow_headers=["*"],
)

app.include_router(
    user_router,
    prefix="/user",
    tags=["user"]
)
app.include_router(
    event_router,
    prefix="/event",
    tags=["event"]
)
app.include_router(
    schedule_router,
    prefix="/schedule",
    tags=["schedule"]
)
