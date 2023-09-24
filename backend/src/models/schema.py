from pydantic import BaseModel


class UserSchemaAuth(BaseModel):
    timezone: int


class UserSchemaUpdate:

    def __init__(self, name: str, timezone: int, notification_time: list[int]):
        self.name = name
        self.timezone = timezone
        self.notification_time = notification_time


class User:

    def __init__(self, id: int, name: str, timezone: int, notification_time: list[int]):
        self.id = id
        self.name = name
        self.timezone = timezone
        self.notification_time = notification_time


class Schedule:

    def __init__(self, user_id: int, windows: list[list[int]]):
        self.user_id = user_id
        self.windows = windows
