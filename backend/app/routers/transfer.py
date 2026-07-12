from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.asset import Asset
from app.models.transfer import Transfer
from app.schemas.transfer import *

router = APIRouter(
    prefix="/transfer",
    tags=["Transfer"]
)


@router.post("/", response_model=TransferResponse)
def create_transfer(
    transfer: TransferCreate,
    db: Session = Depends(get_db)
):

    asset = db.query(Asset).filter(
        Asset.id == transfer.asset_id
    ).first()

    if not asset:
        raise HTTPException(404, "Asset not found")

    if asset.status != "Allocated":
        raise HTTPException(
            400,
            "Only allocated assets can be transferred"
        )

    request = Transfer(
        asset_id=transfer.asset_id,
        from_employee=asset.holder_id,
        to_employee=transfer.to_employee,
        request_date=date.today(),
        status="Pending"
    )

    db.add(request)

    db.commit()

    db.refresh(request)

    return request


@router.put("/approve/{transfer_id}")
def approve_transfer(
    transfer_id: int,
    db: Session = Depends(get_db)
):

    transfer = db.query(Transfer).filter(
        Transfer.id == transfer_id
    ).first()

    if not transfer:
        raise HTTPException(404, "Transfer not found")

    asset = db.query(Asset).filter(
        Asset.id == transfer.asset_id
    ).first()

    asset.holder_id = transfer.to_employee

    transfer.status = "Approved"

    db.commit()

    return {
        "message": "Transfer approved"
    }



@router.get("/", response_model=list[TransferResponse])
def get_transfers(db: Session = Depends(get_db)):
    return db.query(Transfer).all()