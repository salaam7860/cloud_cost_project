'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchOptimizations, applyOptimization, ignoreOptimization, OptimizationResponse, Optimization } from '../api';
import { TrendingUp, CheckCircle, XCircle, Clock, Sparkles, DollarSign } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function CostOptimization() {
    const router = useRouter();
    const [optimizationData, setOptimizationData] = useState<OptimizationResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('optimization');
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        loadOptimizationData();
    }, []);

    const loadOptimizationData = async () => {
        try {
            const data = await fetchOptimizations();
            setOptimizationData(data);
        } catch (error) {
            console.error('Failed to load optimizations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (id: number) => {
        setProcessingId(id);
        try {
            await applyOptimization(id);
            await loadOptimizationData();
        } catch (error) {
            console.error('Failed to apply optimization:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleIgnore = async (id: number) => {
        setProcessingId(id);
        try {
            await ignoreOptimization(id);
            await loadOptimizationData();
        } catch (error) {
            console.error('Failed to ignore optimization:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleViewChange = (view: string) => {
        if (view === 'optimization') {
            return;
        } else if (view === 'budget') {
            router.push('/budget');
        } else {
            router.push('/');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'applied': return 'bg-emerald-900/30 text-emerald-400 border-emerald-700';
            case 'ignored': return 'bg-rose-900/30 text-rose-400 border-rose-700';
            case 'pending': return 'bg-amber-900/30 text-amber-400 border-amber-700';
            default: return 'bg-gray-800 text-gray-400 border-gray-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'applied': return <CheckCircle className="w-4 h-4" />;
            case 'ignored': return <XCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            default: return null;
        }
    };

    const getProviderColor = (provider: string) => {
        switch (provider) {
            case 'AWS': return 'bg-orange-900/30 text-orange-400';
            case 'Azure': return 'bg-blue-900/30 text-blue-400';
            case 'GCP': return 'bg-red-900/30 text-red-400';
            default: return 'bg-gray-800 text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-900">
                <Sidebar activeView={activeView} onViewChange={handleViewChange} onAlertClick={() => { }} />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-400">Loading optimization recommendations...</p>
                </div>
            </div>
        );
    }

    const totalEstimatedSavings = optimizationData?.total_estimated_savings || 0;
    const totalAppliedSavings = optimizationData?.total_applied_savings || 0;
    const pendingCount = optimizationData?.pending_count || 0;
    const appliedCount = optimizationData?.applied_count || 0;
    const ignoredCount = optimizationData?.ignored_count || 0;
    const savingsPercentage = optimizationData?.savings_percentage || 0;
    const optimizations = optimizationData?.optimizations || [];

    // Prepare chart data
    const savingsChartData = [
        { name: 'Potential Savings', value: totalEstimatedSavings, fill: '#10B981' },
        { name: 'Applied Savings', value: totalAppliedSavings, fill: '#3B82F6' },
    ];

    const statusChartData = [
        { name: 'Pending', value: pendingCount, fill: '#F59E0B' },
        { name: 'Applied', value: appliedCount, fill: '#10B981' },
        { name: 'Ignored', value: ignoredCount, fill: '#EF4444' },
    ];

    return (
        <div className="flex h-screen bg-gray-900">
            <Sidebar activeView={activeView} onViewChange={handleViewChange} onAlertClick={() => { }} />

            <div className="flex-1 overflow-auto bg-gray-900">
                <div className="p-8 max-w-[1600px] mx-auto space-y-8">
                    {/* Header */}
                    <header>
                        <h1 className="text-3xl font-bold text-gray-100 mb-2">Cost Optimization</h1>
                        <p className="text-gray-400">Discover and apply cost-saving recommendations</p>
                    </header>

                    {/* Positive Feedback Banner */}
                    {savingsPercentage >= 15 && (
                        <div className="bg-emerald-900 border-l-4 border-emerald-500 text-emerald-200 p-4 rounded-lg" role="alert">
                            <p className="font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                🎉 Significant cost savings ahead! Consider applying all recommendations.
                            </p>
                            <p className="mt-1">You could save {savingsPercentage.toFixed(1)}% of your monthly spend by implementing these optimizations.</p>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total Estimated Savings */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-emerald-900/30 rounded-lg">
                                    <DollarSign className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h3 className="text-sm font-medium text-gray-400">Total Potential Savings</h3>
                            </div>
                            <p className="text-3xl font-bold text-gray-100">${totalEstimatedSavings.toFixed(2)}</p>
                            <p className="text-sm text-gray-400 mt-2">{savingsPercentage.toFixed(1)}% of monthly spend</p>
                        </div>

                        {/* Applied Savings */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-blue-900/30 rounded-lg">
                                    <CheckCircle className="w-6 h-6 text-blue-400" />
                                </div>
                                <h3 className="text-sm font-medium text-gray-400">Applied Savings</h3>
                            </div>
                            <p className="text-3xl font-bold text-gray-100">${totalAppliedSavings.toFixed(2)}</p>
                            <p className="text-sm text-gray-400 mt-2">{appliedCount} recommendations applied</p>
                        </div>

                        {/* Pending Recommendations */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-amber-900/30 rounded-lg">
                                    <Clock className="w-6 h-6 text-amber-400" />
                                </div>
                                <h3 className="text-sm font-medium text-gray-400">Pending</h3>
                            </div>
                            <p className="text-3xl font-bold text-gray-100">{pendingCount}</p>
                            <p className="text-sm text-gray-400 mt-2">Awaiting action</p>
                        </div>

                        {/* Ignored Recommendations */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-rose-900/30 rounded-lg">
                                    <XCircle className="w-6 h-6 text-rose-400" />
                                </div>
                                <h3 className="text-sm font-medium text-gray-400">Ignored</h3>
                            </div>
                            <p className="text-3xl font-bold text-gray-100">{ignoredCount}</p>
                            <p className="text-sm text-gray-400 mt-2">Dismissed recommendations</p>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Savings Chart */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-100 mb-4">Savings Overview</h2>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={savingsChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="name" stroke="#9CA3AF" />
                                        <YAxis stroke="#9CA3AF" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                                            labelStyle={{ color: '#F3F4F6' }}
                                        />
                                        <Bar dataKey="value" fill="#10B981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Status Distribution */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-100 mb-4">Recommendation Status</h2>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {statusChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations List */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-100 mb-6">Optimization Recommendations</h2>
                        <div className="space-y-4">
                            {optimizations.length > 0 ? (
                                optimizations.map((opt) => (
                                    <div
                                        key={opt.id}
                                        className="bg-gray-700/50 p-6 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-100">{opt.title}</h3>
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(opt.status)}`}>
                                                        {getStatusIcon(opt.status)}
                                                        {opt.status.charAt(0).toUpperCase() + opt.status.slice(1)}
                                                    </span>
                                                </div>
                                                <p className="text-gray-300 mb-3">{opt.description}</p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-emerald-400" />
                                                        <span className="text-emerald-400 font-semibold">
                                                            ${opt.estimated_savings.toFixed(2)} savings
                                                        </span>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getProviderColor(opt.provider)}`}>
                                                        {opt.provider}
                                                    </span>
                                                    <span className="text-gray-400">{opt.service}</span>
                                                </div>
                                            </div>
                                            {opt.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApply(opt.id)}
                                                        disabled={processingId === opt.id}
                                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {processingId === opt.id ? 'Processing...' : 'Apply'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleIgnore(opt.id)}
                                                        disabled={processingId === opt.id}
                                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Ignore
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400 text-lg">No optimization recommendations available</p>
                                    <p className="text-gray-500 text-sm mt-2">Check back later for cost-saving opportunities</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
