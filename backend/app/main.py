from fastapi import FastAPI

from app.database.init_db import init_db

from app.routers import auth

app = FastAPI()

@app.on_event("startup")
def startup():
    init_db()

app.include_router(auth.router)

@app.get("/")
def root():
    return {"message":"AssetFlow Backend Running 🚀"}