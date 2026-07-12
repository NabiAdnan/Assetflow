from app.database.database import Base, engine

# Import all models here
from app.models.user import User
from app.models.department import Department
from app.models.user import User
from app.models.department import Department
from app.models.category import Category
from app.models.asset import Asset
from app.models.allocation import Allocation
from app.models.transfer import Transfer
from app.models.booking import Booking
from app.models.maintenance import Maintenance
def init_db():
    Base.metadata.create_all(bind=engine)