from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.asset import Asset
from app.models.booking import Booking
from app.models.transfer import Transfer
from app.models.maintenance import Maintenance

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/assets")
def asset_report(
    db: Session = Depends(get_db)
):

    assets = db.query(Asset).all()

    return [
        {
            "asset_tag": asset.asset_tag,
            "name": asset.name,
            "status": asset.status,
            "department": asset.department_id,
            "holder": asset.holder_id,
            "location": asset.location,
        }
        for asset in assets
    ]

@router.get("/bookings")
def booking_report(
    db: Session = Depends(get_db)
):

    bookings = db.query(Booking).all()

    return bookings

@router.get("/transfers")
def transfer_report(
    db: Session = Depends(get_db)
):

    transfers = db.query(Transfer).all()

    return transfers


@router.get("/maintenance")
def maintenance_report(
    db: Session = Depends(get_db)
):

    maintenance = db.query(Maintenance).all()

    return maintenance