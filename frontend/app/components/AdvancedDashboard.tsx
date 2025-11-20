'use client';

import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { fetchCosts, CostEntry } from '../api';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Area,
    AreaChart,
    ComposedChart
} from 'recharts';

// Professional FinOps Color Palette
const COLORS = {
    AWS: '#FF9900',       // AWS Orange
    Azure: '#0078D4',     // Azure Blue
    GCP: '#34A853',       // GCP Green

    // Environment Colors
    Prod: '#EF4444',      // Red
    Stage: '#F59E0B',     // Amber
    Dev: '#10B981',       // Emerald
    Test: '#3B82F6',      // Blue

    // UI Colors
    Background: '#0F172A', // Slate 900
    CardBg: '#1E293B',     // Slate 800
    TextPrimary: '#F8FAFC', // Slate 50
    TextSecondary: '#94A3B8', // Slate 400
    Border: '#334155',     // Slate 700
    Grid: '#334155',       // Slate 700

    // Gauge
    GaugeTrack: '#334155',
    GaugeFill: '#6366F1'   // Indigo
};

export default function AdvancedDashboard() {
    const [costs, setCosts] = useState<CostEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const costsData = await fetchCosts();
                setCosts(costsData);
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0F172A] text-white">Loading dashboard...</div>;

    // --- Data Processing ---

    // 1. Cost by Service (Top 10) - Horizontal Bar
    const serviceData = Array.from(
        d3.rollup(costs, v => Math.round(d3.sum(v, d => d.cost)), d => d.service)
    ).map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    // 2. Multi-Cloud Spend Comparison - Grouped Column
    const groupedData = Array.from(
        d3.rollup(costs, v => v, d => d.date) // Group by date first for x-axis
    ).map(([date, entries]) => {
        const providerCosts = d3.rollup(entries, v => Math.round(d3.sum(v, d => d.cost)), d => d.provider);
        return {
            date,
            AWS: providerCosts.get('AWS') || 0,
            Azure: providerCosts.get('Azure') || 0,
            GCP: providerCosts.get('GCP') || 0,
        };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7); // Last 7 days for clarity

    // 3. Spending Forecast - Line Chart with Trend
    const dailyTotal = Array.from(
        d3.rollup(costs, v => Math.round(d3.sum(v, d => d.cost)), d => d.date)
    ).map(([date, value]) => ({ date, value }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Simple linear forecast for next 7 days
    const lastDay = dailyTotal[dailyTotal.length - 1];
    const avgDaily = d3.mean(dailyTotal, d => d.value) || 0;
    const forecastData = [...dailyTotal];
    for (let i = 1; i <= 7; i++) {
        const nextDate = new Date(lastDay.date);
        nextDate.setDate(nextDate.getDate() + i);
        forecastData.push({
            date: nextDate.toISOString().split('T')[0],
            value: Math.round(avgDaily * (1 + (Math.random() * 0.1 - 0.05))), // +/- 5% variation
            isForecast: true
        });
    }

    // 4. Daily Cost Heatmap - Calendar Data
    const heatmapData = Array.from(
        d3.rollup(costs, v => Math.round(d3.sum(v, d => d.cost)), d => d.date)
    ).map(([date, value]) => ({ date, value }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14); // Last 14 days

    // 5. Cost by Environment - Donut
    const envData = Array.from(
        d3.rollup(costs, v => Math.round(d3.sum(v, d => d.cost)), d => d.environment)
    ).map(([name, value]) => ({ name, value }));

    // 6. Budget Threshold Usage - Gauge Data
    const totalCost = Math.round(d3.sum(costs, d => d.cost));
    const budget = 5000; // Example budget
    const budgetUsage = Math.min((totalCost / budget) * 100, 100);

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-700 p-3 rounded shadow-xl">
                    <p className="text-slate-200 font-semibold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: ${Math.round(entry.value).toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen p-8 bg-[#0F172A] text-slate-50 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-8">

                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Cloud Cost Intelligence</h1>
                    <p className="text-slate-400 mt-1">Real-time financial visibility across your multi-cloud infrastructure</p>
                </header>

                {/* Top Row: Key Metrics (Placeholder for now, focusing on charts) */}

                {/* Row 1: Service Breakdown & Multi-Cloud Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* 1. Cost by Service (Horizontal Bar) */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                        <h2 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                            Top 10 Services by Cost
                        </h2>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={serviceData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.Grid} horizontal={false} />
                                    <XAxis type="number" stroke={COLORS.TextSecondary} tickFormatter={(val) => `$${val}`} />
                                    <YAxis type="category" dataKey="name" stroke={COLORS.TextSecondary} width={100} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20} name="Cost" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2. Multi-Cloud Spend (Grouped Column) */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                        <h2 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                            Multi-Cloud Spend Comparison
                        </h2>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={groupedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.Grid} vertical={false} />
                                    <XAxis dataKey="date" stroke={COLORS.TextSecondary} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })} />
                                    <YAxis stroke={COLORS.TextSecondary} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="AWS" fill={COLORS.AWS} radius={[4, 4, 0, 0]} name="AWS" />
                                    <Bar dataKey="Azure" fill={COLORS.Azure} radius={[4, 4, 0, 0]} name="Azure" />
                                    <Bar dataKey="GCP" fill={COLORS.GCP} radius={[4, 4, 0, 0]} name="GCP" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Row 2: Forecast & Heatmap */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* 3. Spending Forecast (Line with Trend) - Spans 2 columns */}
                    <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                        <h2 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                            Spending Forecast (Next 7 Days)
                        </h2>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={forecastData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.Grid} vertical={false} />
                                    <XAxis dataKey="date" stroke={COLORS.TextSecondary} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })} />
                                    <YAxis stroke={COLORS.TextSecondary} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="value" stroke="#10B981" fillOpacity={1} fill="url(#colorValue)" name="Total Cost" />
                                    <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} strokeDasharray="5 5" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 4. Daily Cost Heatmap (Calendar Style) */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                        <h2 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                            Daily Cost Intensity
                        </h2>
                        <div className="grid grid-cols-7 gap-2 h-[350px] content-start">
                            {heatmapData.map((day, i) => {
                                const intensity = Math.min(day.value / 500, 1); // Normalize based on max expected cost
                                return (
                                    <div key={i} className="flex flex-col items-center gap-1 group relative">
                                        <div
                                            className="w-full aspect-square rounded-md transition-all duration-300 hover:scale-110 hover:z-10 cursor-pointer"
                                            style={{
                                                backgroundColor: `rgba(139, 92, 246, ${0.2 + intensity * 0.8})`, // Purple base
                                                border: `1px solid rgba(139, 92, 246, ${0.3 + intensity * 0.7})`
                                            }}
                                        ></div>
                                        <span className="text-[10px] text-slate-400">{new Date(day.date).getDate()}</span>

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-xs px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20">
                                            ${day.value}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Row 3: Environment & Budget */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* 5. Cost by Environment (Donut) */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                        <h2 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
                            Cost by Environment
                        </h2>
                        <div className="h-[300px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={envData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {envData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={[COLORS.Prod, COLORS.Stage, COLORS.Dev, COLORS.Test][index % 4]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 6. Budget Threshold (Gauge) */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                        <h2 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-red-500 rounded-full"></span>
                            Budget Usage
                        </h2>
                        <div className="h-[300px] flex flex-col items-center justify-center relative">
                            {/* Custom SVG Gauge */}
                            <svg viewBox="0 0 200 120" className="w-full h-full max-w-[300px]">
                                {/* Background Arc */}
                                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={COLORS.GaugeTrack} strokeWidth="20" strokeLinecap="round" />

                                {/* Value Arc */}
                                <path
                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                    fill="none"
                                    stroke={budgetUsage > 90 ? '#EF4444' : budgetUsage > 75 ? '#F59E0B' : '#10B981'}
                                    strokeWidth="20"
                                    strokeLinecap="round"
                                    strokeDasharray="251.2" // Circumference of half circle (PI * 80)
                                    strokeDashoffset={251.2 * (1 - budgetUsage / 100)}
                                    className="transition-all duration-1000 ease-out"
                                />

                                {/* Text */}
                                <text x="100" y="90" textAnchor="middle" fontSize="32" fontWeight="bold" fill="white">
                                    {Math.round(budgetUsage)}%
                                </text>
                                <text x="100" y="115" textAnchor="middle" fontSize="12" fill={COLORS.TextSecondary}>
                                    ${totalCost.toLocaleString()} / ${budget.toLocaleString()}
                                </text>
                            </svg>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
