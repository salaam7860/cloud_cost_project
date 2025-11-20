import os
from datetime import date, timedelta
from azure.identity import DefaultAzureCredential
from azure.mgmt.costmanagement import CostManagementClient
from azure.mgmt.costmanagement.models import QueryDefinition, QueryTimePeriod, QueryDataset, QueryAggregation, QueryGrouping

def fetch_azure_costs(days=30):
    # Ensure environment variables are set:
    # AZURE_SUBSCRIPTION_ID, AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
    subscription_id = os.environ.get("AZURE_SUBSCRIPTION_ID")
    if not subscription_id:
        print("AZURE_SUBSCRIPTION_ID not set.")
        return

    credential = DefaultAzureCredential()
    client = CostManagementClient(credential)

    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    scope = f"/subscriptions/{subscription_id}"

    query = QueryDefinition(
        type="Usage",
        timeframe="Custom",
        time_period=QueryTimePeriod(from_property=start_date, to=end_date),
        dataset=QueryDataset(
            granularity="Daily",
            aggregation={"totalCost": QueryAggregation(name="Cost", function="Sum")},
            grouping=[QueryGrouping(type="Dimension", name="ServiceName")]
        )
    )

    print(f"Fetching Azure costs from {start_date} to {end_date}...")

    try:
        result = client.query.usage(scope, query)
        for row in result.rows:
            # Row structure depends on query. Usually [Cost, Date, ServiceName, Currency]
            cost = row[0]
            date_val = row[1]
            service = row[2]
            currency = row[3]
            print(f"Date: {date_val}, Service: {service}, Cost: {cost} {currency}")

    except Exception as e:
        print(f"Error fetching Azure costs: {e}")

if __name__ == "__main__":
    fetch_azure_costs()
