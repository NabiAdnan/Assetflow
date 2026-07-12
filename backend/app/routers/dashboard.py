from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.asset import Asset
from app.models.department import Department
from app.models.category import Category
from app.models.user import User
from app.models.transfer import Transfer
from app.models.maintenance import Maintenance
from app.models.booking import Booking

from app.schemas.dashboard import DashboardResponse

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db)
):

    return {

        "total_assets":
            db.query(Asset).count(),

        "available_assets":
            db.query(Asset)
            .filter(Asset.status == "Available")
            .count(),

        "allocated_assets":
            db.query(Asset)
            .filter(Asset.status == "Allocated")
            .count(),

        "maintenance_assets":
            db.query(Asset)
            .filter(Asset.status == "Maintenance")
            .count(),

        "bookable_assets":
            db.query(Asset)
            .filter(Asset.is_bookable == True)
            .count(),

        "departments":
            db.query(Department).count(),

        "categories":
            db.query(Category).count(),

        "employees":
            db.query(User).count(),

        "pending_transfers":
            db.query(Transfer)
            .filter(
                Transfer.status == "Pending"
            )
            .count(),

        "pending_maintenance":
            db.query(Maintenance)
            .filter(
                Maintenance.status != "Completed"
            )
            .count(),

        "today_bookings":
            db.query(Booking)
            .filter(
                Booking.start_time >= date.today()
            )
            .count()

    }

