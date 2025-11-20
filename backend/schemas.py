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
