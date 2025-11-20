import datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from sqlalchemy.sql import func
from .database import Base

class CostEntry(Base):
    __tablename__ = "cost_entries"

    id = Column(Integer, primary_key=True, index=True)
    service = Column(String, index=True)
    provider = Column(String, index=True)
    cost = Column(Float)
    date = Column(String, index=True)
    project = Column(String, index=True, default="Main Project")
    environment = Column(String, index=True, default="Production")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AlertThreshold(Base):
    __tablename__ = "alert_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
