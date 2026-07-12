from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(
    prefix="/employees",
    tags=["Employees"]
)

@router.get("/", response_model=list[UserResponse])
def get_employees(db: Session = Depends(get_db)):
    return db.query(User).all()


@router.get("/{employee_id}", response_model=UserResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db)):

    employee = db.query(User).filter(
        User.id == employee_id
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    return employee


@router.put("/{employee_id}", response_model=UserResponse)
def update_employee(
    employee_id: int,
    employee: UserUpdate,
    db: Session = Depends(get_db)
):

    db_employee = db.query(User).filter(
        User.id == employee_id
    ).first()

    if not db_employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    for key, value in employee.model_dump().items():
        setattr(db_employee, key, value)

    db.commit()

    db.refresh(db_employee)

    return db_employee



@router.delete("/{employee_id}")
def deactivate_employee(
    employee_id: int,
    db: Session = Depends(get_db)
):

    employee = db.query(User).filter(
        User.id == employee_id
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    employee.is_active = False

    db.commit()

    return {
        "message": "Employee deactivated"
    }