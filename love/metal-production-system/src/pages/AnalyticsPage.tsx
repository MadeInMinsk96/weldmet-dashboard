import React, { useState, useEffect } from 'react';
import { LogisticsTab } from '@/components/LogisticsTab';
import { ProblemsTab } from '@/components/ProblemsTab';
import { ProductionAnalysisTab } from '@/components/ProductionAnalysisTab';

const ANALYTICS_PASSWORD = '121235';
const ANALYTICS_AUTH_KEY = 'metal_production_analytics_auth';

type TabType = 'logistics' | 'problems' | 'analysis';

export function AnalyticsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('logistics');

  useEffect(() => {
    const isAuth = sessionStorage.getItem(ANALYTICS_AUTH_KEY);
    if (isAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ANALYTICS_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem(ANALYTICS_AUTH_KEY, 'true');
      setError('');
    } else {
      setError('Неверный пароль');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Доступ к аналитике</h2>
            <p className="text-gray-600">Введите пароль для продолжения</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                autoFocus
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Отчеты и аналитика</h1>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap">
            <button
              onClick={() => setActiveTab('logistics')}
              className={`px-6 py-4 font-medium transition-all duration-200 ${
                activeTab === 'logistics'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Логистика
            </button>
            <button
              onClick={() => setActiveTab('problems')}
              className={`px-6 py-4 font-medium transition-all duration-200 ${
                activeTab === 'problems'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Проблемы
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-6 py-4 font-medium transition-all duration-200 ${
                activeTab === 'analysis'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Анализ производства
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'logistics' && <LogisticsTab />}
          {activeTab === 'problems' && <ProblemsTab />}
          {activeTab === 'analysis' && <ProductionAnalysisTab />}
        </div>
      </div>
    </div>
  );
}
