from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.booking import Booking
from app.models.asset import Asset

from app.schemas.booking import *
from app.models.notification import Notification
from app.models.audit import Audit


router = APIRouter(
    prefix="/booking",
    tags=["Resource Booking"]
)

@router.post("/", response_model=BookingResponse)
def create_booking(
    booking: BookingCreate,
    db: Session = Depends(get_db)
):

    resource = db.query(Asset).filter(
        Asset.id == booking.resource_id
    ).first()

    if not resource:
        raise HTTPException(
            status_code=404,
            detail="Resource not found"
        )

    if not resource.is_bookable:
        raise HTTPException(
            status_code=400,
            detail="This asset is not bookable"
        )

    existing = db.query(Booking).filter(
        Booking.resource_id == booking.resource_id
    ).all()

    for b in existing:
        if (
            booking.start_time < b.end_time
            and
            booking.end_time > b.start_time
        ):
            raise HTTPException(
                status_code=400,
                detail="Booking overlaps with an existing booking"
            )

    new_booking = Booking(**booking.model_dump())

    db.add(new_booking)
    db.add(
    Notification(
        title="Booking Confirmed",
        message=f"{resource.name} booked successfully."
    )
    )

    db.add(
    Audit(
        action="Booking",
        entity="Resource",
        description=f"{resource.name} booked"
    )
)

    db.commit()

    db.refresh(new_booking)
    

    return new_booking


@router.get("/", response_model=list[BookingResponse])
def get_bookings(db: Session = Depends(get_db)):
    return db.query(Booking).all()