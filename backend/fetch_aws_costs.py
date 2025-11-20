import boto3
import argparse
from datetime import date, timedelta

def fetch_aws_costs(days=30):
    client = boto3.client('ce', region_name='us-east-1')

    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    # Convert to string format YYYY-MM-DD
    start_str = start_date.strftime('%Y-%m-%d')
    end_str = end_date.strftime('%Y-%m-%d')

    print(f"Fetching costs from {start_str} to {end_str}...")

    try:
        response = client.get_cost_and_usage(
            TimePeriod={
                'Start': start_str,
                'End': end_str
            },
            Granularity='DAILY',
            Metrics=['UnblendedCost'],
            GroupBy=[
                {'Type': 'DIMENSION', 'Key': 'SERVICE'}
            ]
        )

        for result in response['ResultsByTime']:
            date_str = result['TimePeriod']['Start']
            for group in result['Groups']:
                service_name = group['Keys'][0]
                amount = group['Metrics']['UnblendedCost']['Amount']
                unit = group['Metrics']['UnblendedCost']['Unit']
                print(f"Date: {date_str}, Service: {service_name}, Cost: {amount} {unit}")

    except Exception as e:
        print(f"Error fetching costs: {e}")

if __name__ == "__main__":
    # Ensure you have AWS credentials set up in your environment
    # export AWS_ACCESS_KEY_ID=...
    # export AWS_SECRET_ACCESS_KEY=...
    fetch_aws_costs()
