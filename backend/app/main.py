from fastapi import FastAPI

from app.database.init_db import init_db

from app.routers import auth

app = FastAPI()

@app.on_event("startup")
def startup():
    init_db()

app.include_router(auth.router)

from app.routers import departments

app.include_router(departments.router)
from app.routers import categories

app.include_router(categories.router)

from app.routers import employees

app.include_router(employees.router)

from app.routers import assets

app.include_router(assets.router)

from app.routers import allocation

app.include_router(allocation.router)

@app.get("/")
def root():
    return {"message":"AssetFlow Backend Running 🚀"}