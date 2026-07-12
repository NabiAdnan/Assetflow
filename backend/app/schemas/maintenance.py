from datetime import date
from pydantic import BaseModel


class MaintenanceCreate(BaseModel):
    asset_id: int
    reported_by: int
    issue: str


class MaintenanceResponse(BaseModel):
    id: int
    asset_id: int
    reported_by: int
    issue: str
    technician: str | None
    status: str

    class Config:
        from_attributes = True