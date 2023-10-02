#!/bin/sh

alembic upgrade head
uvicorn app:app --host "0.0.0.0" --port 3000