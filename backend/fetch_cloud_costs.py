import os
import argparse
from fetch_aws_costs import fetch_aws_costs
from fetch_azure_costs import fetch_azure_costs

def main():
    parser = argparse.ArgumentParser(description="Fetch cloud costs from AWS and Azure")
    parser.add_argument("--days", type=int, default=30, help="Number of days to fetch")
    args = parser.parse_args()

    print("--- AWS Costs ---")
    if os.environ.get("AWS_ACCESS_KEY_ID"):
        fetch_aws_costs(args.days)
    else:
        print("Skipping AWS: AWS_ACCESS_KEY_ID not set.")

    print("\n--- Azure Costs ---")
    if os.environ.get("AZURE_SUBSCRIPTION_ID"):
        fetch_azure_costs(args.days)
    else:
        print("Skipping Azure: AZURE_SUBSCRIPTION_ID not set.")

    print("\n--- GCP Costs ---")
    if os.environ.get("GCP_BILLING_ACCOUNT_ID"):
        from fetch_gcp_costs import fetch_gcp_costs
        fetch_gcp_costs(args.days)
    else:
        print("Skipping GCP: GCP_BILLING_ACCOUNT_ID not set.")

if __name__ == "__main__":
    main()
