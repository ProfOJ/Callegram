import base64
import hashlib
import hmac
import json
import urllib.parse

from fastapi import HTTPException
from starlette.requests import Request

from models.telegram import InitData, User


class AuthService:
    """
    Auth service

    This service is responsible for authentication-related operations and is used as a dependency.

    Authentication is performed as per https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

    List of responsibilities:
    - decode init data and validate it
    """

    def __init__(self, bot_token: str):
        self.bot_token = bot_token

    @staticmethod
    def decode_init_data(init_data_raw: str) -> InitData:
        """
        Decode init data

        This method is used to decode init data from base64 and parse it into InitData model. It also parses user
        data into User model. If user is not present in init data, HTTPException is raised.

        :param init_data_raw: init data as urlencoded query string
        :return: InitData model
        """
        init_data_segments = urllib.parse.unquote(init_data_raw).split("&")
        init_data_dict = {}

        for segment in init_data_segments:
            key, value = segment.split("=", 1)
            init_data_dict[key] = value

        if "user" not in init_data_dict or init_data_dict["user"] == "":
            raise HTTPException(status_code=401, detail="User is required")

        user_dict = json.loads(init_data_dict["user"])
        init_data_dict["user"] = User(
            id=user_dict.get("id"),
            first_name=user_dict.get("first_name"),
            last_name=user_dict.get("last_name", None),
            username=user_dict.get("username", None),
            language_code=user_dict.get("language_code", None),
            added_to_attachment_menu=user_dict.get("added_to_attachment_menu", False),
            allows_write_to_pm=user_dict.get("allows_write_to_pm", False),
            is_premium=user_dict.get("is_premium", False),
            photo_url=user_dict.get("photo_url", None)
        )

        return InitData(
            query_id=init_data_dict.get("query_id"),
            user=init_data_dict.get("user"),
            receiver=init_data_dict.get("receiver", None),
            chat=init_data_dict.get("chat", None),
            chat_type=init_data_dict.get("chat_type", None),
            chat_instance=init_data_dict.get("chat_instance", None),
            start_param=init_data_dict.get("start_param", None),
            can_send_after=init_data_dict.get("can_send_after", None),
            auth_date=init_data_dict.get("auth_date"),
            hash=init_data_dict.get("hash")
        )

    def __call__(self, request: Request):
        """
        Call method

        This method is used to call the service as a dependency. It decodes init data from the request and validates it.
        Validation is performed according to the Telegram documentation. If validation fails, HTTPException is raised. If
        no headers are present in the request, HTTPException is raised.

        :param request:
        :return:
        """
        init_data_base64 = request.headers.get("Authorization")

        if not init_data_base64:
            raise HTTPException(status_code=401, detail="Not authorized")

        init_data_raw = base64.b64decode(init_data_base64).decode()
        init_data: InitData = self.decode_init_data(init_data_raw)

        # as per https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
        init_data_pairs = urllib.parse.unquote(init_data_raw).split("&")
        # remove hash from the list because we can't validate hash of the hash
        init_data_pairs.remove("hash=" + init_data.hash)
        data_check_string = "\n".join(sorted(init_data_pairs))  # sort to ensure the same order of keys

        secret_key = hmac.new(b"WebAppData", self.bot_token.encode(), hashlib.sha256).digest()
        data_signature = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if not hmac.compare_digest(init_data.hash, data_signature):
            raise HTTPException(status_code=401, detail="Not authorized")

        self.init_data = init_data

        return self
