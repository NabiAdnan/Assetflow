from datetime import date, datetime, timedelta
from app.database.database import Base, engine, SessionLocal

# Import all models here
from app.models.user import User
from app.models.department import Department
from app.models.category import Category
from app.models.asset import Asset
from app.models.allocation import Allocation
from app.models.transfer import Transfer
from app.models.booking import Booking
from app.models.maintenance import Maintenance
from app.models.notification import Notification
from app.models.audit import Audit
from app.core.security import hash_password

def init_db():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if users already exist
        if db.query(User).count() == 0:
            print("Seeding initial database data...")
            
            # 1. Seed Departments
            engineering = Department(name="Engineering", parent_department=None, status="Active")
            operations = Department(name="Operations", parent_department=None, status="Active")
            finance = Department(name="Finance", parent_department=None, status="Active")
            design = Department(name="Design", parent_department=None, status="Active")
            hr = Department(name="HR", parent_department=None, status="Active")
            support = Department(name="Support", parent_department=None, status="Active")
            
            db.add_all([engineering, operations, finance, design, hr, support])
            db.flush() # Populate IDs
            
            # 2. Seed Categories
            laptops = Category(name="Laptops", description="Enterprise work laptops")
            monitors = Category(name="Monitors", description="Display monitors and screens")
            phones = Category(name="Mobile Phones", description="Company smartphones")
            furniture = Category(name="Furniture", description="Office desks, chairs and setups")
            av = Category(name="AV Equipment", description="Projectors, speakers and camera kits")
            servers = Category(name="Servers & Network", description="Racks, switches and routers")
            
            db.add_all([laptops, monitors, phones, furniture, av, servers])
            db.flush()
            
            # 3. Seed Users/Employees
            admin = User(
                name="System Administrator",
                email="admin@assetflow.com",
                hashed_password=hash_password("admin123"),
                role="admin",
                department_id=engineering.id,
                is_active=True
            )
            manager = User(
                name="Siddharth Nair",
                email="manager@assetflow.com",
                hashed_password=hash_password("manager123"),
                role="asset_manager",
                department_id=operations.id,
                is_active=True
            )
            head = User(
                name="Rohit Kapoor",
                email="head@assetflow.com",
                hashed_password=hash_password("head123"),
                role="department_head",
                department_id=design.id,
                is_active=True
            )
            emp1 = User(
                name="Aarav Mehta",
                email="aarav@assetflow.com",
                hashed_password=hash_password("employee123"),
                role="employee",
                department_id=engineering.id,
                is_active=True
            )
            emp2 = User(
                name="Priya Shah",
                email="priya@assetflow.com",
                hashed_password=hash_password("employee123"),
                role="employee",
                department_id=design.id,
                is_active=True
            )
            emp3 = User(
                name="Neha Iyer",
                email="neha@assetflow.com",
                hashed_password=hash_password("employee123"),
                role="employee",
                department_id=hr.id,
                is_active=True
            )
            
            db.add_all([admin, manager, head, emp1, emp2, emp3])
            db.flush()
            
            # 4. Seed Assets
            a1 = Asset(
                asset_tag="AF-0001",
                name="MacBook Pro 14 · M3 Max",
                serial_number="C02FG470Q05D",
                category_id=laptops.id,
                department_id=engineering.id,
                holder_id=emp1.id,
                location="Mumbai Office - Desk 12",
                acquisition_cost=199990.0,
                condition="Good",
                status="Allocated",
                is_bookable=False
            )
            a2 = Asset(
                asset_tag="AF-0002",
                name="Dell XPS 15 9530",
                serial_number="3G7H4J2",
                category_id=laptops.id,
                department_id=engineering.id,
                holder_id=None,
                location="Bengaluru HQ - IT Cabinet 2",
                acquisition_cost=165000.0,
                condition="Good",
                status="Available",
                is_bookable=False
            )
            a3 = Asset(
                asset_tag="AF-0003",
                name="LG UltraWide 34WP65G",
                serial_number="104KRNX54289",
                category_id=monitors.id,
                department_id=design.id,
                holder_id=emp2.id,
                location="Mumbai Office - Desk 28",
                acquisition_cost=32000.0,
                condition="New",
                status="Allocated",
                is_bookable=False
            )
            a4 = Asset(
                asset_tag="AF-0004",
                name="Epson Projector EX-9240",
                serial_number="L54K98201",
                category_id=av.id,
                department_id=operations.id,
                holder_id=None,
                location="Conference Room A",
                acquisition_cost=55000.0,
                condition="Good",
                status="Available",
                is_bookable=True
            )
            a5 = Asset(
                asset_tag="AF-0005",
                name="iPhone 15 Pro Max 256GB",
                serial_number="F12K87GD908",
                category_id=phones.id,
                department_id=design.id,
                holder_id=emp2.id,
                location="Remote - Priya Shah",
                acquisition_cost=140000.0,
                condition="Good",
                status="Allocated",
                is_bookable=False
            )
            a6 = Asset(
                asset_tag="AF-0006",
                name="Server Rack A · Dell PowerEdge",
                serial_number="SRV-DL-883",
                category_id=servers.id,
                department_id=engineering.id,
                holder_id=None,
                location="Server Room 1",
                acquisition_cost=450000.0,
                condition="Fair",
                status="Maintenance",
                is_bookable=False
            )
            a7 = Asset(
                asset_tag="AF-0007",
                name="Ergonomic Office Chair - Steelcase",
                serial_number="SC-CH-091",
                category_id=furniture.id,
                department_id=hr.id,
                holder_id=emp3.id,
                location="Bengaluru HQ - HR Bay",
                acquisition_cost=42000.0,
                condition="Good",
                status="Allocated",
                is_bookable=False
            )
            
            db.add_all([a1, a2, a3, a4, a5, a6, a7])
            db.flush()
            
            # 5. Seed Allocations
            alloc1 = Allocation(
                asset_id=a1.id,
                employee_id=emp1.id,
                allocated_date=date.today() - timedelta(days=90),
                expected_return=date.today() + timedelta(days=270),
                remarks="Standard issue for Senior Software Engineer"
            )
            alloc2 = Allocation(
                asset_id=a3.id,
                employee_id=emp2.id,
                allocated_date=date.today() - timedelta(days=60),
                expected_return=date.today() + timedelta(days=120),
                remarks="Design team workstation enhancement"
            )
            alloc3 = Allocation(
                asset_id=a5.id,
                employee_id=emp2.id,
                allocated_date=date.today() - timedelta(days=15),
                expected_return=date.today() + timedelta(days=350),
                remarks="Mobile app testing device"
            )
            alloc4 = Allocation(
                asset_id=a7.id,
                employee_id=emp3.id,
                allocated_date=date.today() - timedelta(days=45),
                expected_return=date.today() + timedelta(days=320),
                remarks="WFO setup"
            )
            
            db.add_all([alloc1, alloc2, alloc3, alloc4])
            db.flush()
            
            # 6. Seed Transfers (one pending)
            t1 = Transfer(
                asset_id=a3.id,
                from_employee=emp2.id,
                to_employee=emp1.id,
                request_date=date.today() - timedelta(days=1),
                status="Pending"
            )
            
            db.add_all([t1])
            db.flush()
            
            # 7. Seed Bookings
            b1 = Booking(
                resource_id=a4.id,
                employee_id=emp3.id,
                start_time=datetime.now() + timedelta(hours=2),
                end_time=datetime.now() + timedelta(hours=4),
                purpose="Quarterly HR Alignment Meeting",
                status="Upcoming"
            )
            
            db.add_all([b1])
            db.flush()
            
            # 8. Seed Maintenance
            m1 = Maintenance(
                asset_id=a6.id,
                reported_by=admin.id,
                issue="Periodic overheating warning on node 3",
                technician="Rohit Verma",
                status="In Progress",
                reported_date=date.today() - timedelta(days=2)
            )
            
            db.add_all([m1])
            db.flush()
            
            # 9. Seed Audit Logs
            db.add_all([
                Audit(action="Seed", entity="System", description="System database initialized with seed data", created_at=datetime.utcnow() - timedelta(days=2)),
                Audit(action="Allocate", entity="Asset", description=f"AF-0001 allocated to employee Aarav Mehta", created_at=datetime.utcnow() - timedelta(days=90)),
                Audit(action="Allocate", entity="Asset", description=f"AF-0003 allocated to employee Priya Shah", created_at=datetime.utcnow() - timedelta(days=60)),
                Audit(action="Allocate", entity="Asset", description=f"AF-0007 allocated to employee Neha Iyer", created_at=datetime.utcnow() - timedelta(days=45)),
                Audit(action="Maintenance", entity="Asset", description="AF-0006 reported for maintenance (Periodic overheating)", created_at=datetime.utcnow() - timedelta(days=2)),
            ])
            
            # 10. Seed Notifications
            db.add_all([
                Notification(title="System Ready", message="AssetFlow ERP platform is active and running.", is_read=False),
                Notification(title="Pending Transfer", message="A transfer request for LG UltraWide 34WP65G is pending approval.", is_read=False),
            ])
            
            db.commit()
            print("Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()