from typing import Optional


class Chat:
    id: int
    type: str
    title: str
    username: Optional[str]
    photo_url: Optional[str]


class User:
    id: int
    first_name: str
    last_name: Optional[str]
    username: Optional[str]
    language_code: Optional[str]
    added_to_attachment_menu: Optional[bool]
    allows_write_to_pm: Optional[bool]
    is_premium: Optional[bool]
    photo_url: Optional[str]

    def __init__(
            self,
            id: int,
            first_name: str,
            last_name: Optional[str],
            username: Optional[str],
            language_code: Optional[str],
            added_to_attachment_menu: Optional[bool],
            allows_write_to_pm: Optional[bool],
            is_premium: Optional[bool],
            photo_url: Optional[str]
    ):
        self.id = id
        self.first_name = first_name
        self.last_name = last_name
        self.username = username
        self.language_code = language_code
        self.added_to_attachment_menu = added_to_attachment_menu
        self.allows_write_to_pm = allows_write_to_pm
        self.is_premium = is_premium
        self.photo_url = photo_url


class InitData:
    query_id: str
    user: User
    receiver: Optional[User]
    chat: Optional[Chat]
    chat_type: Optional[str]
    chat_instance: Optional[str]
    start_param: Optional[str]
    can_send_after: Optional[int]
    auth_date: int
    hash: str

    def __init__(
            self,
            query_id: str,
            user: User,
            receiver: Optional[User],
            chat: Optional[Chat],
            chat_type: Optional[str],
            chat_instance: Optional[str],
            start_param: Optional[str],
            can_send_after: Optional[int],
            auth_date: int,
            hash: str
    ):
        self.query_id = query_id
        self.user = user
        self.receiver = receiver
        self.chat = chat
        self.chat_type = chat_type
        self.chat_instance = chat_instance
        self.start_param = start_param
        self.can_send_after = can_send_after
        self.auth_date = auth_date
        self.hash = hash
