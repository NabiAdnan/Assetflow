from app.database.database import Base, engine

# Import all models here
from app.models.user import User
from app.models.department import Department

def init_db():
    Base.metadata.create_all(bind=engine)