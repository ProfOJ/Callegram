import os

from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.environ.get('API_DB_POSTGRES_HOST')
DB_PORT = os.environ.get('API_DB_POSTGRES_PORT')
DB_USER = os.environ.get('API_DB_POSTGRES_USER')
DB_PASSWORD = os.environ.get('API_DB_POSTGRES_PASSWORD')
DB_NAME = os.environ.get('API_DB_POSTGRES_DB')
