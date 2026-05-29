import React, { useState } from 'react';
import { addTpi } from '../services/tpiService';
import { Save, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { KECAMATAN, KECAMATAN_DESA } from '../types';

export default function TpiForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    namaTpi: '',
    kecamatan: '',
    desa: '',
    alamat: '',
    latitude: -6.301873,
    longitude: 107.304801,
    keterangan: ''
  });

  const handleKecamatanChange = (kecamatan: string) => {
    setFormData({
      ...formData,
      kecamatan,
      desa: '' // Reset desa when kecamatan changes
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await addTpi({
        ...formData,
        createdAt: Date.now()
      });

      setSuccess(true);
      setFormData({
        namaTpi: '',
        kecamatan: '',
        desa: '',
        alamat: '',
        latitude: -6.301873,
        longitude: 107.304801,
        keterangan: ''
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data TPI');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
      }, (err) => {
        setError("Gagal mendapatkan lokasi: " + err.message);
      });
    } else {
      setError("Geolocation tidak didukung oleh browser ini.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800">Input Lokasi TPI</h2>
        <p className="text-sm text-slate-500 mt-1">Daftarkan lokasi Tempat Pelelangan Ikan (TPI) baru.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-700">
            <Save className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">Data TPI berhasil disimpan!</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup label="Nama TPI" value={formData.namaTpi} onChange={v => setFormData({...formData, namaTpi: v})} />
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Kecamatan</label>
            <select
              value={formData.kecamatan}
              onChange={(e) => handleKecamatanChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
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
              value={formData.desa}
              onChange={(e) => setFormData({ ...formData, desa: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              required
              disabled={!formData.kecamatan}
            >
              <option value="">Pilih Desa/Kelurahan</option>
              {formData.kecamatan && KECAMATAN_DESA[formData.kecamatan]?.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-slate-700">Alamat</label>
            <textarea
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none min-h-[80px]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Latitude</label>
            <input
              type="number"
              step="any"
              value={formData.latitude || ''}
              onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Longitude</label>
            <input
              type="number"
              step="any"
              value={formData.longitude || ''}
              onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              required
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-slate-700">Keterangan (Opsional)</label>
            <textarea
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none min-h-[60px]"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="button"
              onClick={getCurrentLocation}
              className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border border-slate-200"
            >
              <MapPin className="w-4 h-4" />
              Ambil Lokasi Saat Ini
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Simpan Data TPI
          </button>
        </div>
      </form>
    </div>
  );
}

function InputGroup({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (v: string) => void, type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
        required
      />
    </div>
  );
}
