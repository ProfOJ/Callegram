import asyncio

from aiogram import Dispatcher
from aiogram.types import InlineQuery, InputTextMessageContent, InlineKeyboardMarkup, InlineKeyboardButton, \
    InlineQueryResultArticle
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
            id=f"booking_{inline_query.from_user.id}",
            thumbnail_url="https://telegra.ph/file/f492c04ef04eb295d8833.png",
            input_message_content=InputTextMessageContent(message_text="Book a call with me using the button below."),
            title="Share your schedule",
            description="Share your schedule with others",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(
                    text="Book a call",
                    url=f"t.me/CallegramBot/book?startapp=user_{inline_query.from_user.id}"
                )
            ]]),
        )
    ])


scheduler.start()


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(bot_dispatcher.start_polling(bot, allowed_updates=["inlinequery"]))


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
