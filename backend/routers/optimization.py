from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from .. import models, schemas
from ..database import get_db
from ..generate_recommendations import create_recommendations_in_db

router = APIRouter(
    prefix="/optimization",
    tags=["optimization"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=schemas.OptimizationResponse)
def get_optimizations(db: Session = Depends(get_db)):
    """
    Get all optimization recommendations with summary statistics
    """
    # Get all optimizations
    optimizations = db.query(models.Optimization).all()
    
    # Calculate summary statistics
    total_estimated_savings = sum(opt.estimated_savings for opt in optimizations)
    total_applied_savings = sum(
        opt.estimated_savings for opt in optimizations if opt.status == 'applied'
    )
    
    pending_count = sum(1 for opt in optimizations if opt.status == 'pending')
    applied_count = sum(1 for opt in optimizations if opt.status == 'applied')
    ignored_count = sum(1 for opt in optimizations if opt.status == 'ignored')
    
    # Calculate current month's spending for percentage
    now = datetime.now()
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    current_month_costs = db.query(models.CostEntry).filter(
        models.CostEntry.date >= first_day_of_month.strftime('%Y-%m-%d')
    ).all()
    
    current_spend = sum(cost.cost for cost in current_month_costs)
    savings_percentage = (total_estimated_savings / current_spend * 100) if current_spend > 0 else 0
    
    return schemas.OptimizationResponse(
        optimizations=optimizations,
        total_estimated_savings=round(total_estimated_savings, 2),
        total_applied_savings=round(total_applied_savings, 2),
        pending_count=pending_count,
        applied_count=applied_count,
        ignored_count=ignored_count,
        savings_percentage=round(savings_percentage, 2)
    )

@router.post("/{optimization_id}/apply", response_model=schemas.Optimization)
def apply_optimization(optimization_id: int, db: Session = Depends(get_db)):
    """
    Mark an optimization recommendation as applied
    """
    optimization = db.query(models.Optimization).filter(
        models.Optimization.id == optimization_id
    ).first()
    
    if not optimization:
        raise HTTPException(status_code=404, detail="Optimization not found")
    
    optimization.status = 'applied'
    db.commit()
    db.refresh(optimization)
    
    return optimization

@router.post("/{optimization_id}/ignore", response_model=schemas.Optimization)
def ignore_optimization(optimization_id: int, db: Session = Depends(get_db)):
    """
    Mark an optimization recommendation as ignored
    """
    optimization = db.query(models.Optimization).filter(
        models.Optimization.id == optimization_id
    ).first()
    
    if not optimization:
        raise HTTPException(status_code=404, detail="Optimization not found")
    
    optimization.status = 'ignored'
    db.commit()
    db.refresh(optimization)
    
    return optimization

@router.post("/generate")
def generate_optimizations(db: Session = Depends(get_db)):
    """
    Generate new optimization recommendations based on current spending data
    """
    try:
        create_recommendations_in_db(db)
        return {"message": "Recommendations generated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
