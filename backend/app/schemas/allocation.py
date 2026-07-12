from datetime import date
from pydantic import BaseModel


class AllocationCreate(BaseModel):
    asset_id: int
    employee_id: int
    expected_return: date
    remarks: str | None = None


class AllocationResponse(BaseModel):
    id: int
    asset_id: int
    employee_id: int
    allocated_date: date
    expected_return: date
    returned_date: date | None

    class Config:
        from_attributes = True