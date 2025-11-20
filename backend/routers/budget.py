from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/budget",
    tags=["budget"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=schemas.BudgetResponse)
def get_budget(db: Session = Depends(get_db)):
    """
    Get current budget and spending data with projections
    """
    # Fetch the current budget
    budget = db.query(models.Budget).first()
    
    # Calculate current month's spending
    now = datetime.now()
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Get all costs for current month
    current_month_costs = db.query(models.CostEntry).filter(
        models.CostEntry.date >= first_day_of_month.strftime('%Y-%m-%d')
    ).all()
    
    current_spend = sum(cost.cost for cost in current_month_costs)
    
    # Calculate days elapsed and days in month
    days_elapsed = now.day
    days_in_month = (now.replace(month=now.month % 12 + 1, day=1) - timedelta(days=1)).day if now.month < 12 else 31
    
    # Forecast end-of-month spend
    if days_elapsed > 0:
        daily_average = current_spend / days_elapsed
        forecasted_spend = daily_average * days_in_month
    else:
        forecasted_spend = 0
    
    # Calculate remaining budget
    budget_amount = budget.amount if budget else 0
    remaining = budget_amount - current_spend
    
    # Calculate percentage used
    percentage_used = (current_spend / budget_amount * 100) if budget_amount > 0 else 0
    
    # Calculate service-level projections
    service_costs = {}
    for cost in current_month_costs:
        if cost.service not in service_costs:
            service_costs[cost.service] = 0
        service_costs[cost.service] += cost.cost
    
    services = []
    for service, total_cost in service_costs.items():
        daily_spend = total_cost / days_elapsed if days_elapsed > 0 else 0
        monthly_projection = daily_spend * days_in_month
        
        # Determine status based on projection vs budget
        if budget_amount > 0:
            service_percentage = (monthly_projection / budget_amount) * 100
            if service_percentage < 50:
                status = "green"
            elif service_percentage < 80:
                status = "yellow"
            else:
                status = "red"
        else:
            status = "green"
        
        services.append(schemas.ServiceProjection(
            service=service,
            daily_spend=round(daily_spend, 2),
            monthly_projection=round(monthly_projection, 2),
            status=status
        ))
    
    return schemas.BudgetResponse(
        budget=budget,
        current_spend=round(current_spend, 2),
        remaining=round(remaining, 2),
        forecasted_spend=round(forecasted_spend, 2),
        percentage_used=round(percentage_used, 2),
        services=services
    )

@router.post("/", response_model=schemas.Budget)
def set_budget(budget: schemas.BudgetCreate, db: Session = Depends(get_db)):
    """
    Set or update monthly budget
    """
    db_budget = db.query(models.Budget).first()
    if db_budget:
        db_budget.amount = budget.amount
        db_budget.updated_at = datetime.utcnow()
    else:
        db_budget = models.Budget(amount=budget.amount)
        db.add(db_budget)
    
    db.commit()
    db.refresh(db_budget)
    return db_budget
