# Cloud Cost Insight

A comprehensive multi-cloud cost tracking and analytics platform that helps you monitor, analyze, and forecast spending across AWS, Azure, and GCP.

![Cloud Cost Insight](https://img.shields.io/badge/Status-Production%20Ready-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🌟 Features

### Core Functionality
- **Multi-Cloud Support**: Track costs across AWS, Azure, and GCP in a unified dashboard
- **Real-time Monitoring**: Live cost tracking with automatic data aggregation
- **Cost Alerts**: Set custom thresholds and receive warnings when spending exceeds limits
- **Advanced Analytics**: Comprehensive visualizations powered by D3.js and Recharts

### Visualization Suite

#### Standard Dashboard (Recharts)
- **Spending Trend Chart**: Multi-provider line chart with daily/weekly/monthly views
- **Cost Distribution**: Pie charts showing breakdown by service and provider
- **Alert System**: Visual indicators for budget threshold violations

#### Advanced Analytics Dashboard (D3.js)
- **Bar Chart**: Top 10 services ranked by cost
- **Stacked Bar Chart**: Multi-cloud spend comparison across providers
- **Forecast Chart**: 7-day spending prediction with area visualization
- **Heatmap**: Daily cost trends per cloud provider (14-day view)
- **Donut Chart**: Cost breakdown by environment (Production/Development/Staging)
- **Gauge Chart**: Visual budget threshold usage indicator
- **Anomaly Detection**: Automatic detection of unusual spending patterns
- **Sortable Table**: Detailed breakdown with provider, service, cost, % change, and severity tags

### Cloud Provider Integration
- **AWS Cost Explorer**: Fetch real-time cost data from AWS
- **Azure Cost Management**: Integrate with Azure billing APIs
- **GCP Billing**: BigQuery-based cost data extraction

## 🏗️ Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with Python 3.12
- **Database**: SQLite (development) / PostgreSQL (production-ready)
- **ORM**: SQLAlchemy
- **API**: RESTful endpoints with Pydantic validation

### Frontend (Next.js)
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts + D3.js
- **Icons**: Lucide React

### Deployment
- **Containerization**: Docker & Docker Compose
- **Backend Container**: Python 3.12 slim
- **Frontend Container**: Node.js 18 Alpine

## 📦 Installation

### Prerequisites
- Python 3.12+
- Node.js 18+
- Docker & Docker Compose (optional)

### Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/salaam7860/cloud_cost_project.git
cd cloud_cost_project
```

#### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Seed the database with mock data
python -m backend.seed

# Run the backend server
fastapi dev backend/main.py
```

The backend will be available at `http://localhost:8000`

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Docker Deployment

```bash
# Build and run all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop services
docker-compose down
```

## 🔧 Configuration

### Environment Variables

#### Backend
```bash
# Database (optional, defaults to SQLite)
DATABASE_URL=postgresql://user:password@localhost/dbname

# AWS Credentials (for real data fetching)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Azure Credentials
AZURE_SUBSCRIPTION_ID=your_subscription_id
AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret

# GCP Credentials
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GCP_BILLING_ACCOUNT_ID=your_billing_account_id
```

#### Frontend
```bash
# API URL (automatically set in Docker)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📊 Database Schema

### CostEntry
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| service | String | Service name (e.g., EC2, RDS) |
| provider | String | Cloud provider (AWS/Azure/GCP) |
| cost | Float | Cost amount |
| date | String | Date in ISO format |
| project | String | Project name |
| environment | String | Environment (Production/Development/Staging) |
| created_at | DateTime | Record creation timestamp |

### AlertThreshold
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| amount | Float | Alert threshold amount |
| updated_at | DateTime | Last update timestamp |

## 🔌 API Endpoints

### Costs
- `GET /costs` - Fetch all cost entries
- `POST /costs` - Create a new cost entry

### Alerts
- `GET /alerts` - Get current alert threshold
- `POST /alerts` - Set/update alert threshold

## 🌐 Cloud Provider Integration

### AWS Cost Explorer
See [aws_integration_guide.md](aws_integration_guide.md) for detailed setup instructions.

```bash
# Run AWS cost fetcher
python backend/fetch_aws_costs.py
```

### Azure Cost Management
See [azure_integration_guide.md](azure_integration_guide.md) for detailed setup instructions.

```bash
# Run Azure cost fetcher
python backend/fetch_azure_costs.py
```

### GCP Billing
See [gcp_integration_guide.md](gcp_integration_guide.md) for detailed setup instructions.

```bash
# Run GCP cost fetcher
python backend/fetch_gcp_costs.py
```

### Combined Fetcher
```bash
# Fetch costs from all configured providers
python backend/fetch_cloud_costs.py --days 30
```

## 🎨 Features in Detail

### Anomaly Detection
The system automatically compares today's spending against historical averages and flags anomalies when:
- Cost deviation exceeds 20% from the historical average
- Unusual spending patterns are detected

### Forecasting
Uses historical data to predict future spending trends:
- Linear regression-based forecasting
- 7-day prediction window
- Confidence intervals displayed

### Cost Alerts
- Set custom spending thresholds
- Visual warnings when limits are exceeded
- Real-time alert status in dashboard header

### Multi-Timeframe Analysis
- **Daily**: Granular day-by-day cost tracking
- **Weekly**: Aggregated weekly spending trends
- **Monthly**: Month-over-month cost analysis

## 🐳 Docker Configuration

### Backend Dockerfile
- Base: `python:3.12-slim`
- Port: 8000
- Command: `fastapi run backend/main.py`

### Frontend Dockerfile
- Base: `node:18-alpine`
- Port: 3000
- Command: `npm start` (production build)

### Docker Compose Services
- **backend**: FastAPI application
- **frontend**: Next.js application with environment variable injection

## 📁 Project Structure

```
cloud-cost-insight/
├── backend/
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── costs.py
│   │   └── alerts.py
│   ├── __init__.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── main.py
│   ├── seed.py
│   ├── fetch_aws_costs.py
│   ├── fetch_azure_costs.py
│   ├── fetch_gcp_costs.py
│   ├── fetch_cloud_costs.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   └── AdvancedDashboard.tsx
│   │   ├── api.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🚀 Deployment

### Production Checklist
- [ ] Switch from SQLite to PostgreSQL
- [ ] Set up environment variables
- [ ] Configure cloud provider credentials
- [ ] Enable HTTPS/SSL
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Implement authentication (if needed)

### Recommended Hosting
- **Backend**: AWS ECS, Google Cloud Run, Azure Container Instances
- **Frontend**: Vercel, Netlify, AWS Amplify
- **Database**: AWS RDS, Azure Database, Google Cloud SQL

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **FastAPI**: Modern, fast web framework for building APIs
- **Next.js**: React framework for production
- **D3.js**: Powerful data visualization library
- **Recharts**: Composable charting library
- **Tailwind CSS**: Utility-first CSS framework

## 📧 Contact

Project Link: [https://github.com/salaam7860/cloud_cost_project](https://github.com/salaam7860/cloud_cost_project)

## 🗺️ Roadmap

- [ ] Add user authentication and multi-tenancy
- [ ] Implement cost optimization recommendations
- [ ] Add export functionality (CSV, PDF reports)
- [ ] Create mobile app
- [ ] Add Slack/Email notifications
- [ ] Implement budget planning features
- [ ] Add more cloud providers (Oracle Cloud, IBM Cloud)
- [ ] Create cost allocation by teams/departments
- [ ] Add custom tagging and filtering
- [ ] Implement role-based access control (RBAC)

---

**Built with ❤️ for cloud cost optimization**
