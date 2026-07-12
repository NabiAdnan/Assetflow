from datetime import datetime

from pydantic import BaseModel


class AuditResponse(BaseModel):
    id: int
    action: str
    entity: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True