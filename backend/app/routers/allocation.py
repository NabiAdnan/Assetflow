from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.asset import Asset
from app.models.allocation import Allocation
from app.schemas.allocation import *

router = APIRouter(
    prefix="/allocation",
    tags=["Asset Allocation"]
)


@router.post("/", response_model=AllocationResponse)
def allocate_asset(
    allocation: AllocationCreate,
    db: Session = Depends(get_db)
):

    asset = db.query(Asset).filter(
        Asset.id == allocation.asset_id
    ).first()

    if not asset:
        raise HTTPException(
            404,
            "Asset not found"
        )

    if asset.status != "Available":
        raise HTTPException(
            status_code=400,
            detail=f"Asset already {asset.status}"
        )

    new_allocation = Allocation(
        asset_id=allocation.asset_id,
        employee_id=allocation.employee_id,
        allocated_date=date.today(),
        expected_return=allocation.expected_return,
        remarks=allocation.remarks
    )

    asset.status = "Allocated"
    asset.holder_id = allocation.employee_id

    db.add(new_allocation)
    from app.models.audit import Audit
    db.add(
    Audit(
        action="Allocate",
        entity="Asset",
        description=f"{asset.asset_tag} allocated to employee {allocation.employee_id}"
    )
    )

    db.commit()

    db.refresh(new_allocation)

    return new_allocation


@router.get("/", response_model=list[AllocationResponse])
def get_allocations(db: Session = Depends(get_db)):
    return db.query(Allocation).all()


from datetime import date

@router.put("/return/{allocation_id}")
def return_asset(
    allocation_id: int,
    db: Session = Depends(get_db)
):

    allocation = db.query(Allocation).filter(
        Allocation.id == allocation_id
    ).first()

    if not allocation:
        raise HTTPException(
            status_code=404,
            detail="Allocation not found"
        )

    if allocation.returned_date:
        raise HTTPException(
            status_code=400,
            detail="Asset already returned"
        )

    asset = db.query(Asset).filter(
        Asset.id == allocation.asset_id
    ).first()

    allocation.returned_date = date.today()

    asset.status = "Available"
    asset.holder_id = None

    db.commit()

    return {
        "message": "Asset returned successfully"
    }

