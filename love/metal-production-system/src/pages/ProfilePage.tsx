import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Вы вышли из системы');
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
            <span className="text-3xl font-bold text-white">
              {user?.firstName[0]}{user?.lastName[0]}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{user?.fullName}</h1>
          <p className="text-gray-600">Сотрудник производства</p>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="space-y-4 mb-8">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Имя</span>
              <span className="font-medium text-gray-900">{user?.firstName}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Фамилия</span>
              <span className="font-medium text-gray-900">{user?.lastName}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-xl font-medium hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}
