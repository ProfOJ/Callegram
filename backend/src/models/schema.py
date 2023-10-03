import datetime

from pydantic import BaseModel, Field


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: dict | None = None


class UserSchemaAuth(BaseModel):
    timezone: int


class UserSchemaProfileUpdate(BaseModel):
    name: str
    timezone: int
    schedule_days: list[int] = Field(min_length=1, max_length=7)
    schedule_type: str


class UserSchemaUpdate(BaseModel):
    name: str
    timezone: int
    notification_time: list[int]


class CalendarEventSchemaAdd(BaseModel):
    owner_user_id: int
    invited_user_id: int
    appointment_time: datetime.datetime
    duration: datetime.timedelta


class CalendarEventSchemaUpdate(BaseModel):
    appointment_time: datetime.datetime
    duration: datetime.timedelta
