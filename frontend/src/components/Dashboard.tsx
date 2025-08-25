import { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import MySkillsTab from './MySkillsTab';
import SkillMatchingTab from './SkillMatchingTab';
import ApprovalsTab from './ApprovalsTab';
import { User as UserType } from '../types';

interface DashboardProps {
  user: UserType;
  onLogout: () => void;
}

type TabType = 'my-skills' | 'skill-matching' | 'approvals';

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('my-skills');
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); // to trigger refresh of MySkillsTab

  const tabs = [
    { id: 'my-skills', label: 'My Skills', component: MySkillsTab },
    ...(user.is_manager
      ? [
          { id: 'skill-matching', label: 'Skill Matching', component: SkillMatchingTab },
          { id: 'approvals', label: 'Approvals', component: ApprovalsTab },
        ]
      : []),
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || MySkillsTab;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Skill Management System</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                {user.is_manager && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    Manager
                  </span>
                )}
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success message */}
        {successMessage && (
          <p className="text-green-600 font-medium mb-4">{successMessage}</p>
        )}

        {/* Render active tab */}
        <ActiveComponent key={refreshKey} user={user} />
      </main>
    </div>
  );
}
