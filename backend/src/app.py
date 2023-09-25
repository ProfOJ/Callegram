from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.user import router as user_router
from routes.events import router as event_router

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PATCH", "PUT"],
    allow_headers=["*"],
)

app.include_router(
    user_router,
    prefix="/user",
    tags=["user"]
)
app.include_router(
    event_router,
    prefix="/event",
    tags=["event"]
)
