from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class CostEntryBase(BaseModel):
    service: str
    provider: str
    cost: float
    date: str
    project: str = "Main Project"
    environment: str = "Production"

class CostEntryCreate(CostEntryBase):
    pass

class CostEntry(CostEntryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class AlertThresholdBase(BaseModel):
    amount: float

class AlertThresholdCreate(AlertThresholdBase):
    pass

class AlertThreshold(AlertThresholdBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

class BudgetBase(BaseModel):
    amount: float

class BudgetCreate(BudgetBase):
    pass

class Budget(BudgetBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ServiceProjection(BaseModel):
    service: str
    daily_spend: float
    monthly_projection: float
    status: str

class BudgetResponse(BaseModel):
    budget: Optional[Budget]
    current_spend: float
    remaining: float
    forecasted_spend: float
    percentage_used: float
    services: list[ServiceProjection]

class OptimizationBase(BaseModel):
    title: str
    description: str
    estimated_savings: float
    service: str
    provider: str

class OptimizationCreate(OptimizationBase):
    pass

class Optimization(OptimizationBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class OptimizationResponse(BaseModel):
    optimizations: list[Optimization]
    total_estimated_savings: float
    total_applied_savings: float
    pending_count: int
    applied_count: int
    ignored_count: int
    savings_percentage: float  # Percentage of current monthly spend


