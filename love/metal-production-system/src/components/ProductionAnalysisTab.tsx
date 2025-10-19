import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CompletedOrdersTab } from './CompletedOrdersTab';
import { ProductionLoadTab } from './ProductionLoadTab';

type SubTab = 'settings' | 'completed' | 'load';

export function ProductionAnalysisTab() {
  const [showModal, setShowModal] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [sheetGid, setSheetGid] = useState('');
  const [currentSettings, setCurrentSettings] = useState({ url: '', gid: '' });
  const [urlError, setUrlError] = useState('');
  const [gidError, setGidError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('completed');

  useEffect(() => {
    // Load saved settings from localStorage
    const savedUrl = localStorage.getItem('sheets_url');
    const savedGid = localStorage.getItem('sheets_gid');
    
    if (savedUrl && savedGid) {
      setCurrentSettings({ url: savedUrl, gid: savedGid });
    } else {
      // Default values
      setCurrentSettings({
        url: 'https://docs.google.com/spreadsheets/d/1fOF3IU94lgNTdgaTiKPj-gcoz_cBq9pVZoaj1tGcF9U/',
        gid: '1485484311'
      });
    }
  }, []);

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('Пожалуйста, введите URL таблицы');
      return false;
    }
    
    if (!url.includes('docs.google.com/spreadsheets')) {
      setUrlError('Неверный формат URL Google Sheets');
      return false;
    }
    
    setUrlError('');
    return true;
  };

  const validateGid = (gid: string): boolean => {
    if (!gid.trim()) {
      setGidError('Пожалуйста, введите GID листа');
      return false;
    }
    
    if (!/^\d+$/.test(gid)) {
      setGidError('GID должен быть числом');
      return false;
    }
    
    setGidError('');
    return true;
  };

  const handleSave = () => {
    const isUrlValid = validateUrl(spreadsheetUrl);
    const isGidValid = validateGid(sheetGid);

    if (!isUrlValid || !isGidValid) {
      return;
    }

    // Save to localStorage
    localStorage.setItem('sheets_url', spreadsheetUrl);
    localStorage.setItem('sheets_gid', sheetGid);
    
    setCurrentSettings({ url: spreadsheetUrl, gid: sheetGid });
    setShowModal(false);
    setSpreadsheetUrl('');
    setSheetGid('');
    
    toast.success('Таблица успешно изменена!');
    
    // Reload the page to fetch new data
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleCancel = () => {
    setShowModal(false);
    setSpreadsheetUrl('');
    setSheetGid('');
    setUrlError('');
    setGidError('');
  };

  const openModal = () => {
    setSpreadsheetUrl(currentSettings.url);
    setSheetGid(currentSettings.gid);
    setShowModal(true);
  };

  return (
    <div>
      {/* Sub-tabs */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setActiveSubTab('completed')}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
            activeSubTab === 'completed'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Готовые заказы</span>
        </button>
        <button
          onClick={() => setActiveSubTab('load')}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
            activeSubTab === 'load'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Загруженность</span>
        </button>
        <button
          onClick={openModal}
          className="px-6 py-3 rounded-xl font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Настройки</span>
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'completed' && <CompletedOrdersTab />}
      {activeSubTab === 'load' && <ProductionLoadTab />}

      {/* Settings Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-slideUp transition-colors duration-300">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Настройки источника данных</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL таблицы Google Sheets
                </label>
                <input
                  type="text"
                  value={spreadsheetUrl}
                  onChange={(e) => {
                    setSpreadsheetUrl(e.target.value);
                    setUrlError('');
                  }}
                  onBlur={() => validateUrl(spreadsheetUrl)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    urlError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  } focus:ring-2 focus:border-transparent transition-all duration-200 outline-none`}
                />
                {urlError && <p className="text-red-500 text-sm mt-2">{urlError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GID листа данных
                </label>
                <input
                  type="text"
                  value={sheetGid}
                  onChange={(e) => {
                    setSheetGid(e.target.value);
                    setGidError('');
                  }}
                  onBlur={() => validateGid(sheetGid)}
                  placeholder="1485484311"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    gidError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  } focus:ring-2 focus:border-transparent transition-all duration-200 outline-none`}
                />
                {gidError && <p className="text-red-500 text-sm mt-2">{gidError}</p>}
                <p className="text-gray-500 text-xs mt-2">
                  GID - это числовой идентификатор листа в URL (например: gid=1485484311)
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Отменить
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
