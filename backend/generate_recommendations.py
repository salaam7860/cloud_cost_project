"""
Generate cost optimization recommendations based on spending patterns
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from . import models

def generate_recommendations(db: Session):
    """
    Analyze spending data and generate optimization recommendations
    """
    recommendations = []
    
    # Get spending data from the last 30 days
    thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    costs = db.query(models.CostEntry).filter(
        models.CostEntry.date >= thirty_days_ago
    ).all()
    
    if not costs:
        return recommendations
    
    # Analyze by service
    service_costs = {}
    for cost in costs:
        key = (cost.service, cost.provider)
        if key not in service_costs:
            service_costs[key] = []
        service_costs[key].append(cost.cost)
    
    # Generate recommendations based on patterns
    for (service, provider), cost_list in service_costs.items():
        avg_cost = sum(cost_list) / len(cost_list)
        total_cost = sum(cost_list)
        
        # Recommendation 1: Idle Resources (very low average cost)
        if avg_cost < 5 and total_cost > 0:
            recommendations.append({
                'title': f'Remove Idle {service} Resources',
                'description': f'Your {service} service on {provider} has minimal usage. Consider removing or consolidating these resources to save costs.',
                'estimated_savings': total_cost * 0.8,  # 80% savings
                'service': service,
                'provider': provider
            })
        
        # Recommendation 2: Underutilized Services (moderate cost but could be optimized)
        elif 5 <= avg_cost < 50:
            recommendations.append({
                'title': f'Right-size {service} Instances',
                'description': f'Your {service} service on {provider} appears underutilized. Consider downsizing to a smaller instance type.',
                'estimated_savings': total_cost * 0.3,  # 30% savings
                'service': service,
                'provider': provider
            })
        
        # Recommendation 3: Reserved Instances for consistent workloads
        elif avg_cost >= 50 and len(cost_list) >= 25:  # Consistent usage
            recommendations.append({
                'title': f'Use Reserved Instances for {service}',
                'description': f'Your {service} service on {provider} has consistent usage. Switch to reserved instances for up to 40% savings.',
                'estimated_savings': total_cost * 0.4,  # 40% savings
                'service': service,
                'provider': provider
            })
    
    # Recommendation 4: Multi-region optimization
    providers_used = set(cost.provider for cost in costs)
    if len(providers_used) > 1:
        total_multi_cloud_cost = sum(cost.cost for cost in costs)
        recommendations.append({
            'title': 'Consolidate Multi-Cloud Resources',
            'description': f'You are using {len(providers_used)} cloud providers. Consider consolidating resources to a single provider for volume discounts.',
            'estimated_savings': total_multi_cloud_cost * 0.15,  # 15% savings
            'service': 'Multi-Cloud',
            'provider': 'All'
        })
    
    # Recommendation 5: Development environment optimization
    dev_costs = [cost for cost in costs if cost.environment == 'Development']
    if dev_costs:
        dev_total = sum(cost.cost for cost in dev_costs)
        recommendations.append({
            'title': 'Optimize Development Environments',
            'description': 'Development environments are running 24/7. Implement auto-shutdown during non-business hours to save costs.',
            'estimated_savings': dev_total * 0.5,  # 50% savings
            'service': 'Development',
            'provider': 'All'
        })
    
    return recommendations

def create_recommendations_in_db(db: Session):
    """
    Generate and store recommendations in the database
    """
    # Check if recommendations already exist
    existing = db.query(models.Optimization).filter(
        models.Optimization.status == 'pending'
    ).count()
    
    if existing > 0:
        return  # Don't generate duplicates
    
    recommendations = generate_recommendations(db)
    
    for rec in recommendations:
        optimization = models.Optimization(
            title=rec['title'],
            description=rec['description'],
            estimated_savings=rec['estimated_savings'],
            service=rec['service'],
            provider=rec['provider'],
            status='pending'
        )
        db.add(optimization)
    
    db.commit()
