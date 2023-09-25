from datetime import datetime, timedelta

from pydantic import BaseModel


class Schedule(BaseModel):
    user_id: int
    windows: list[list[int]]


class User(BaseModel):
    id: int
    name: str
    timezone: int
    notification_time: list[int]
    schedule: Schedule = None


class CalendarEvent(BaseModel):
    id: int
    owner_user_id: int
    invited_user_id: int
    appointment_time: datetime
    duration: timedelta
