from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.audit import Audit

from app.schemas.audit import AuditResponse

router = APIRouter(
    prefix="/audit",
    tags=["Audit Logs"]
)

@router.get("/", response_model=list[AuditResponse])
def get_logs(
    db: Session = Depends(get_db)
):

    return db.query(Audit).order_by(
        Audit.created_at.desc()
    ).all()


