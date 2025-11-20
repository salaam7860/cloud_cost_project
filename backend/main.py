from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import costs, alerts, budget

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Cloud Cost Insight API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(costs.router)
app.include_router(alerts.router)
app.include_router(budget.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Cloud Cost Insight API"}
