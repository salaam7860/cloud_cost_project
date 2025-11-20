const API_URL = 'http://localhost:8000';

export interface CostEntry {
  id: number;
  service: string;
  provider: string;
  cost: number;
  date: string;
  project: string;
  environment: string;
  created_at: string;
}

export interface AlertThreshold {
  id: number;
  amount: number;
  updated_at: string;
}

export async function fetchCosts(skip = 0, limit = 100): Promise<CostEntry[]> {
  const res = await fetch(`${API_URL}/costs/?skip=${skip}&limit=${limit}`);
  if (!res.ok) {
    throw new Error('Failed to fetch costs');
  }
  return res.json();
}

export async function fetchAlertThreshold(): Promise<AlertThreshold> {
  const res = await fetch(`${API_URL}/alerts/`);
  if (!res.ok) {
    if (res.status === 404) return { id: 0, amount: 0, updated_at: '' };
    throw new Error('Failed to fetch alert threshold');
  }
  return res.json();
}

export async function setAlertThreshold(amount: number): Promise<AlertThreshold> {
  const res = await fetch(`${API_URL}/alerts/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    throw new Error('Failed to set alert threshold');
  }
  return res.json();
}

export interface Budget {
  id: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceProjection {
  service: string;
  daily_spend: number;
  monthly_projection: number;
  status: string;
}

export interface BudgetResponse {
  budget: Budget | null;
  current_spend: number;
  remaining: number;
  forecasted_spend: number;
  percentage_used: number;
  services: ServiceProjection[];
}

export async function fetchBudget(): Promise<BudgetResponse> {
  const res = await fetch(`${API_URL}/budget/`);
  if (!res.ok) {
    throw new Error('Failed to fetch budget');
  }
  return res.json();
}

export async function setBudget(amount: number): Promise<Budget> {
  const res = await fetch(`${API_URL}/budget/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    throw new Error('Failed to set budget');
  }
  return res.json();
}

export interface Optimization {
  id: number;
  title: string;
  description: string;
  estimated_savings: number;
  status: string;
  service: string;
  provider: string;
  created_at: string;
}

export interface OptimizationResponse {
  optimizations: Optimization[];
  total_estimated_savings: number;
  total_applied_savings: number;
  pending_count: number;
  applied_count: number;
  ignored_count: number;
  savings_percentage: number;
}

export async function fetchOptimizations(): Promise<OptimizationResponse> {
  const res = await fetch(`${API_URL}/optimization/`);
  if (!res.ok) {
    throw new Error('Failed to fetch optimizations');
  }
  return res.json();
}

export async function applyOptimization(id: number): Promise<Optimization> {
  const res = await fetch(`${API_URL}/optimization/${id}/apply`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to apply optimization');
  }
  return res.json();
}

export async function ignoreOptimization(id: number): Promise<Optimization> {
  const res = await fetch(`${API_URL}/optimization/${id}/ignore`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to ignore optimization');
  }
  return res.json();
}

export async function generateOptimizations(): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/optimization/generate`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to generate optimizations');
  }
  return res.json();
}


