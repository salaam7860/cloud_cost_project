'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchBudget, setBudget, BudgetResponse } from '../api';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Wallet } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function BudgetPlanning() {
    const router = useRouter();
    const [budgetData, setBudgetData] = useState<BudgetResponse | null>(null);
    const [newBudget, setNewBudget] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeView, setActiveView] = useState('budget');

    useEffect(() => {
        loadBudgetData();
    }, []);

    const loadBudgetData = async () => {
        try {
            const data = await fetchBudget();
            setBudgetData(data);
        } catch (error) {
            console.error('Failed to load budget:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSetBudget = async () => {
        if (!newBudget || parseFloat(newBudget) <= 0) return;

        setSaving(true);
        try {
            await setBudget(parseFloat(newBudget));
            await loadBudgetData();
            setNewBudget('');
        } catch (error) {
            console.error('Failed to set budget:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleViewChange = (view: string) => {
        if (view === 'budget') {
            // Already on budget page, do nothing
            return;
        }
        // Navigate back to home for all other views
        router.push('/');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'green': return 'text-emerald-400 bg-emerald-900/30';
            case 'yellow': return 'text-amber-400 bg-amber-900/30';
            case 'red': return 'text-rose-400 bg-rose-900/30';
            default: return 'text-gray-400 bg-gray-800';
        }
    };

    const getProgressColor = (percentage: number) => {
        if (percentage < 50) return 'bg-emerald-500';
        if (percentage < 80) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-900">
                <Sidebar activeView={activeView} onViewChange={handleViewChange} onAlertClick={() => { }} />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-400">Loading budget data...</p>
                </div>
            </div>
        );
    }

    const budgetAmount = budgetData?.budget?.amount || 0;
    const currentSpend = budgetData?.current_spend || 0;
    const remaining = budgetData?.remaining || 0;
    const forecasted = budgetData?.forecasted_spend || 0;
    const percentageUsed = budgetData?.percentage_used || 0;

    return (
        <div className="flex h-screen bg-gray-900">
            <Sidebar activeView={activeView} onViewChange={handleViewChange} onAlertClick={() => { }} />

            <div className="flex-1 overflow-auto bg-gray-900">
                <div className="p-8 max-w-[1600px] mx-auto space-y-8">
                    {/* Header */}
                    <header>
                        <h1 className="text-3xl font-bold text-gray-100 mb-2">Budget Planning</h1>
                        <p className="text-gray-400">Set and track your monthly cloud spending budget</p>
                    </header>

                    {/* Set Budget Form */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-100 mb-4">Set Monthly Budget</h2>
                        <div className="flex gap-4">
                            <input
                                type="number"
                                value={newBudget}
                                onChange={(e) => setNewBudget(e.target.value)}
                                placeholder="Enter budget amount..."
                                className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleSetBudget}
                                disabled={saving || !newBudget}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Set Budget'}
                            </button>
                        </div>
                        {budgetAmount > 0 && (
                            <p className="mt-3 text-sm text-gray-400">
                                Current budget: <span className="text-gray-200 font-semibold">${budgetAmount.toFixed(2)}</span>
                            </p>
                        )}
                    </div>

                    {/* Budget Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Monthly Budget Card */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-blue-900/30 rounded-lg">
                                    <Wallet className="w-6 h-6 text-blue-400" />
                                </div>
                                <h3 className="text-sm font-medium text-gray-400">Monthly Budget</h3>
                            </div>
                            <p className="text-3xl font-bold text-gray-100">${budgetAmount.toFixed(2)}</p>
                        </div>

                        {/* Spent So Far Card */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-emerald-900/30 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h3 className="text-sm font-medium text-gray-400">Spent So Far</h3>
                            </div>
                            <p className="text-3xl font-bold text-gray-100">${currentSpend.toFixed(2)}</p>
                            <p className="text-sm text-gray-400 mt-2">{percentageUsed.toFixed(1)}% of budget</p>
                        </div>

                        {/* Remaining Balance Card */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-3 rounded-lg ${remaining >= 0 ? 'bg-amber-900/30' : 'bg-rose-900/30'}`}>
                                    {remaining >= 0 ? (
                                        <DollarSign className="w-6 h-6 text-amber-400" />
                                    ) : (
                                        <AlertCircle className="w-6 h-6 text-rose-400" />
                                    )}
                                </div>
                                <h3 className="text-sm font-medium text-gray-400">Remaining Balance</h3>
                            </div>
                            <p className={`text-3xl font-bold ${remaining >= 0 ? 'text-gray-100' : 'text-rose-400'}`}>
                                ${Math.abs(remaining).toFixed(2)}
                            </p>
                            {remaining < 0 && <p className="text-sm text-rose-400 mt-2">Over budget</p>}
                        </div>

                        {/* Forecasted Spend Card */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-3 rounded-lg ${forecasted > budgetAmount ? 'bg-rose-900/30' : 'bg-emerald-900/30'}`}>
                                    <TrendingDown className={`w-6 h-6 ${forecasted > budgetAmount ? 'text-rose-400' : 'text-emerald-400'}`} />
                                </div>
                                <h3 className="text-sm font-medium text-gray-400">Forecasted End-of-Month</h3>
                            </div>
                            <p className={`text-3xl font-bold ${forecasted > budgetAmount ? 'text-rose-400' : 'text-gray-100'}`}>
                                ${forecasted.toFixed(2)}
                            </p>
                            {forecasted > budgetAmount && (
                                <p className="text-sm text-rose-400 mt-2">Projected to exceed budget</p>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-100 mb-4">Budget Consumption</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Progress</span>
                                <span className="text-gray-100 font-semibold">{percentageUsed.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${getProgressColor(percentageUsed)}`}
                                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>$0</span>
                                <span>${budgetAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Service Breakdown Table */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-100 mb-4">Service Breakdown</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Service</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Daily Spend</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Monthly Projection</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {budgetData?.services && budgetData.services.length > 0 ? (
                                        budgetData.services.map((service, index) => (
                                            <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                                                <td className="py-3 px-4 text-gray-100">{service.service}</td>
                                                <td className="py-3 px-4 text-right text-gray-100">${service.daily_spend.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-right text-gray-100">${service.monthly_projection.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(service.status)}`}>
                                                        {service.status === 'green' && '● Low'}
                                                        {service.status === 'yellow' && '● Medium'}
                                                        {service.status === 'red' && '● High'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-gray-500">
                                                No service data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
