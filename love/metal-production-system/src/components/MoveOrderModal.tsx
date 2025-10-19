import React, { useState } from 'react';
import { Order } from '@/types';

interface MoveOrderModalProps {
  order: Order;
  onClose: () => void;
  onMove: (location: string) => Promise<void>;
}

const LOCATIONS = [
  'Зачистка/травление',
  'Гибка',
  'Сварка',
  'Покраска',
  'Склад №75',
  'Склад',
];

export function MoveOrderModal({ order, onClose, onMove }: MoveOrderModalProps) {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedLocation) return;

    setLoading(true);
    try {
      await onMove(selectedLocation);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Переместить заказ</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            <span className="font-medium">Заказ:</span> {order.orderNumber}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Менеджер:</span> {order.manager || 'Не указан'}
          </p>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Выберите участок:</p>
          <div className="space-y-2">
            {LOCATIONS.map((location) => (
              <button
                key={location}
                onClick={() => setSelectedLocation(location)}
                disabled={loading}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  selectedLocation === location
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {location}
              </button>
            ))}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
          >
            Отменить
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedLocation || loading}
            className="flex-1 px-4 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Перемещение...
              </span>
            ) : (
              'Переместить'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
