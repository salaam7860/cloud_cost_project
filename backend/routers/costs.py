from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/costs",
    tags=["costs"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[schemas.CostEntry])
def read_costs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    costs = db.query(models.CostEntry).offset(skip).limit(limit).all()
    return costs

@router.post("/", response_model=schemas.CostEntry)
def create_cost(cost: schemas.CostEntryCreate, db: Session = Depends(get_db)):
    db_cost = models.CostEntry(**cost.dict())
    db.add(db_cost)
    db.commit()
    db.refresh(db_cost)
    return db_cost
