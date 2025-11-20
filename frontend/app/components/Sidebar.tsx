'use client';

import { useState } from 'react';
import { Home, DollarSign, Bell, BarChart3, Cloud } from 'lucide-react';
import { FaAws } from 'react-icons/fa';
import { SiGooglecloud } from 'react-icons/si';
import Link from 'next/link';

interface SidebarProps {
    activeView: string;
    onViewChange: (view: string) => void;
    onAlertClick: () => void;
}

export default function Sidebar({ activeView, onViewChange, onAlertClick }: SidebarProps) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'aws', label: 'AWS Breakdown', icon: FaAws },
        { id: 'azure', label: 'Azure Breakdown', icon: Cloud },
        { id: 'gcp', label: 'GCP Breakdown', icon: SiGooglecloud },
        { id: 'analytics', label: 'Advanced Analytics', icon: BarChart3 },
    ];

    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col border-r border-gray-800">
            {/* Logo/Header */}
            <div className="p-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <DollarSign className="w-7 h-7 text-blue-400" />
                    <div>
                        <h1 className="text-lg font-bold">Cloud Cost</h1>
                        <p className="text-xs text-gray-400">Insight Platform</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <div className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${activeView === item.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Alert Threshold Section */}
                <div className="mt-6 pt-6 border-t border-gray-800">
                    <h3 className="text-xs font-semibold text-gray-500 mb-2 px-3">ALERTS</h3>
                    <button
                        onClick={onAlertClick}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm"
                    >
                        <Bell className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Set Alert Threshold</span>
                    </button>
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800">
                <div className="text-xs text-gray-500 text-center">
                    <p>© 2025 Cloud Cost Insight</p>
                    <p className="mt-1">v1.0.0</p>
                </div>
            </div>
        </div>
    );
}
