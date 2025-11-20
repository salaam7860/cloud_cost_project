'use client';

import { useEffect, useState } from 'react';
import { fetchCosts, fetchAlertThreshold, setAlertThreshold, CostEntry, AlertThreshold } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Bell, DollarSign, TrendingUp } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
    const [costs, setCosts] = useState<CostEntry[]>([]);
    const [alertThreshold, setAlertThresholdState] = useState<AlertThreshold | null>(null);
    const [newThreshold, setNewThreshold] = useState<string>('');
    const [totalCost, setTotalCost] = useState(0);
    const [loading, setLoading] = useState(true);

    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    useEffect(() => {
        async function loadData() {
            try {
                const [costsData, alertData] = await Promise.all([fetchCosts(), fetchAlertThreshold()]);
                setCosts(costsData);
                setAlertThresholdState(alertData);

                const total = costsData.reduce((acc, curr) => acc + curr.cost, 0);
                setTotalCost(total);
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
        } catch (error) {
            console.error('Failed to set alert:', error);
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

    // Process data for charts
    const providers = Array.from(new Set(costs.map(c => c.provider)));

    const aggregatedCosts = Object.values(costs.reduce((acc: any, curr) => {
        const date = new Date(curr.date);
        let key = curr.date; // default daily

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

    // Round off costs in aggregated data
    const roundedCostsByDate = aggregatedCosts.map((item: any) => {
        const newItem = { ...item };
        providers.forEach(provider => {
            if (newItem[provider]) {
                newItem[provider] = parseFloat(newItem[provider].toFixed(2));
            }
        });
        return newItem;
    });

    const costsByService = Object.values(costs.reduce((acc: any, curr) => {
        if (!acc[curr.service]) {
            acc[curr.service] = { name: curr.service, value: 0 };
        }
        acc[curr.service].value += curr.cost;
        return acc;
    }, {})).map((item: any) => ({ ...item, value: parseFloat(item.value.toFixed(2)) }));

    const costsByProvider = Object.values(costs.reduce((acc: any, curr) => {
        if (!acc[curr.provider]) {
            acc[curr.provider] = { name: curr.provider, value: 0 };
        }
        acc[curr.provider].value += curr.cost;
        return acc;
    }, {})).map((item: any) => ({ ...item, value: parseFloat(item.value.toFixed(2)) }));

    if (loading) return <div className="p-8 text-center" suppressHydrationWarning>Loading dashboard...</div>;

    const isAlertTriggered = alertThreshold && totalCost > alertThreshold.amount;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cloud Cost Insight</h1>
                <div className="flex items-center gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center gap-3">
                        <DollarSign className="text-green-500" />
                        <div>
                            <p className="text-sm text-gray-500">Total Spend</p>
                            <p className="text-xl font-bold">${totalCost.toFixed(2)}</p>
                        </div>
                    </div>
                    {alertThreshold && (
                        <div className={`p-4 rounded-lg shadow flex items-center gap-3 ${isAlertTriggered ? 'bg-red-50 border-red-200 border' : 'bg-white dark:bg-gray-800'}`}>
                            <Bell className={isAlertTriggered ? 'text-red-500' : 'text-gray-500'} />
                            <div>
                                <p className="text-sm text-gray-500">Alert Threshold</p>
                                <p className={`text-xl font-bold ${isAlertTriggered ? 'text-red-600' : ''}`}>${alertThreshold.amount}</p>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {isAlertTriggered && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8" role="alert">
                    <p className="font-bold">Warning</p>
                    <p>Your total spending (${totalCost.toFixed(2)}) has exceeded your alert threshold of ${alertThreshold?.amount}.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Spending Trend
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTimeframe('daily')}
                                className={`px-3 py-1 rounded-md text-sm ${timeframe === 'daily' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                Daily
                            </button>
                            <button
                                onClick={() => setTimeframe('weekly')}
                                className={`px-3 py-1 rounded-md text-sm ${timeframe === 'weekly' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                Weekly
                            </button>
                            <button
                                onClick={() => setTimeframe('monthly')}
                                className={`px-3 py-1 rounded-md text-sm ${timeframe === 'monthly' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                Monthly
                            </button>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={roundedCostsByDate}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                {providers.map((provider, index) => (
                                    <Line
                                        key={provider}
                                        type="monotone"
                                        dataKey={provider}
                                        stroke={COLORS[index % COLORS.length]}
                                        activeDot={{ r: 8 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Cost Distribution (Service)</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={costsByService as any[]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {costsByService.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Cost Distribution (Provider)</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={costsByProvider as any[]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#82ca9d"
                                    dataKey="value"
                                >
                                    {costsByProvider.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-md">
                <h2 className="text-xl font-semibold mb-4">Update Alert Threshold</h2>
                <div className="flex gap-4">
                    <input
                        type="number"
                        value={newThreshold}
                        onChange={(e) => setNewThreshold(e.target.value)}
                        placeholder="Enter amount..."
                        className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                    <button
                        onClick={handleSetAlert}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Set Alert
                    </button>
                </div>
            </div>
        </div>
    );
}
