import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { OrderCard } from '@/components/OrderCard';
import { MoveOrderModal } from '@/components/MoveOrderModal';
import { ReportProblemModal } from '@/components/ReportProblemModal';

type TabType = 'active' | 'completed';

export function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

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
        const newOrders = data.data;
        
        // Check for truly new orders
        if (silent) {
          const lastSeenOrdersStr = localStorage.getItem('last_seen_orders');
          const lastSeenOrders = lastSeenOrdersStr ? JSON.parse(lastSeenOrdersStr) : [];
          
          const newOrderNumbers = newOrders
            .map((o: Order) => o.orderNumber)
            .filter((num: string) => !lastSeenOrders.includes(num));
          
          if (newOrderNumbers.length > 0) {
            toast.success(`Обнаружено ${newOrderNumbers.length} новых заказов`);
          }
        }
        
        // Update last seen orders
        const currentOrderNumbers = newOrders.map((o: Order) => o.orderNumber);
        localStorage.setItem('last_seen_orders', JSON.stringify(currentOrderNumbers));
        
        setOrders(newOrders);
        setLastUpdate(new Date());
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

  useEffect(() => {
    fetchOrders();
    
    // Auto-refresh every 20 seconds with silent mode
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 20000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let ordersToFilter = orders;
    
    // Filter by tab
    if (activeTab === 'active') {
      ordersToFilter = orders.filter(o => (o.overallStatus || '').toLowerCase().trim() !== 'готово');
    } else {
      ordersToFilter = orders.filter(o => (o.overallStatus || '').toLowerCase().trim() === 'готово');
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      ordersToFilter = ordersToFilter.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(query) ||
          order.manager.toLowerCase().includes(query)
      );
    }
    
    setFilteredOrders(ordersToFilter);
  }, [searchQuery, orders, activeTab]);
  
  // Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && activeTab === 'active') {
        // Swipe left - go to completed
        setActiveTab('completed');
      } else if (diff < 0 && activeTab === 'completed') {
        // Swipe right - go to active
        setActiveTab('active');
      }
    }
  };

  const handleCopyOrderNumber = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    toast.success('Номер скопирован в буфер обмена');
  };

  const handleMoveOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowMoveModal(true);
  };

  const handleReportProblem = (order: Order) => {
    setSelectedOrder(order);
    setShowProblemModal(true);
  };

  const handleMoveSuccess = async (location: string) => {
    if (!selectedOrder || !user) return;

    try {
      const { error } = await supabase
        .from('logistics')
        .insert({
          order_number: selectedOrder.orderNumber,
          manager: selectedOrder.manager,
          moved_to: location,
          moved_by: user.fullName,
        });

      if (error) throw error;

      toast.success('Заказ успешно перемещен');
      setShowMoveModal(false);
      setSelectedOrder(null);
    } catch (error: any) {
      console.error('Error moving order:', error);
      toast.error('Ошибка при перемещении заказа');
    }
  };

  const handleProblemSuccess = async (description: string) => {
    if (!selectedOrder || !user) return;

    try {
      const { error } = await supabase
        .from('problems')
        .insert({
          order_number: selectedOrder.orderNumber,
          manager: selectedOrder.manager,
          description,
          reported_by: user.fullName,
        });

      if (error) throw error;

      toast.success('Проблема отправлена');
      setShowProblemModal(false);
      setSelectedOrder(null);
    } catch (error: any) {
      console.error('Error reporting problem:', error);
      toast.error('Ошибка при отправке проблемы');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Заказы</h1>
          <div className="flex items-center space-x-3">
            {/* Manual refresh button */}
            <button
              onClick={() => fetchOrders()}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="flex items-center space-x-2">
              {isSyncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Синхронизация...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Обновлено: {lastUpdate.toLocaleTimeString('ru-RU')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Активные заказы
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'completed'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Готовые заказы
          </button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по номеру заявки или менеджеру..."
            className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto w-16 h-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Заказы не найдены</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.orderNumber}
              order={order}
              onCopy={handleCopyOrderNumber}
              onMove={handleMoveOrder}
              onReportProblem={handleReportProblem}
            />
          ))}
        </div>
      )}

      {showMoveModal && selectedOrder && (
        <MoveOrderModal
          order={selectedOrder}
          onClose={() => {
            setShowMoveModal(false);
            setSelectedOrder(null);
          }}
          onMove={handleMoveSuccess}
        />
      )}

      {showProblemModal && selectedOrder && (
        <ReportProblemModal
          order={selectedOrder}
          onClose={() => {
            setShowProblemModal(false);
            setSelectedOrder(null);
          }}
          onReport={handleProblemSuccess}
        />
      )}
    </div>
  );
}
