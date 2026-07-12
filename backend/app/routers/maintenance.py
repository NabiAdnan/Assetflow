from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.asset import Asset
from app.models.maintenance import Maintenance

from app.schemas.maintenance import *
from app.models.notification import Notification
from app.schemas import asset
from app.models.audit import Audit

router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance"]
)


@router.post("/", response_model=MaintenanceResponse)
def report_issue(
    request: MaintenanceCreate,
    db: Session = Depends(get_db)
):

    asset = db.query(Asset).filter(
        Asset.id == request.asset_id
    ).first()

    if not asset:
        raise HTTPException(404, "Asset not found")

    asset.status = "Maintenance"

    

    maintenance = Maintenance(
        asset_id=request.asset_id,
        reported_by=request.reported_by,
        issue=request.issue,
        reported_date=date.today()
    )

    db.add(maintenance)

    db.commit()

    db.refresh(maintenance)

    return maintenance





@router.put("/approve/{maintenance_id}")
def approve_request(
    maintenance_id: int,
    db: Session = Depends(get_db)
):

    maintenance = db.query(Maintenance).filter(
        Maintenance.id == maintenance_id
    ).first()

    if not maintenance:
        raise HTTPException(404, "Request not found")

    maintenance.status = "Approved"
    


    db.commit()

    return {
        "message": "Maintenance approved"
    }


@router.put("/assign/{maintenance_id}")
def assign_technician(
    maintenance_id: int,
    technician: str,
    db: Session = Depends(get_db)
):

    maintenance = db.query(Maintenance).filter(
        Maintenance.id == maintenance_id
    ).first()

    if not maintenance:
        raise HTTPException(404, "Request not found")

    maintenance.technician = technician
    maintenance.status = "In Progress"

    db.commit()

    return {
        "message": "Technician assigned"
    }


from datetime import date

@router.put("/complete/{maintenance_id}")
def complete_request(
    maintenance_id: int,
    db: Session = Depends(get_db)
):

    maintenance = db.query(Maintenance).filter(
        Maintenance.id == maintenance_id
    ).first()

    if not maintenance:
        raise HTTPException(404, "Request not found")

    asset = db.query(Asset).filter(
        Asset.id == maintenance.asset_id
    ).first()

    maintenance.status = "Completed"
    maintenance.completed_date = date.today()

    asset.status = "Available"

    db.add(
    Notification(
        title="Maintenance Completed",
        message=f"{asset.asset_tag} is now available."
    )
    )

    db.add(
    Audit(
        action="Maintenance",
        entity="Asset",
        description=f"{asset.asset_tag} maintenance completed"
    )
)

    db.commit()

    return {
        "message": "Maintenance completed"
    }


@router.get("/", response_model=list[MaintenanceResponse])
def get_maintenance_requests(db: Session = Depends(get_db)):
    return db.query(Maintenance).all()