from database.models import User
from .base import SQLAlchemyRepository


class UsersRepository(SQLAlchemyRepository):
    model = User
