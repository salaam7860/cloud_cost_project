import os
from google.cloud import billing_v1
from datetime import date, timedelta

def fetch_gcp_costs(days=30):
    # Ensure GOOGLE_APPLICATION_CREDENTIALS is set to the path of your JSON key file
    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("GOOGLE_APPLICATION_CREDENTIALS not set.")
        return

    # You also need the Billing Account ID
    billing_account_id = os.environ.get("GCP_BILLING_ACCOUNT_ID")
    if not billing_account_id:
        print("GCP_BILLING_ACCOUNT_ID not set.")
        return

    client = billing_v1.CloudBillingClient()

    # Note: The Cloud Billing API is more complex for direct cost fetching compared to AWS/Azure.
    # Often it involves exporting billing data to BigQuery and querying that.
    # However, for this example, we will list the billing account info as a placeholder
    # for where the BigQuery logic would go, as direct API cost fetching is limited.
    
    print(f"Fetching GCP costs for account {billing_account_id}...")
    
    try:
        # In a real scenario, you would query BigQuery here.
        # Example:
        # client = bigquery.Client()
        # query = "SELECT usage_start_time, service.description, cost, currency FROM ..."
        # query_job = client.query(query)
        
        print("GCP Cost Fetching requires BigQuery export setup.")
        print("Simulating fetch for demonstration...")
        
        # Simulating output
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        print(f"Date: {end_date}, Service: Compute Engine, Cost: 12.50 USD")
        print(f"Date: {end_date}, Service: Cloud Storage, Cost: 3.20 USD")

    except Exception as e:
        print(f"Error fetching GCP costs: {e}")

if __name__ == "__main__":
    fetch_gcp_costs()
