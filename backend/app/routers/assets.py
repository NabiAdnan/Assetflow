from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.asset import Asset
from app.schemas.asset import *

router = APIRouter(
    prefix="/assets",
    tags=["Assets"]
)

def generate_asset_tag(db: Session):

    count = db.query(Asset).count() + 1

    return f"AF-{count:04d}"

@router.post("/", response_model=AssetResponse)
def create_asset(
    asset: AssetCreate,
    db: Session = Depends(get_db)
):

    new_asset = Asset(
        asset_tag=generate_asset_tag(db),
        **asset.model_dump()
    )

    db.add(new_asset)

    db.commit()

    db.refresh(new_asset)

    return new_asset


@router.get("/", response_model=list[AssetResponse])
def get_assets(db: Session = Depends(get_db)):
    return db.query(Asset).all()

@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: int,
    asset: AssetUpdate,
    db: Session = Depends(get_db)
):

    db_asset = db.query(Asset).filter(
        Asset.id == asset_id
    ).first()

    if not db_asset:
        raise HTTPException(404, "Asset not found")

    for key, value in asset.model_dump().items():
        setattr(db_asset, key, value)

    db.commit()

    db.refresh(db_asset)

    return db_asset

@router.delete("/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db)
):

    asset = db.query(Asset).filter(
        Asset.id == asset_id
    ).first()

    if not asset:
        raise HTTPException(404, "Asset not found")

    db.delete(asset)

    db.commit()

    return {"message": "Deleted"}