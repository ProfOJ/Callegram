import datetime

from pydantic import BaseModel


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: dict | None = None


class UserSchemaAuth(BaseModel):
    timezone: int


class UserSchemaUpdate:

    def __init__(self, name: str, timezone: int, notification_time: list[int]):
        self.name = name
        self.timezone = timezone
        self.notification_time = notification_time


class CalendarEventSchemaAdd(BaseModel):
    owner_user_id: int
    invited_user_id: int
    appointment_time: datetime.datetime
    duration: datetime.timedelta


class CalendarEventSchemaUpdate(BaseModel):
    appointment_time: datetime.datetime
    duration: datetime.timedelta


class ScheduleSchemaDayAvailability(BaseModel):
    date: datetime.date
