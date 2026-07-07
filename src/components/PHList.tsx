import React, { useState } from 'react';
import { PHRecord } from '../types';
import { deletePHRecord } from '../services/phService';
import { getClientUserRole } from '../services/userService';
import { Trash2, X, Check, Search, Droplets, Info, MapPin, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface PHListProps {
  records: PHRecord[];
}

export default function PHList({ records }: PHListProps) {
  const isAdmin = getClientUserRole() === 'admin';
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting & Filtering states
  const [activeLocationTab, setActiveLocationTab] = useState<'all' | 'Cipule' | 'Mekarbuana'>('all');
  const [sortField, setSortField] = useState<'week' | 'location' | 'phValue'>('week');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const getWeekNumber = (weekStr: string): number => {
    const match = weekStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const handleSort = (field: 'week' | 'location' | 'phValue') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const countAll = records.length;
  const countCipule = records.filter(r => r.location === 'Cipule').length;
  const countMekarbuana = records.filter(r => r.location === 'Mekarbuana').length;

  const filteredRecordsByLocation = records.filter(r => {
    if (activeLocationTab === 'all') return true;
    return r.location === activeLocationTab;
  });

  const filteredRecords = filteredRecordsByLocation.filter(r => 
    r.week.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'week') {
      comparison = getWeekNumber(a.week) - getWeekNumber(b.week);
    } else if (sortField === 'phValue') {
      comparison = a.phValue - b.phValue;
    } else if (sortField === 'location') {
      comparison = a.location.localeCompare(b.location);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleDelete = async (id: string) => {
    try {
      await deletePHRecord(id);
      setDeletingId(null);
    } catch (error) {
      console.error('Gagal menghapus:', error);
    }
  };

  const getPHStatusDetails = (val: number) => {
    if (val < 6.5) return { label: 'Terlalu Asam', color: 'bg-red-100 text-red-700' };
    if (val > 8.5) return { label: 'Terlalu Basa', color: 'bg-purple-100 text-purple-700' };
    return { label: 'Ideal', color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Droplets className="w-6 h-6 text-blue-500" />
          Riwayat pH Air
        </h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari minggu/lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
          />
        </div>
      </div>

      {/* Tab Filter Lokasi */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-1 w-full sm:w-auto bg-slate-200/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveLocationTab('all')}
            type="button"
            className={cn(
              "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeLocationTab === 'all'
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/30"
            )}
          >
            <span>Semua Lokasi</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-extrabold",
              activeLocationTab === 'all' ? "bg-blue-50 text-blue-600" : "bg-slate-200 text-slate-500"
            )}>
              {countAll}
            </span>
          </button>
          
          <button
            onClick={() => setActiveLocationTab('Cipule')}
            type="button"
            className={cn(
              "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeLocationTab === 'Cipule'
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/30"
            )}
          >
            <MapPin className={cn("w-3.5 h-3.5", activeLocationTab === 'Cipule' ? "text-blue-500" : "text-slate-400")} />
            <span>BBI Cipule</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-extrabold",
              activeLocationTab === 'Cipule' ? "bg-blue-50 text-blue-600" : "bg-slate-200 text-slate-500"
            )}>
              {countCipule}
            </span>
          </button>

          <button
            onClick={() => setActiveLocationTab('Mekarbuana')}
            type="button"
            className={cn(
              "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeLocationTab === 'Mekarbuana'
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/30"
            )}
          >
            <MapPin className={cn("w-3.5 h-3.5", activeLocationTab === 'Mekarbuana' ? "text-blue-500" : "text-slate-400")} />
            <span>BBI Mekarbuana</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-extrabold",
              activeLocationTab === 'Mekarbuana' ? "bg-blue-50 text-blue-600" : "bg-slate-200 text-slate-500"
            )}>
              {countMekarbuana}
            </span>
          </button>
        </div>

        {/* Short Summary Info */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 px-2">
          <span>Menampilkan <strong className="text-blue-600 font-extrabold">{sortedRecords.length}</strong> dari <strong className="text-slate-700">{records.length}</strong> data</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th 
                  onClick={() => handleSort('week')}
                  className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors select-none group"
                >
                  <div className="flex items-center gap-1">
                    Minggu
                    {sortField === 'week' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-600 font-bold" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-600 font-bold" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('location')}
                  className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors select-none group"
                >
                  <div className="flex items-center gap-1">
                    Lokasi
                    {sortField === 'location' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-600 font-bold" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-600 font-bold" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('phValue')}
                  className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors select-none group"
                >
                  <div className="flex items-center gap-1">
                    Nilai pH
                    {sortField === 'phValue' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-600 font-bold" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-600 font-bold" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Keterangan</th>
                {isAdmin && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-slate-400 italic">
                    Belum ada data riwayat pH air.
                  </td>
                </tr>
              ) : (
                sortedRecords.map((record) => {
                  const status = getPHStatusDetails(record.phValue);
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700">{record.week}</td>
                      <td className="px-6 py-4 text-slate-600">{record.location}</td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-slate-800">{record.phValue.toFixed(1)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", status.color)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm italic">
                        {record.notes ? (
                          <div className="flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            <span>{record.notes}</span>
                          </div>
                        ) : '-'}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4">
                          {deletingId === record.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDelete(record.id)}
                                className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(record.id)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
