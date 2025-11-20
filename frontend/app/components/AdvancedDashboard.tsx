'use client';

import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { fetchCosts, CostEntry } from '../api';

export default function AdvancedDashboard() {
    const [costs, setCosts] = useState<CostEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Refs for D3 charts
    const barChartRef = useRef<HTMLDivElement>(null);
    const stackedBarRef = useRef<HTMLDivElement>(null);
    const forecastRef = useRef<HTMLDivElement>(null);
    const heatmapRef = useRef<HTMLDivElement>(null);
    const donutRef = useRef<HTMLDivElement>(null);
    const gaugeRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (!loading && costs.length > 0) {
            renderBarChart();
            renderStackedBarChart();
            renderForecastChart();
            renderHeatmap();
            renderDonutChart();
            renderGaugeChart();
        }
    }, [loading, costs]);

    const renderBarChart = () => {
        if (!barChartRef.current) return;

        const container = d3.select(barChartRef.current);
        container.selectAll('*').remove();

        // Aggregate costs by service
        const serviceData = d3.rollup(
            costs,
            v => d3.sum(v, d => d.cost),
            d => d.service
        );

        const data = Array.from(serviceData, ([service, cost]) => ({ service, cost }))
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 10);

        const margin = { top: 20, right: 30, bottom: 60, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .range([0, width])
            .domain(data.map(d => d.service))
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.cost) || 0])
            .range([height, 0]);

        svg.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.service) || 0)
            .attr('y', d => y(d.cost))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.cost))
            .attr('fill', '#4F46E5')
            .attr('rx', 4);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        svg.append('g')
            .call(d3.axisLeft(y).tickFormat(d => `$${d}`));
    };

    const renderStackedBarChart = () => {
        if (!stackedBarRef.current) return;

        const container = d3.select(stackedBarRef.current);
        container.selectAll('*').remove();

        // Group by service and provider
        const grouped = d3.rollup(
            costs,
            v => d3.sum(v, d => d.cost),
            d => d.service,
            d => d.provider
        );

        const services = Array.from(grouped.keys()).slice(0, 8);
        const providers = ['AWS', 'Azure', 'GCP'];

        const data = services.map(service => {
            const obj: any = { service };
            providers.forEach(provider => {
                obj[provider] = grouped.get(service)?.get(provider) || 0;
            });
            return obj;
        });

        const margin = { top: 20, right: 100, bottom: 60, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(services)
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => providers.reduce((sum, p) => sum + (d[p] || 0), 0)) || 0])
            .range([height, 0]);

        const color = d3.scaleOrdinal()
            .domain(providers)
            .range(['#3B82F6', '#10B981', '#F59E0B']);

        const stack = d3.stack().keys(providers);
        const series = stack(data as any);

        svg.append('g')
            .selectAll('g')
            .data(series)
            .enter().append('g')
            .attr('fill', d => color(d.key) as string)
            .selectAll('rect')
            .data(d => d)
            .enter().append('rect')
            .attr('x', d => x((d.data as any).service) || 0)
            .attr('y', d => y(d[1]))
            .attr('height', d => y(d[0]) - y(d[1]))
            .attr('width', x.bandwidth())
            .attr('rx', 2);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        svg.append('g')
            .call(d3.axisLeft(y).tickFormat(d => `$${d}`));

        // Legend
        const legend = svg.append('g')
            .attr('transform', `translate(${width + 10}, 0)`);

        providers.forEach((provider, i) => {
            const g = legend.append('g')
                .attr('transform', `translate(0, ${i * 20})`);

            g.append('rect')
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', color(provider) as string);

            g.append('text')
                .attr('x', 20)
                .attr('y', 12)
                .text(provider)
                .style('font-size', '12px');
        });
    };

    const renderForecastChart = () => {
        if (!forecastRef.current) return;

        const container = d3.select(forecastRef.current);
        container.selectAll('*').remove();

        // Group by date
        const dateData = d3.rollup(
            costs,
            v => d3.sum(v, d => d.cost),
            d => d.date
        );

        const historicalData = Array.from(dateData, ([date, cost]) => ({
            date: new Date(date),
            cost
        })).sort((a, b) => a.date.getTime() - b.date.getTime());

        // Simple linear forecast
        const avgDailyCost = d3.mean(historicalData, d => d.cost) || 0;
        const lastDate = historicalData[historicalData.length - 1]?.date || new Date();

        const forecastData = [];
        for (let i = 1; i <= 7; i++) {
            const futureDate = new Date(lastDate);
            futureDate.setDate(futureDate.getDate() + i);
            forecastData.push({
                date: futureDate,
                cost: avgDailyCost * (1 + Math.random() * 0.1 - 0.05)
            });
        }

        const allData = [...historicalData, ...forecastData];

        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime()
            .domain(d3.extent(allData, d => d.date) as [Date, Date])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(allData, d => d.cost) || 0])
            .range([height, 0]);

        const line = d3.line<any>()
            .x(d => x(d.date))
            .y(d => y(d.cost))
            .curve(d3.curveMonotoneX);

        const area = d3.area<any>()
            .x(d => x(d.date))
            .y0(height)
            .y1(d => y(d.cost))
            .curve(d3.curveMonotoneX);

        svg.append('path')
            .datum(historicalData)
            .attr('fill', 'rgba(79, 70, 229, 0.2)')
            .attr('d', area);

        svg.append('path')
            .datum(historicalData)
            .attr('fill', 'none')
            .attr('stroke', '#4F46E5')
            .attr('stroke-width', 2)
            .attr('d', line);

        svg.append('path')
            .datum(forecastData)
            .attr('fill', 'none')
            .attr('stroke', '#F59E0B')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('d', line);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x));

        svg.append('g')
            .call(d3.axisLeft(y).tickFormat(d => `$${d}`));
    };

    const renderHeatmap = () => {
        if (!heatmapRef.current) return;

        const container = d3.select(heatmapRef.current);
        container.selectAll('*').remove();

        // Group by date and provider
        const heatmapData = d3.rollup(
            costs,
            v => d3.sum(v, d => d.cost),
            d => d.date,
            d => d.provider
        );

        const dates = Array.from(new Set(costs.map(c => c.date))).sort().slice(-14);
        const providers = ['AWS', 'Azure', 'GCP'];

        const data: any[] = [];
        dates.forEach(date => {
            providers.forEach(provider => {
                data.push({
                    date,
                    provider,
                    cost: heatmapData.get(date)?.get(provider) || 0
                });
            });
        });

        const margin = { top: 20, right: 30, bottom: 60, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 200 - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .range([0, width])
            .domain(dates)
            .padding(0.05);

        const y = d3.scaleBand()
            .range([0, height])
            .domain(providers)
            .padding(0.05);

        const colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateBlues)
            .domain([0, d3.max(data, d => d.cost) || 0]);

        svg.selectAll()
            .data(data)
            .enter()
            .append('rect')
            .attr('x', d => x(d.date) || 0)
            .attr('y', d => y(d.provider) || 0)
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .style('fill', d => colorScale(d.cost))
            .attr('rx', 2);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
            .style('font-size', '10px');

        svg.append('g')
            .call(d3.axisLeft(y));
    };

    const renderDonutChart = () => {
        if (!donutRef.current) return;

        const container = d3.select(donutRef.current);
        container.selectAll('*').remove();

        const envData = d3.rollup(
            costs,
            v => d3.sum(v, d => d.cost),
            d => d.environment
        );

        const data = Array.from(envData, ([environment, cost]) => ({ environment, cost }));

        const width = 300;
        const height = 300;
        const radius = Math.min(width, height) / 2;

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        const color = d3.scaleOrdinal()
            .domain(data.map(d => d.environment))
            .range(['#3B82F6', '#10B981', '#F59E0B']);

        const pie = d3.pie<any>()
            .value(d => d.cost)
            .sort(null);

        const arc = d3.arc<any>()
            .innerRadius(radius * 0.6)
            .outerRadius(radius * 0.9);

        const arcs = svg.selectAll('.arc')
            .data(pie(data))
            .enter()
            .append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data.environment) as string)
            .attr('stroke', 'white')
            .attr('stroke-width', 2);

        arcs.append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', 'white')
            .text(d => d.data.environment);
    };

    const renderGaugeChart = () => {
        if (!gaugeRef.current) return;

        const container = d3.select(gaugeRef.current);
        container.selectAll('*').remove();

        const totalCost = d3.sum(costs, d => d.cost);
        const threshold = 5000;
        const percentage = Math.min((totalCost / threshold) * 100, 100);

        const width = 300;
        const height = 200;
        const radius = Math.min(width, height) / 2;

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2},${height - 20})`);

        const arc = d3.arc<any>()
            .innerRadius(radius * 0.7)
            .outerRadius(radius)
            .startAngle(-Math.PI / 2)
            .endAngle(Math.PI / 2);

        const backgroundArc = d3.arc<any>()
            .innerRadius(radius * 0.7)
            .outerRadius(radius)
            .startAngle(-Math.PI / 2)
            .endAngle(Math.PI / 2);

        svg.append('path')
            .attr('d', backgroundArc as any)
            .attr('fill', '#E5E7EB');

        const valueArc = d3.arc<any>()
            .innerRadius(radius * 0.7)
            .outerRadius(radius)
            .startAngle(-Math.PI / 2)
            .endAngle(-Math.PI / 2 + (Math.PI * percentage / 100));

        svg.append('path')
            .attr('d', valueArc as any)
            .attr('fill', percentage > 80 ? '#EF4444' : percentage > 60 ? '#F59E0B' : '#10B981');

        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', -20)
            .style('font-size', '24px')
            .style('font-weight', 'bold')
            .text(`${percentage.toFixed(1)}%`);

        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', 5)
            .style('font-size', '14px')
            .style('fill', '#6B7280')
            .text(`$${totalCost.toFixed(2)} / $${threshold}`);
    };

    // Calculate anomaly
    const calculateAnomaly = () => {
        const today = new Date().toISOString().split('T')[0];
        const todayCost = d3.sum(costs.filter(c => c.date === today), d => d.cost);

        const historicalAvg = d3.mean(
            Array.from(
                d3.rollup(
                    costs.filter(c => c.date !== today),
                    v => d3.sum(v, d => d.cost),
                    d => d.date
                ).values()
            )
        ) || 0;

        const percentChange = ((todayCost - historicalAvg) / historicalAvg) * 100;

        return {
            todayCost,
            historicalAvg,
            percentChange,
            isAnomaly: Math.abs(percentChange) > 20
        };
    };

    // Prepare table data
    const getTableData = () => {
        const grouped = d3.rollup(
            costs,
            v => d3.sum(v, d => d.cost),
            d => d.provider,
            d => d.service
        );

        const tableData: any[] = [];
        grouped.forEach((services, provider) => {
            services.forEach((cost, service) => {
                const historicalCost = cost * 0.9; // Simplified
                const percentChange = ((cost - historicalCost) / historicalCost) * 100;

                tableData.push({
                    provider,
                    service,
                    totalCost: cost,
                    percentChange,
                    severity: Math.abs(percentChange) > 20 ? 'High' : Math.abs(percentChange) > 10 ? 'Medium' : 'Low'
                });
            });
        });

        return tableData.sort((a, b) => b.totalCost - a.totalCost);
    };

    if (loading) return <div className="p-8 text-center">Loading advanced dashboard...</div>;

    const anomaly = calculateAnomaly();
    const tableData = getTableData();

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Advanced Cost Analytics</h1>

            {/* Anomaly Detection Card */}
            <div className={`p-6 rounded-xl shadow-sm border ${anomaly.isAnomaly ? 'bg-red-50 border-red-200' : 'bg-white dark:bg-gray-800 border-gray-100'}`}>
                <h2 className="text-xl font-semibold mb-4">Anomaly Detection</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Today's Cost</p>
                        <p className="text-2xl font-bold">${anomaly.todayCost.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Historical Average</p>
                        <p className="text-2xl font-bold">${anomaly.historicalAvg.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Change</p>
                        <p className={`text-2xl font-bold ${anomaly.percentChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {anomaly.percentChange > 0 ? '+' : ''}{anomaly.percentChange.toFixed(1)}%
                        </p>
                    </div>
                </div>
                {anomaly.isAnomaly && (
                    <p className="mt-4 text-red-700 font-semibold">⚠️ Anomaly detected! Cost deviation exceeds 20%</p>
                )}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4">Cost by Service (Top 10)</h2>
                    <div ref={barChartRef}></div>
                </div>

                {/* Stacked Bar Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4">Multi-Cloud Spend Comparison</h2>
                    <div ref={stackedBarRef}></div>
                </div>

                {/* Forecast Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4">Spending Forecast (7 Days)</h2>
                    <div ref={forecastRef}></div>
                </div>

                {/* Heatmap */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4">Daily Cost Heatmap (Last 14 Days)</h2>
                    <div ref={heatmapRef}></div>
                </div>

                {/* Donut Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4">Cost by Environment</h2>
                    <div className="flex justify-center" ref={donutRef}></div>
                </div>

                {/* Gauge Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4">Budget Threshold Usage</h2>
                    <div className="flex justify-center" ref={gaugeRef}></div>
                </div>
            </div>

            {/* Sortable Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4">Detailed Cost Breakdown</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Change</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                            {tableData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{row.provider}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{row.service}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">${row.totalCost.toFixed(2)}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${row.percentChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {row.percentChange > 0 ? '+' : ''}{row.percentChange.toFixed(1)}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full ${row.severity === 'High' ? 'bg-red-100 text-red-800' :
                                                row.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            {row.severity}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
