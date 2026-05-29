import React, { useState } from 'react';
import { PHRecord } from '../types';
import { deletePHRecord } from '../services/phService';
import { Trash2, X, Check, Search, Droplets, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface PHListProps {
  records: PHRecord[];
}

export default function PHList({ records }: PHListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = records.filter(r => 
    r.week.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Minggu</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lokasi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nilai pH</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Keterangan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    Belum ada data riwayat pH air.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
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
