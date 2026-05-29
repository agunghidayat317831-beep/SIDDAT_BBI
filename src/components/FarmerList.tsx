import React, { useState } from 'react';
import { 
  Farmer, 
  KEGIATAN_USAHA,
  KECAMATAN,
  KECAMATAN_DESA,
  KLASIFIKASI_KOLAM,
  TEKNOLOGI_BUDIDAYA,
  STATUS_KEPEMILIKAN,
  STATUS_PROFESI,
  BENTUK_USAHA 
} from '../types';
import { deleteFarmer, updateFarmer } from '../services/farmerService';
import { Trash2, Edit2, X, Check, Search, Filter, Save, Loader2, MapPin } from 'lucide-react';

interface FarmerListProps {
  farmers: Farmer[];
}

export default function FarmerList({ farmers }: FarmerListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKegiatan, setSelectedKegiatan] = useState('');
  const [selectedJenisIkan, setSelectedJenisIkan] = useState('');

  // Editing state variables
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const startEdit = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setEditFormData({ ...farmer });
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarmer || !editFormData) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await updateFarmer(editingFarmer.id, editFormData);
      setEditingFarmer(null);
      setEditFormData(null);
    } catch (err: any) {
      setEditError(err.message || 'Gagal mengubah data pembudidaya');
    } finally {
      setEditLoading(false);
    }
  };

  const getEditLocation = () => {
    if (navigator.geolocation && editFormData) {
      navigator.geolocation.getCurrentPosition((position) => {
        setEditFormData((prev: any) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
      }, (err) => {
        setEditError("Gagal mendapatkan lokasi: " + err.message);
      });
    } else {
      setEditError("Geolocation tidak didukung oleh browser ini.");
    }
  };

  // Dynamically extract unique primary fish types of registered farmers
  const uniqueFishTypes = Array.from(
    new Set(
      farmers
        .map(f => f.jenisIkanUtama)
        .filter(Boolean)
        .map(fish => fish.trim())
    )
  ).sort((a, b) => a.localeCompare(b, 'id'));

  const filteredFarmers = farmers.filter(f => {
    const matchesSearch = 
      f.namaPenanggungjawab.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.kecamatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.desa.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesKegiatan = !selectedKegiatan || f.kegiatanUsaha === selectedKegiatan;
    
    const matchesJenisIkan = !selectedJenisIkan || (f.jenisIkanUtama && f.jenisIkanUtama.trim().toLowerCase() === selectedJenisIkan.toLowerCase());
    
    return matchesSearch && matchesKegiatan && matchesJenisIkan;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteFarmer(id);
      setDeletingId(null);
    } catch (error) {
      console.error('Gagal menghapus:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          Daftar Pembudidaya
        </h2>
        <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          Ditemukan {filteredFarmers.length} dari {farmers.length} pembudidaya
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama penanggungjawab, kecamatan atau desa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm text-slate-755"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <select
            value={selectedKegiatan}
            onChange={(e) => setSelectedKegiatan(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm text-slate-700 font-medium"
          >
            <option value="">Semua Kegiatan Usaha</option>
            {KEGIATAN_USAHA.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select
            value={selectedJenisIkan}
            onChange={(e) => setSelectedJenisIkan(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm text-slate-700 font-medium"
          >
            <option value="">Semua Jenis Ikan Utama</option>
            {uniqueFishTypes.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          
          {(searchTerm || selectedKegiatan || selectedJenisIkan) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedKegiatan('');
                setSelectedJenisIkan('');
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-850 rounded-xl text-xs font-bold transition-all border border-slate-200 whitespace-nowrap"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Penanggungjawab</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lokasi (Kec/Desa)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kegiatan & Komoditas</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kontak</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredFarmers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    Tidak menemukan data pembudidaya yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredFarmers.map((farmer) => (
                  <tr key={farmer.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">{farmer.namaPenanggungjawab}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-700">{farmer.kecamatan}</span>
                        <span className="text-xs text-slate-400">{farmer.desa}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-700 font-medium text-sm">{farmer.kegiatanUsaha}</span>
                        {farmer.jenisIkanUtama && (
                          <span className="text-[11px] text-blue-600 mt-1 font-semibold bg-blue-50 px-2 py-0.5 rounded-md inline-block self-start border border-blue-100/50">
                            Utama: {farmer.jenisIkanUtama}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs">
                        <a 
                          href={`mailto:${farmer.email}`} 
                          className="text-blue-600 hover:underline"
                          title="Kirim Email"
                        >
                          {farmer.email}
                        </a>
                        <a 
                          href={`https://wa.me/${farmer.telephone.replace(/\D/g, '').replace(/^0/, '62')}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-green-600 transition-colors flex items-center gap-1"
                          title="Hubungi via WhatsApp"
                        >
                          <span className="hover:underline">{farmer.telephone}</span>
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {deletingId === farmer.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(farmer.id)}
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(farmer)}
                            className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(farmer.id)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal Backdrop */}
      {editingFarmer && editFormData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden transform transition-all scale-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  Edit Data Pembudidaya
                </h3>
                <p className="text-xs text-slate-500 mt-1">Ubah atau sesuaikan profil lengkap pembudidaya.</p>
              </div>
              <button
                type="button"
                onClick={() => { setEditingFarmer(null); setEditFormData(null); }}
                className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
                {editError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{editError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Kecamatan</label>
                    <select
                      value={editFormData.kecamatan || ''}
                      onChange={(e) => {
                        setEditFormData({
                          ...editFormData,
                          kecamatan: e.target.value,
                          desa: '' // Reset desa when kecamatan changes
                        });
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    >
                      <option value="">Pilih Kecamatan</option>
                      {KECAMATAN.map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Desa/Kelurahan</label>
                    <select
                      value={editFormData.desa || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, desa: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                      disabled={!editFormData.kecamatan}
                    >
                      <option value="">Pilih Desa/Kelurahan</option>
                      {editFormData.kecamatan && KECAMATAN_DESA[editFormData.kecamatan]?.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nama Penanggungjawab</label>
                    <input
                      type="text"
                      value={editFormData.namaPenanggungjawab || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, namaPenanggungjawab: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Kegiatan Usaha</label>
                    <select
                      value={editFormData.kegiatanUsaha || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, kegiatanUsaha: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    >
                      <option value="">Pilih Kegiatan Usaha</option>
                      {KEGIATAN_USAHA.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email</label>
                    <input
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Telephone</label>
                    <input
                      type="text"
                      value={editFormData.telephone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, telephone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Klasifikasi Kolam</label>
                    <select
                      value={editFormData.klasifikasiKolam || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, klasifikasiKolam: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    >
                      <option value="">Pilih Klasifikasi Kolam</option>
                      {KLASIFIKASI_KOLAM.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Teknologi Budidaya</label>
                    <select
                      value={editFormData.teknologiBudidaya || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, teknologiBudidaya: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    >
                      <option value="">Pilih Teknologi Budidaya</option>
                      {TEKNOLOGI_BUDIDAYA.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Bentuk Usaha</label>
                    <select
                      value={editFormData.bentukUsaha || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, bentukUsaha: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    >
                      <option value="">Pilih Bentuk Usaha</option>
                      {BENTUK_USAHA.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Status Profesi</label>
                    <select
                      value={editFormData.statusProfesi || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, statusProfesi: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    >
                      <option value="">Pilih Status Profesi</option>
                      {STATUS_PROFESI.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Status Kepemilikan</label>
                    <select
                      value={editFormData.statusKepemilikan || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, statusKepemilikan: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    >
                      <option value="">Pilih Status Kepemilikan</option>
                      {STATUS_KEPEMILIKAN.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Periode Sewa</label>
                    <input
                      type="text"
                      value={editFormData.periodeSewa || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, periodeSewa: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Jenis Ikan Utama</label>
                    <input
                      type="text"
                      value={editFormData.jenisIkanUtama || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, jenisIkanUtama: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Jenis Ikan Tambahan</label>
                    <input
                      type="text"
                      value={editFormData.jenisIkanTambahan || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, jenisIkanTambahan: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Omzet (per Tahun)</label>
                    <input
                      type="number"
                      value={editFormData.omzet || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, omzet: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-3 space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Alamat</label>
                    <textarea
                      value={editFormData.alamat || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, alamat: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none min-h-[80px] text-slate-700 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={editFormData.latitude || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={editFormData.longitude || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 text-sm"
                      required
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={getEditLocation}
                      className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border border-slate-200 text-xs"
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      Ambil Lokasi Saat Ini
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => { setEditingFarmer(null); setEditFormData(null); }}
                  className="w-full sm:w-auto px-5 py-2.5 text-slate-500 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
