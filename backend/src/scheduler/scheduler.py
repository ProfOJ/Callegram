from apscheduler.executors.pool import ProcessPoolExecutor
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME

scheduler = AsyncIOScheduler(
    jobstores={
        'default': SQLAlchemyJobStore(url=f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
    },
    executors={
        'default': ProcessPoolExecutor(4),
    },
    job_defaults={
        'coalesce': False,
        'max_instances': 1
    },
)
