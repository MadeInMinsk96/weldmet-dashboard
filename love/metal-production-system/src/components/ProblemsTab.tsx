import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ProblemEntry } from '@/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export function ProblemsTab() {
  const [entries, setEntries] = useState<ProblemEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<ProblemEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showArchive, setShowArchive] = useState(false);
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchProblems();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEntries(entries);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = entries.filter(
      (entry) =>
        entry.order_number.toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query)
    );
    setFilteredEntries(filtered);
  }, [searchQuery, entries]);

  const fetchProblems = async () => {
    try {
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .or('resolved.is.null,resolved.eq.false')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEntries(data || []);
      setFilteredEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching problems:', error);
      toast.error('Ошибка при загрузке данных проблем');
    } finally {
      setLoading(false);
    }
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

  const handleResolve = async (problemId: string) => {
    try {
      const { error } = await supabase
        .from('problems')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: `${user?.firstName} ${user?.lastName}`,
        })
        .eq('id', problemId);

      if (error) throw error;

      toast.success('Проблема отмечена как решенная');
      fetchProblems();
    } catch (error: any) {
      console.error('Error resolving problem:', error);
      toast.error('Ошибка при обновлении статуса');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => setShowArchive(false)}
          className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
            !showArchive
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Активные проблемы
        </button>
        <button
          onClick={() => setShowArchive(true)}
          className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
            showArchive
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Архив
        </button>
      </div>

      {!showArchive ? (
        <ActiveProblems
          loading={loading}
          filteredEntries={filteredEntries}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          formatDate={formatDate}
          handleResolve={handleResolve}
        />
      ) : (
        <ArchiveProblems
          searchQuery={archiveSearchQuery}
          setSearchQuery={setArchiveSearchQuery}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

function ActiveProblems({
  loading,
  filteredEntries,
  searchQuery,
  setSearchQuery,
  formatDate,
  handleResolve,
}: {
  loading: boolean;
  filteredEntries: ProblemEntry[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  formatDate: (date: string) => string;
  handleResolve: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по номеру заявки или описанию проблемы..."
            className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
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

      {filteredEntries.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto w-16 h-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-lg">Нет активных проблем</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-red-50 rounded-xl p-4 border border-red-100 hover:bg-red-100 transition-all duration-200 animate-fadeIn"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 break-words">
                    {entry.order_number}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <p>
                      <span className="font-medium">Менеджер:</span> {entry.manager || 'Не указан'}
                    </p>
                    <p>
                      <span className="font-medium">Кто сообщил:</span> {entry.reported_by}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-red-200 mb-3">
                    <p className="text-sm text-gray-700 font-medium mb-1">Описание проблемы:</p>
                    <p className="text-gray-900 whitespace-pre-wrap break-words">{entry.description}</p>
                  </div>
                  <button
                    onClick={() => handleResolve(entry.id)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-md flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Решено</span>
                  </button>
                </div>
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  {formatDate(entry.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArchiveProblems({
  searchQuery,
  setSearchQuery,
  formatDate,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  formatDate: (date: string) => string;
}) {
  const [archivedEntries, setArchivedEntries] = useState<ProblemEntry[]>([]);
  const [filteredArchive, setFilteredArchive] = useState<ProblemEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchivedProblems();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredArchive(archivedEntries);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = archivedEntries.filter(
      (entry) =>
        entry.order_number.toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query) ||
        (entry.resolved_by && entry.resolved_by.toLowerCase().includes(query))
    );
    setFilteredArchive(filtered);
  }, [searchQuery, archivedEntries]);

  const fetchArchivedProblems = async () => {
    try {
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('resolved', true)
        .order('resolved_at', { ascending: false });

      if (error) throw error;

      setArchivedEntries(data || []);
      setFilteredArchive(data || []);
    } catch (error: any) {
      console.error('Error fetching archived problems:', error);
      toast.error('Ошибка при загрузке архива');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Загрузка архива...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск в архиве..."
            className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
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

      {filteredArchive.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto w-16 h-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <p className="text-gray-600 text-lg">Архив пуст</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArchive.map((entry) => (
            <div
              key={entry.id}
              className="bg-green-50 rounded-xl p-4 border border-green-100 hover:bg-green-100 transition-all duration-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 break-words">
                      {entry.order_number}
                    </h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-200 text-green-800">
                      Решено
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <p>
                      <span className="font-medium">Менеджер:</span> {entry.manager || 'Не указан'}
                    </p>
                    <p>
                      <span className="font-medium">Кто сообщил:</span> {entry.reported_by}
                    </p>
                    <p>
                      <span className="font-medium">Решено:</span> {entry.resolved_by || 'Неизвестно'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-sm text-gray-700 font-medium mb-1">Описание проблемы:</p>
                    <p className="text-gray-900 whitespace-pre-wrap break-words">{entry.description}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  <div>Дата создания: {formatDate(entry.created_at)}</div>
                  {entry.resolved_at && <div>Дата решения: {formatDate(entry.resolved_at)}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
