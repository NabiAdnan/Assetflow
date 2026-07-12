from app.database.database import Base, engine

# Import all models here
from app.models.user import User
from app.models.department import Department
from app.models.user import User
from app.models.department import Department
from app.models.category import Category
from app.models.asset import Asset
from app.models.allocation import Allocation

def init_db():
    Base.metadata.create_all(bind=engine)