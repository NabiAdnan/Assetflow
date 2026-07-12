from pydantic import BaseModel


class DashboardResponse(BaseModel):

    total_assets: int

    available_assets: int

    allocated_assets: int

    maintenance_assets: int

    bookable_assets: int

    departments: int

    categories: int

    employees: int

    pending_transfers: int

    pending_maintenance: int

    today_bookings: int