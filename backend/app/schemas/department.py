from pydantic import BaseModel


class DepartmentCreate(BaseModel):
    name: str
    parent_department: str | None = None
    head: str | None = None


class DepartmentResponse(BaseModel):
    id: int
    name: str
    parent_department: str | None
    head: str | None
    status: str

    class Config:
        from_attributes = True