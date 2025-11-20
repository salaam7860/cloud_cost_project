from .database import SessionLocal, engine, Base
from .models import CostEntry, AlertThreshold
from .generate_recommendations import create_recommendations_in_db
from datetime import date, timedelta
import random

# Create tables
Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    # Check if data exists
    if db.query(CostEntry).count() > 0:
        print("Data already exists.")
        return

    print("Seeding data...")
    
    services = ["EC2", "S3", "RDS", "Lambda", "CloudFront"]
    providers = ["AWS", "Azure", "GCP"]
    # Create mock cost entries
    today = date.today()
    providers = ["AWS", "Azure", "GCP"]
    services = {
        "AWS": ["EC2", "RDS", "S3", "Lambda"],
        "Azure": ["Virtual Machines", "SQL Database", "Blob Storage", "Functions"],
        "GCP": ["Compute Engine", "Cloud SQL", "Cloud Storage", "Cloud Functions"]
    }
    projects = ["Alpha", "Beta", "Gamma"]
    environments = ["Production", "Development", "Staging"]

    costs = []
    for i in range(30):
        current_date = today - timedelta(days=i)
        for provider in providers:
            for service in services[provider]:
                cost_entry = CostEntry(
                    service=service,
                    provider=provider,
                    cost=round(random.uniform(1.0, 50.0), 2),
                    date=current_date.isoformat(),
                    project=random.choice(projects),
                    environment=random.choice(environments)
                )
                costs.append(cost_entry)
    
    db.add_all(costs)
    db.commit()
    # Set default alert
    if not db.query(AlertThreshold).first():
        db.add(AlertThreshold(amount=1000.0))

    db.commit()
    
    # Generate optimization recommendations
    print("Generating optimization recommendations...")
    create_recommendations_in_db(db)
    
    db.close()
    print("Data seeded successfully.")

if __name__ == "__main__":
    seed_data()

