'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCosts, fetchAlertThreshold, setAlertThreshold, fetchBudget, CostEntry, AlertThreshold, BudgetResponse } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Bell, DollarSign, TrendingUp, X } from 'lucide-react';
import Sidebar from './Sidebar';
import AdvancedDashboard from './AdvancedDashboard';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function DashboardWithSidebar() {
    const router = useRouter();
    const [costs, setCosts] = useState<CostEntry[]>([]);
    const [alertThreshold, setAlertThresholdState] = useState<AlertThreshold | null>(null);
    const [budgetData, setBudgetData] = useState<BudgetResponse | null>(null);
    const [newThreshold, setNewThreshold] = useState<string>('');
    const [totalCost, setTotalCost] = useState(0);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [activeView, setActiveView] = useState('dashboard');
    const [showAlertModal, setShowAlertModal] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [costsData, alertData] = await Promise.all([fetchCosts(), fetchAlertThreshold()]);
                setCosts(costsData);
                setAlertThresholdState(alertData);

                const total = costsData.reduce((acc, curr) => acc + curr.cost, 0);
                setTotalCost(total);

                // Fetch budget data
                try {
                    const budget = await fetchBudget();
                    setBudgetData(budget);
                } catch (error) {
                    console.error('Failed to load budget:', error);
                }
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleSetAlert = async () => {
        if (!newThreshold) return;
        try {
            const updated = await setAlertThreshold(parseFloat(newThreshold));
            setAlertThresholdState(updated);
            setNewThreshold('');
            setShowAlertModal(false);
        } catch (error) {
            console.error('Failed to set alert:', error);
        }
    };

    const handleViewChange = (view: string) => {
        if (view === 'budget') {
            router.push('/budget');
        } else {
            setActiveView(view);
        }
    };

    // Helper to get week number
    const getWeek = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    // Filter costs by provider
    const getFilteredCosts = () => {
        if (activeView === 'aws') return costs.filter(c => c.provider === 'AWS');
        if (activeView === 'azure') return costs.filter(c => c.provider === 'Azure');
        if (activeView === 'gcp') return costs.filter(c => c.provider === 'GCP');
        return costs;
    };

    const filteredCosts = getFilteredCosts();
    const providers = Array.from(new Set(filteredCosts.map(c => c.provider)));

    const aggregatedCosts = Object.values(filteredCosts.reduce((acc: any, curr) => {
        const date = new Date(curr.date);
        let key = curr.date;

        if (timeframe === 'weekly') {
            const week = getWeek(date);
            key = `${date.getFullYear()}-W${week}`;
        } else if (timeframe === 'monthly') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!acc[key]) {
            acc[key] = { date: key };
        }
        if (!acc[key][curr.provider]) {
            acc[key][curr.provider] = 0;
        }
        acc[key][curr.provider] += curr.cost;
        return acc;
    }, {})).sort((a: any, b: any) => a.date.localeCompare(b.date));

    const roundedCostsByDate = aggregatedCosts.map((item: any) => {
        const newItem = { ...item };
        providers.forEach(provider => {
            if (newItem[provider]) {
                newItem[provider] = parseFloat(newItem[provider].toFixed(2));
            }
        });
        return newItem;
    });

    const costsByService = Object.values(filteredCosts.reduce((acc: any, curr) => {
        if (!acc[curr.service]) {
            acc[curr.service] = { name: curr.service, value: 0 };
        }
        acc[curr.service].value += curr.cost;
        return acc;
    }, {})).map((item: any) => ({ ...item, value: parseFloat(item.value.toFixed(2)) }));

    const costsByProvider = Object.values(filteredCosts.reduce((acc: any, curr) => {
        if (!acc[curr.provider]) {
            acc[curr.provider] = { name: curr.provider, value: 0 };
        }
        acc[curr.provider].value += curr.cost;
        return acc;
    }, {})).map((item: any) => ({ ...item, value: parseFloat(item.value.toFixed(2)) }));

    if (loading) return <div className="flex h-screen items-center justify-center">Loading dashboard...</div>;

    const isAlertTriggered = alertThreshold && totalCost > alertThreshold.amount;

    const getViewTitle = () => {
        switch (activeView) {
            case 'aws': return 'AWS Cost Breakdown';
            case 'azure': return 'Azure Cost Breakdown';
            case 'gcp': return 'GCP Cost Breakdown';
            case 'analytics': return 'Advanced Analytics';
            default: return 'Cloud Cost Dashboard';
        }
    };

    return (
        <div className="flex h-screen bg-gray-900">
            {/* Sidebar */}
            <Sidebar
                activeView={activeView}
                onViewChange={handleViewChange}
                onAlertClick={() => setShowAlertModal(true)}
            />

            {/* Main Content */}
            {activeView === 'analytics' ? (
                <div className="flex-1 overflow-auto bg-gray-900">
                    <AdvancedDashboard />
                </div>
            ) : (
                <div className="flex-1 overflow-auto bg-gray-900">
                    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
                        {/* Header */}
                        <header className="flex justify-between items-center">
                            <h1 className="text-3xl font-bold text-gray-100">{getViewTitle()}</h1>
                            <div className="flex items-center gap-4">
                                <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700 flex items-center gap-3">
                                    <DollarSign className="text-green-400" />
                                    <div>
                                        <p className="text-sm text-gray-400">Total Spend</p>
                                        <p className="text-xl font-bold text-gray-100">${totalCost.toFixed(2)}</p>
                                    </div>
                                </div>
                                {alertThreshold && (
                                    <div className={`p-4 rounded-lg shadow flex items-center gap-3 border ${isAlertTriggered ? 'bg-red-900 border-red-700' : 'bg-gray-800 border-gray-700'}`}>
                                        <Bell className={isAlertTriggered ? 'text-red-400' : 'text-gray-400'} />
                                        <div>
                                            <p className="text-sm text-gray-400">Alert Threshold</p>
                                            <p className={`text-xl font-bold ${isAlertTriggered ? 'text-red-400' : 'text-gray-100'}`}>${alertThreshold.amount}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </header>

                        {/* Alert Warning */}
                        {isAlertTriggered && (
                            <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-4" role="alert">
                                <p className="font-bold">Warning</p>
                                <p>Your total spending (${totalCost.toFixed(2)}) has exceeded your alert threshold of ${alertThreshold?.amount}.</p>
                            </div>
                        )}

                        {/* Budget Warning Banner */}
                        {budgetData && budgetData.budget && budgetData.percentage_used >= 80 && (
                            <div className="bg-amber-900 border-l-4 border-amber-500 text-amber-200 p-4 rounded-lg" role="alert">
                                <p className="font-bold">⚠ Budget nearing limit — Consider optimizing resources.</p>
                                <p>You've used {budgetData.percentage_used.toFixed(1)}% of your monthly budget (${budgetData.current_spend.toFixed(2)} / ${budgetData.budget.amount}).</p>
                            </div>
                        )}

                        {/* Charts */}
                        <div className="space-y-8">
                            {/* Spending Trend - Full Width */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-100">
                                        <TrendingUp className="w-5 h-5" />
                                        Spending Trend
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setTimeframe('daily')}
                                            className={`px-3 py-1 rounded-md text-sm ${timeframe === 'daily' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                                        >
                                            Daily
                                        </button>
                                        <button
                                            onClick={() => setTimeframe('weekly')}
                                            className={`px-3 py-1 rounded-md text-sm ${timeframe === 'weekly' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                                        >
                                            Weekly
                                        </button>
                                        <button
                                            onClick={() => setTimeframe('monthly')}
                                            className={`px-3 py-1 rounded-md text-sm ${timeframe === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                                        >
                                            Monthly
                                        </button>
                                    </div>
                                </div>
                                <div className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={roundedCostsByDate}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="date" stroke="#9CA3AF" />
                                            <YAxis stroke="#9CA3AF" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                                                labelStyle={{ color: '#F3F4F6' }}
                                            />
                                            <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                                            {providers.map((provider, index) => (
                                                <Line
                                                    key={provider}
                                                    type="monotone"
                                                    dataKey={provider}
                                                    stroke={COLORS[index % COLORS.length]}
                                                    strokeWidth={2}
                                                    activeDot={{ r: 8 }}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Pie Charts Side by Side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                                    <h2 className="text-xl font-semibold mb-4 text-gray-100">Cost Distribution (Service)</h2>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={costsByService as any[]}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                                    outerRadius={120}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {costsByService.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                                                    labelStyle={{ color: '#F3F4F6' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                                    <h2 className="text-xl font-semibold mb-4 text-gray-100">Cost Distribution (Provider)</h2>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={costsByProvider as any[]}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                                    outerRadius={120}
                                                    fill="#82ca9d"
                                                    dataKey="value"
                                                >
                                                    {costsByProvider.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                                                    labelStyle={{ color: '#F3F4F6' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Modal */}
            {showAlertModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-xl max-w-md w-full mx-4 border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-100">Set Alert Threshold</h2>
                            <button onClick={() => setShowAlertModal(false)} className="text-gray-400 hover:text-gray-200">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Current Threshold: ${alertThreshold?.amount || 0}
                                </label>
                                <input
                                    type="number"
                                    value={newThreshold}
                                    onChange={(e) => setNewThreshold(e.target.value)}
                                    placeholder="Enter new threshold amount..."
                                    className="w-full p-3 border rounded-lg bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                                />
                            </div>
                            <button
                                onClick={handleSetAlert}
                                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Update Alert Threshold
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
