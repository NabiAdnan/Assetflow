from pydantic import BaseModel


class DepartmentCreate(BaseModel):
    name: str
    parent_department: str | None = None


class DepartmentUpdate(BaseModel):
    name: str
    parent_department: str | None = None
    status: str


class DepartmentResponse(BaseModel):
    id: int
    name: str
    parent_department: str | None
    status: str

    class Config:
        from_attributes = True