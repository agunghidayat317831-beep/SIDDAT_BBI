import React, { useState } from 'react';
import { Tpi, KECAMATAN } from '../types';
import { deleteTpi, updateTpi } from '../services/tpiService';
import { getClientUserRole } from '../services/userService';
import { Trash2, X, Check, Search, MapPin, Info, Edit2, Save, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface TpiListProps {
  tpiList: Tpi[];
}

export default function TpiList({ tpiList }: TpiListProps) {
  const isAdmin = getClientUserRole() === 'admin';
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTpi, setEditingTpi] = useState<Tpi | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const filteredTpi = tpiList.filter(t => 
    t.namaTpi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.kecamatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.desa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteTpi(id);
      setDeletingId(null);
    } catch (error) {
      console.error('Gagal menghapus:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTpi) return;
    
    setUpdateLoading(true);
    try {
      const { id, ...data } = editingTpi;
      await updateTpi(id, data);
      setEditingTpi(null);
    } catch (error) {
      console.error('Gagal memperbarui:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800">Daftar Lokasi TPI</h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari TPI..."
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama TPI</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lokasi (Kec/Desa)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Alamat</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Keterangan</th>
                {isAdmin && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTpi.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-400 italic">
                    Belum ada data TPI.
                  </td>
                </tr>
              ) : (
                filteredTpi.map((tpi) => (
                  <tr key={tpi.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">{tpi.namaTpi}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-700">{tpi.kecamatan}</span>
                        <span className="text-xs text-slate-400">{tpi.desa}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-600 text-sm max-w-xs truncate" title={tpi.alamat}>
                        {tpi.alamat}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {tpi.keterangan ? (
                        <div className="flex items-center gap-1 text-slate-500 text-xs italic">
                          <Info className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{tpi.keterangan}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {deletingId === tpi.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDelete(tpi.id)}
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
                            <>
                              <button
                                onClick={() => setEditingTpi(tpi)}
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingId(tpi.id)}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTpi && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">Edit Data TPI</h3>
              <button 
                onClick={() => setEditingTpi(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nama TPI</label>
                  <input
                    type="text"
                    value={editingTpi.namaTpi}
                    onChange={(e) => setEditingTpi({ ...editingTpi, namaTpi: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Kecamatan</label>
                  <select
                    value={editingTpi.kecamatan}
                    onChange={(e) => setEditingTpi({ ...editingTpi, kecamatan: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    required
                  >
                    <option value="">Pilih Kecamatan</option>
                    {KECAMATAN.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Desa</label>
                  <input
                    type="text"
                    value={editingTpi.desa}
                    onChange={(e) => setEditingTpi({ ...editingTpi, desa: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Alamat</label>
                  <textarea
                    value={editingTpi.alamat}
                    onChange={(e) => setEditingTpi({ ...editingTpi, alamat: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none min-h-[80px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editingTpi.latitude}
                    onChange={(e) => setEditingTpi({ ...editingTpi, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editingTpi.longitude}
                    onChange={(e) => setEditingTpi({ ...editingTpi, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Keterangan</label>
                  <textarea
                    value={editingTpi.keterangan}
                    onChange={(e) => setEditingTpi({ ...editingTpi, keterangan: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none min-h-[60px]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingTpi(null)}
                  className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  {updateLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
