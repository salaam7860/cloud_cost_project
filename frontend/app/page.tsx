import Dashboard from './components/Dashboard';
import AdvancedDashboard from './components/AdvancedDashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mb-8">
        <Dashboard />
      </div>
      <div className="border-t-4 border-gray-200 dark:border-gray-700">
        <AdvancedDashboard />
      </div>
    </main>
  );
}
