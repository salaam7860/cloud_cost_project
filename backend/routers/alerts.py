from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/alerts",
    tags=["alerts"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=schemas.AlertThreshold)
def read_alert_threshold(db: Session = Depends(get_db)):
    alert = db.query(models.AlertThreshold).first()
    if alert is None:
        # Return a default if not set, or 404. Let's return a default 0 for now or create one.
        # Better to return 404 if not set, or handle in frontend.
        # Let's create a default one if it doesn't exist for simplicity in this prototype?
        # Or just return None and let frontend handle.
        raise HTTPException(status_code=404, detail="Alert threshold not set")
    return alert

@router.post("/", response_model=schemas.AlertThreshold)
def set_alert_threshold(alert: schemas.AlertThresholdCreate, db: Session = Depends(get_db)):
    db_alert = db.query(models.AlertThreshold).first()
    if db_alert:
        db_alert.amount = alert.amount
    else:
        db_alert = models.AlertThreshold(amount=alert.amount)
        db.add(db_alert)
    
    db.commit()
    db.refresh(db_alert)
    return db_alert
