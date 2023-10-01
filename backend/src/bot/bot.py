from aiogram import Bot
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.client.telegram import TelegramAPIServer

from config import BOT_TOKEN, ENVIRONMENT

environment_path = 'test/' if ENVIRONMENT == "test" else ''
session = AiohttpSession(
    api=TelegramAPIServer(
        base=f'https://api.telegram.org/bot{{token}}/{environment_path}{{method}}',
        file=f'https://api.telegram.org/file/bot{{token}}{environment_path}/{{path}}'
    )
)

bot = Bot(token=BOT_TOKEN, session=session)
