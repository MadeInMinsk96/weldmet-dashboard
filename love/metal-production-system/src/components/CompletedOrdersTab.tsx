// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CompletedOrder } from '@/types';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type QuickFilter = 'today' | 'week' | 'month' | 'custom';

export function CompletedOrdersTab() {
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<CompletedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('week');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [quickFilter, selectedDate, orders]);

  const fetchCompletedOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('completed_orders')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching completed orders:', error);
      toast.error('Ошибка при загрузке завершенных заказов');
    } finally {
      setLoading(false);
    }
  };

  const syncCompletedOrders = async () => {
    try {
      setSyncing(true);
      toast.loading('Синхронизация завершенных заказов...');

      // Get spreadsheet settings from localStorage
      const savedUrl = localStorage.getItem('sheets_url');
      const savedGid = localStorage.getItem('sheets_gid');
      
      let spreadsheetId = '1fOF3IU94lgNTdgaTiKPj-gcoz_cBq9pVZoaj1tGcF9U';
      let sheetGid = '1485484311';
      
      if (savedUrl && savedGid) {
        const urlMatch = savedUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (urlMatch) {
          spreadsheetId = urlMatch[1];
        }
        sheetGid = savedGid;
      }

      const { data, error } = await supabase.functions.invoke('sync-completed-orders', {
        body: { spreadsheetId, sheetGid }
      });

      if (error) throw error;

      toast.dismiss();
      
      if (data?.saved > 0) {
        toast.success(`Сохранено ${data.saved} новых заказов`);
        // Reload the list
        await fetchCompletedOrders();
      } else {
        toast.success('Новых завершенных заказов не найдено');
      }
    } catch (error: any) {
      console.error('Error syncing completed orders:', error);
      toast.dismiss();
      toast.error('Ошибка при синхронизации');
    } finally {
      setSyncing(false);
    }
  };

  const clearCompletedOrders = async () => {
    try {
      toast.loading('Очистка готовых заказов...');

      const { error } = await supabase
        .from('completed_orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      toast.dismiss();
      toast.success('Все готовые заказы успешно удалены');
      setShowClearConfirm(false);
      await fetchCompletedOrders();
    } catch (error: any) {
      console.error('Error clearing completed orders:', error);
      toast.dismiss();
      toast.error('Ошибка при очистке данных');
    }
  };

  const applyFilter = () => {
    const now = new Date();
    let filtered = orders;

    if (quickFilter === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      filtered = orders.filter(order => {
        const orderDate = new Date(order.completed_at);
        return orderDate >= startOfDay && orderDate <= endOfDay;
      });
    } else if (quickFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = orders.filter(order => new Date(order.completed_at) >= weekAgo);
    } else if (quickFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = orders.filter(order => new Date(order.completed_at) >= monthAgo);
    } else if (quickFilter === 'custom' && selectedDate) {
      // Filter by exact date
      const targetDate = new Date(selectedDate);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
      
      filtered = orders.filter(order => {
        const orderDate = new Date(order.completed_at);
        return orderDate >= startOfDay && orderDate <= endOfDay;
      });
    }

    setFilteredOrders(filtered);
  };

  const handleQuickFilter = (filter: QuickFilter) => {
    setQuickFilter(filter);
    if (filter !== 'custom') {
      setSelectedDate('');
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setQuickFilter('custom');
  };

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} мин`;
    }
    return `${hours.toFixed(1)} ч`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Prepare chart data - orders by day
  const getOrdersByDayData = () => {
    if (filteredOrders.length === 0) return [];

    const ordersByDay: { [key: string]: number } = {};

    filteredOrders.forEach(order => {
      const date = new Date(order.completed_at);
      const dateKey = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      ordersByDay[dateKey] = (ordersByDay[dateKey] || 0) + 1;
    });

    return Object.entries(ordersByDay)
      .map(([date, count]) => ({
        дата: date,
        заказов: count,
      }))
      .sort((a, b) => {
        const [dayA, monthA] = a.дата.split('.');
        const [dayB, monthB] = b.дата.split('.');
        return new Date(2025, parseInt(monthA) - 1, parseInt(dayA)).getTime() - 
               new Date(2025, parseInt(monthB) - 1, parseInt(dayB)).getTime();
      });
  };

  // Prepare chart data - time distribution
  const getTimeDistributionData = () => {
    if (filteredOrders.length === 0) return [];

    const totals = {
      'Резка': 0,
      'Зачистка': 0,
      'Гибка': 0,
      'Сварка': 0,
      'Покраска': 0,
    };

    filteredOrders.forEach(order => {
      totals['Резка'] += order.laser_time || 0;
      totals['Зачистка'] += order.cleaning_time || 0;
      totals['Гибка'] += order.bending_time || 0;
      totals['Сварка'] += order.welding_time || 0;
      totals['Покраска'] += order.painting_time || 0;
    });

    return Object.entries(totals)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        время: parseFloat(value.toFixed(2)),
      }));
  };

  const ordersByDayData = getOrdersByDayData();
  const timeDistributionData = getTimeDistributionData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-300">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">📅 Фильтры</h3>
          <div className="flex space-x-2">
            <button
              onClick={syncCompletedOrders}
              disabled={syncing}
              className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{syncing ? 'Синхронизация...' : 'Синхронизировать'}</span>
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Очистить</span>
            </button>
          </div>
        </div>
        
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => handleQuickFilter('today')}
            className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
              quickFilter === 'today'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Сегодня
          </button>
          <button
            onClick={() => handleQuickFilter('week')}
            className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
              quickFilter === 'week'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Последние 7 дней
          </button>
          <button
            onClick={() => handleQuickFilter('month')}
            className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
              quickFilter === 'month'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Последние 30 дней
          </button>
        </div>

        {/* Calendar */}
        <div className="flex items-center gap-3">
          <label htmlFor="date-picker" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Выбрать дату:
          </label>
          <input
            type="date"
            id="date-picker"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
          />
          {selectedDate && (
            <button
              onClick={() => {
                setSelectedDate('');
                setQuickFilter('week');
              }}
              className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
            >
              Очистить
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">Завершено заказов</div>
          <div className="text-4xl font-bold">{filteredOrders.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">Общее время</div>
          <div className="text-4xl font-bold">
            {filteredOrders.reduce((sum, order) => sum + (order.total_time || 0), 0).toFixed(1)} ч
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">Среднее время</div>
          <div className="text-4xl font-bold">
            {filteredOrders.length > 0
              ? (filteredOrders.reduce((sum, order) => sum + (order.total_time || 0), 0) / filteredOrders.length).toFixed(1)
              : '0'} ч
          </div>
        </div>
      </div>

      {/* Charts */}
      {ordersByDayData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📊 Выполненные заказы по дням</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersByDayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="дата" />
              <YAxis allowDecimals={false} label={{ value: 'Количество', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="заказов" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {timeDistributionData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">⏱️ Распределение времени по участкам</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeDistributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Часы', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="время" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">📋 Список завершенных заказов</h3>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-colors duration-300">
            <svg
              className="mx-auto w-16 h-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Нет завершенных заказов за выбранный период</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredOrders.map((order, index) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500 animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">{order.order_number}</h4>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    Завершено
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <p>
                    <span className="font-medium">Менеджер:</span> {order.manager || 'Не указан'}
                  </p>
                  <p>
                    <span className="font-medium">Дата завершения:</span> {formatDate(order.completed_at)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Время по участкам:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                    {order.laser_time > 0 && (
                      <div>• Резка: {formatTime(order.laser_time)}</div>
                    )}
                    {order.cleaning_time > 0 && (
                      <div>• Зачистка: {formatTime(order.cleaning_time)}</div>
                    )}
                    {order.bending_time > 0 && (
                      <div>• Гибка: {formatTime(order.bending_time)}</div>
                    )}
                    {order.welding_time > 0 && (
                      <div>• Сварка: {formatTime(order.welding_time)}</div>
                    )}
                    {order.painting_time > 0 && (
                      <div>• Покраска: {formatTime(order.painting_time)}</div>
                    )}
                    {order.warehouse75_time > 0 && (
                      <div>• Склад №75: {formatTime(order.warehouse75_time)}</div>
                    )}
                    {order.warehouse_time > 0 && (
                      <div>• Склад: {formatTime(order.warehouse_time)}</div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      Общее время: {formatTime(order.total_time)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-slideUp transition-colors duration-300">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Подтвердите удаление</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Вы уверены, что хотите удалить все готовые заказы? Это действие нельзя отменить.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Отменить
                </button>
                <button
                  onClick={clearCompletedOrders}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-medium hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
