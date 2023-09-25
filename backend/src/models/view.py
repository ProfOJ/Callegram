from datetime import datetime, timedelta

from pydantic import BaseModel


class Schedule:

    def __init__(self, user_id: int, windows: list[list[int]]):
        self.user_id = user_id
        self.windows = windows


class User:

    def __init__(self, id: int, name: str, timezone: int, notification_time: list[int], schedule: Schedule = None):
        self.id = id
        self.name = name
        self.timezone = timezone
        self.notification_time = notification_time
        self.schedule = schedule


class CalendarEvent:

    def __init__(
            self,
            id: int,
            owner_user_id: int,
            invited_user_id: int,
            appointment_time: datetime,
            duration: timedelta
    ):
        self.id = id
        self.owner_user_id = owner_user_id
        self.invited_user_id = invited_user_id
        self.appointment_time = appointment_time
        self.duration = duration
