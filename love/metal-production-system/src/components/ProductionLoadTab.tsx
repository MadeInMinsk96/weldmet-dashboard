// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Order } from '@/types';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface WorkloadData {
  station: string;
  minutes?: number;
  hours: number;
  days: number;
  color: string;
  displayText: string;
}

export function ProductionLoadTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [workload, setWorkload] = useState<WorkloadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 20 seconds
    const interval = setInterval(() => {
      fetchOrders(true); // Silent refresh
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Memoized workload calculation
  const workload = useMemo(() => {
    if (orders.length === 0) return [];
    
    // Filter active orders
    const activeOrders = orders.filter(order => {
      const status = (order.overallStatus || '').toLowerCase().trim();
      return status !== 'готово';
    });

    // Stations configuration
    const stations = [
      { 
        key: 'cutting', 
        label: 'Лазерная резка', 
        timeField: 'cuttingTime', 
        statusField: 'cuttingStatus',
        isMinutes: true
      },
      { 
        key: 'cleaning', 
        label: 'Зачистка/травление', 
        timeField: 'cleaningTime', 
        statusField: 'cleaningStatus',
        isMinutes: false
      },
      { 
        key: 'bending', 
        label: 'Гибка', 
        timeField: 'bendingTime', 
        statusField: 'bendingStatus',
        isMinutes: false
      },
      { 
        key: 'welding', 
        label: 'Сварка', 
        timeField: 'weldingTime', 
        statusField: 'weldingStatus',
        isMinutes: false
      },
      { 
        key: 'painting', 
        label: 'Покраска', 
        timeField: 'paintingTime', 
        statusField: 'paintingStatus',
        isMinutes: false
      },
      { 
        key: 'warehouse75', 
        label: 'Склад №75', 
        timeField: 'warehouse75Time', 
        statusField: 'warehouse75Status',
        isMinutes: false
      },
      { 
        key: 'warehouse', 
        label: 'Склад', 
        timeField: 'warehouseTime', 
        statusField: 'warehouseStatus',
        isMinutes: false
      },
    ];

    const workloadData: WorkloadData[] = stations.map(station => {
      let totalTime = 0;
      
      activeOrders.forEach(order => {
        const time = order[station.timeField as keyof Order] as number || 0;
        const stationStatus = (order[station.statusField as keyof Order] as string || '').toLowerCase().trim();
        
        if (time > 0 && stationStatus !== 'готово') {
          if (station.isMinutes) {
            totalTime += time / 60;
          } else {
            totalTime += time;
          }
        }
      });

      const days = totalTime / 24;
      const color = getColorForDays(days);
      const displayText = formatTime(totalTime, days, station.isMinutes);

      return {
        station: station.label,
        hours: parseFloat(totalTime.toFixed(2)),
        days: parseFloat(days.toFixed(1)),
        color,
        displayText,
        ...(station.isMinutes && { minutes: Math.round(totalTime * 60) })
      };
    });

    return workloadData;
  }, [orders]);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setIsSyncing(true);
      }

      // Load data from Google Sheets (primary source)
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
      
      const { data, error } = await supabase.functions.invoke('get-orders', {
        body: { spreadsheetId, sheetGid }
      });
      
      if (error) throw error;
      
      if (data?.data) {
        setOrders(data.data);
        setLastUpdate(new Date());
        
        // Show success toast only on manual refresh
        if (silent && data.data.length > orders.length) {
          toast.success(`Обнаружено ${data.data.length - orders.length} новых заказов`);
        }
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      if (!silent) {
        toast.error('Ошибка при загрузке заказов');
      }
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };



  const formatTime = (hours: number, days: number, isMinutes: boolean): string => {
    const fullDays = Math.floor(days);
    const remainingHours = Math.round((days - fullDays) * 24);
    
    if (isMinutes) {
      const minutes = Math.round(hours * 60);
      if (days < 1) {
        // Less than 1 day
        return `${minutes} мин / ${hours.toFixed(1)} ч`;
      } else {
        // 1 day or more
        if (remainingHours > 0) {
          return `${minutes} мин / ${hours.toFixed(0)} ч (${fullDays} дн ${remainingHours} ч)`;
        }
        return `${minutes} мин / ${hours.toFixed(0)} ч (${fullDays} дн)`;
      }
    } else {
      if (days < 1) {
        // Less than 1 day
        return `${hours.toFixed(1)} ч`;
      } else {
        // 1 day or more
        if (remainingHours > 0) {
          return `${hours.toFixed(0)} ч (${fullDays} дн ${remainingHours} ч)`;
        }
        return `${hours.toFixed(0)} ч (${fullDays} дн)`;
      }
    }
  };

  const getColorForDays = (days: number): string => {
    if (days < 3) return '#10b981'; // green
    if (days <= 7) return '#f59e0b'; // yellow/orange
    return '#ef4444'; // red
  };

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
      {/* Header with sync status */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">📊 Загруженность производства</h2>
            <p className="text-sm opacity-90">Актуальное состояние на текущий момент (обновляется автоматически)</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Manual refresh button */}
            <button
              onClick={() => fetchOrders()}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              <svg
                className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Обновить</span>
            </button>
            {/* Sync status */}
            <div className="flex flex-col items-end">
              {isSyncing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Синхронизация...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Синхронизировано</span>
                </div>
              )}
              <span className="text-xs opacity-75 mt-1">
                {lastUpdate.toLocaleTimeString('ru-RU')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg transition-colors duration-300">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Индикация загруженности:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">&lt; 3 дней</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span className="text-gray-600 dark:text-gray-400">3-7 дней</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">&gt; 7 дней</span>
          </div>
        </div>
      </div>

      {/* Workload Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Загруженность производства (дни)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={workload} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis type="number" label={{ value: 'Дни', position: 'insideBottom', offset: -5 }} />
            <YAxis type="category" dataKey="station" width={180} />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="days" radius={[0, 8, 8, 0]}>
              {workload.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Workload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workload.map((item, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-l-4 hover:shadow-xl transition-all duration-200"
            style={{ borderLeftColor: item.color }}
          >
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{item.station}</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Загрузка:</span>
                <span className="text-lg font-bold dark:text-white" style={{ color: item.color }}>
                  {item.displayText}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Дней:</span>
                <span className="text-2xl font-bold dark:text-white" style={{ color: item.color }}>
                  {item.days.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (item.days / 10) * 100)}%`,
                    backgroundColor: item.color,
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
