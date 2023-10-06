from typing import Annotated

from fastapi import Depends

from bot.bot import get_bot_instance
from config import BOT_TOKEN
from scheduler.scheduler import scheduler
from services.auth import AuthService
from services.notification import TelegramNotificationService
from unit_of_work.unit_of_work import UnitOfWork, AbstractUnitOfWork
from apscheduler.schedulers.asyncio import AsyncIOScheduler

auth_service = AuthService(BOT_TOKEN)

UOWDep = Annotated[AbstractUnitOfWork, Depends(UnitOfWork)]


def get_notification_service() -> TelegramNotificationService:
    return TelegramNotificationService(get_bot_instance())


def get_scheduler() -> AsyncIOScheduler:
    return scheduler
