from typing import Annotated

from fastapi import Depends

from config import BOT_TOKEN
from services.auth import AuthService
from unit_of_work.unit_of_work import UnitOfWork, AbstractUnitOfWork

auth_service = AuthService(BOT_TOKEN)

UOWDep = Annotated[AbstractUnitOfWork, Depends(UnitOfWork)]
