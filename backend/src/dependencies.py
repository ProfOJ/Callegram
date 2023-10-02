from typing import Annotated

from fastapi import Depends

from config import BOT_TOKEN
from scheduler.scheduler import scheduler
from services.auth import AuthService
from services.notification import TelegramNotificationService
from unit_of_work.unit_of_work import UnitOfWork, AbstractUnitOfWork

auth_service = AuthService(BOT_TOKEN)

UOWDep = Annotated[AbstractUnitOfWork, Depends(UnitOfWork)]


def get_notification_service():
    return TelegramNotificationService(bot)


def get_scheduler():
    return scheduler
