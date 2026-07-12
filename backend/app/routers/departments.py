from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.department import Department
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
)

router = APIRouter(
    prefix="/departments",
    tags=["Departments"],
)


@router.post("/", response_model=DepartmentResponse)
def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db),
):

    existing = db.query(Department).filter(
        Department.name == department.name
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Department already exists"
        )

    new_department = Department(**department.model_dump())

    db.add(new_department)

    db.commit()

    db.refresh(new_department)

    return new_department


@router.get("/", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()


@router.put("/{department_id}")
def update_department(
    department_id: int,
    department: DepartmentUpdate,
    db: Session = Depends(get_db),
):

    db_department = db.query(Department).filter(
        Department.id == department_id
    ).first()

    if not db_department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    for key, value in department.model_dump().items():
        setattr(db_department, key, value)

    db.commit()

    db.refresh(db_department)

    return db_department


@router.put("/{department_id}")
def update_department(
    department_id: int,
    department: DepartmentUpdate,
    db: Session = Depends(get_db),
):

    db_department = db.query(Department).filter(
        Department.id == department_id
    ).first()

    if not db_department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    for key, value in department.model_dump().items():
        setattr(db_department, key, value)

    db.commit()

    db.refresh(db_department)

    return db_department