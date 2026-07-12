from datetime import datetime
from pydantic import BaseModel


class BookingCreate(BaseModel):
    resource_id: int
    employee_id: int
    start_time: datetime
    end_time: datetime
    purpose: str


class BookingResponse(BaseModel):
    id: int
    resource_id: int
    employee_id: int
    start_time: datetime
    end_time: datetime
    purpose: str
    status: str

    class Config:
        from_attributes = True