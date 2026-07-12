from pydantic import BaseModel


class AssetCreate(BaseModel):
    name: str
    serial_number: str | None = None
    category_id: int
    department_id: int
    location: str
    acquisition_cost: float = 0
    condition: str = "Good"
    is_bookable: bool = False


class AssetUpdate(BaseModel):
    name: str
    serial_number: str | None = None
    category_id: int
    department_id: int
    location: str
    acquisition_cost: float
    condition: str
    status: str
    is_bookable: bool


class AssetResponse(BaseModel):
    id: int
    asset_tag: str
    name: str
    serial_number: str | None
    category_id: int
    department_id: int
    holder_id: int | None
    location: str
    acquisition_cost: float
    condition: str
    status: str
    is_bookable: bool

    class Config:
        from_attributes = True