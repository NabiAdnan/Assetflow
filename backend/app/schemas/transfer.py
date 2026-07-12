from datetime import date
from pydantic import BaseModel


class TransferCreate(BaseModel):
    asset_id: int
    to_employee: int


class TransferResponse(BaseModel):
    id: int
    asset_id: int
    from_employee: int
    to_employee: int
    request_date: date
    status: str

    class Config:
        from_attributes = True