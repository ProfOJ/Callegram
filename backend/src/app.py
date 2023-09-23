from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from dependencies import auth_service
from services.auth import AuthService

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


@app.post("/auth")
async def root(auth: AuthService = Depends(auth_service)):
    return {"message": auth.init_data.user}
