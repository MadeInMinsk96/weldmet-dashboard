import React from 'react';
import { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  onCopy: (orderNumber: string) => void;
  onMove: (order: Order) => void;
  onReportProblem: (order: Order) => void;
}

export function OrderCard({ order, onCopy, onMove, onReportProblem }: OrderCardProps) {
  // Check if order is completed
  const isCompleted = (order.overallStatus || '').toLowerCase().trim() === 'готово';
  
  const workSteps = [
    { label: 'Лазерная резка', time: order.cuttingTime, unit: 'мин', show: order.cuttingTime > 0 },
    { label: 'Зачистка', time: order.cleaningTime, unit: 'ч', show: order.cleaningTime > 0 },
    { label: 'Гибка', time: order.bendingTime, unit: 'ч', show: order.bendingTime > 0 },
    { label: 'Сварка', time: order.weldingTime, unit: 'ч', show: order.weldingTime > 0 },
    { label: 'Покраска', time: order.paintingTime, unit: 'ч', show: order.paintingTime > 0 },
  ].filter((step) => step.show);

  return (
    <div className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 ${
      isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-100'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 mr-2">
          <h3 className="text-xl font-bold text-gray-900 break-words">
            {order.orderNumber}
          </h3>
          {isCompleted && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-green-500 text-white text-sm font-medium">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Готово
            </div>
          )}
        </div>
        <button
          onClick={() => onCopy(order.orderNumber)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex-shrink-0"
          title="Скопировать номер"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center text-gray-700">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="font-medium">Менеджер:</span>
          <span className="ml-1 truncate">{order.manager || 'Не указан'}</span>
        </div>
        <div className="flex items-center text-gray-700">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">Дата отгрузки:</span>
          <span className="ml-1">{order.shipmentDate || 'Не указана'}</span>
        </div>
      </div>

      {workSteps.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Участки работы:</p>
          <div className="space-y-1">
            {workSteps.map((step) => (
              <div key={step.label} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-700">{step.label}</span>
                <span className="font-medium text-blue-600">{step.time} {step.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={() => onMove(order)}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md"
        >
          Переместить
        </button>
        <button
          onClick={() => onReportProblem(order)}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2.5 px-4 rounded-xl font-medium hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md"
        >
          Есть нюансы!
        </button>
      </div>
    </div>
  );
}
