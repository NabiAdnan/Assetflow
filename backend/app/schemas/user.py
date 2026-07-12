from pydantic import BaseModel
from pydantic import EmailStr


# from pydantic import BaseModel, EmailStr


class UserUpdate(BaseModel):
    name: str
    email: EmailStr
    role: str
    department_id: int | None = None
    is_active: bool


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    department_id: int | None
    is_active: bool

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True



