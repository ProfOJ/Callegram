from datetime import datetime, timedelta
from typing import Optional

from pydantic import BaseModel


class Schedule(BaseModel):
    user_id: int
    windows: list[list[int]]


class User(BaseModel):
    id: int
    name: str
    timezone: int
    notification_time: list[int]
    schedule: Optional[Schedule]


class CalendarEvent(BaseModel):
    id: str
    owner_user_id: int
    invited_user_id: int
    appointment_time: datetime
    duration: timedelta
