import React, { useState, useEffect, useRef } from 'react';
import { 
  LogisticsEntry, 
  LOCATIONS, 
  COMMODITIES, 
  SIZES, 
  TYPES, 
  WEEKS, 
  BBILocation, 
  FishCommodity, 
  SizeCategory, 
  FlowType,
  Farmer
} from '../types';
import { deleteLogisticsEntry, updateLogisticsEntry } from '../services/logisticsService';
import { subscribeToFarmers } from '../services/farmerService';
import { getClientUserRole } from '../services/userService';
import { Download, Trash2, AlertTriangle, X, Check, Edit2, Loader2, Save, Upload, ClipboardList, Search, User, MapPin, ArrowUpDown, ChevronUp, ChevronDown, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';

// Helper function to get week of year from local date
const getWeekOfYear = (dateString: string): string => {
  if (!dateString) return "Minggu ke 1";
  const parts = dateString.split('-');
  if (parts.length !== 3) return "Minggu ke 1";
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);
  
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return "Minggu ke 1";
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
  const clampedWeek = Math.min(Math.max(week, 1), 52);
  return `Minggu ke ${clampedWeek}`;
};

interface HistoryTableProps {
  entries: LogisticsEntry[];
}

export default function HistoryTable({ entries }: HistoryTableProps) {
  const isAdmin = getClientUserRole() === 'admin';
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<LogisticsEntry | null>(null);
  const [editFormData, setEditFormData] = useState<Omit<LogisticsEntry, 'id' | 'userId' | 'createdAt'> | null>(null);
  const [editInputDate, setEditInputDate] = useState<string>('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Sync edited week when editInputDate changes
  useEffect(() => {
    if (editInputDate) {
      const computedWeek = getWeekOfYear(editInputDate);
      setEditFormData(prev => prev ? { ...prev, month: computedWeek } : null);
    }
  }, [editInputDate]);

  // Image zoom/lightbox state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Edit image states
  const [isCompressingEdit, setIsCompressingEdit] = useState(false);
  const [editImageError, setEditImageError] = useState<string | null>(null);

  // Sorting states
  const [sortField, setSortField] = useState<'month' | 'location' | 'commodity' | 'type' | 'quantity'>('month');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Helper to parse week number from week string e.g. "Minggu ke 12" -> 12
  const getWeekNumber = (weekStr: string): number => {
    const match = weekStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const handleSort = (field: 'month' | 'location' | 'commodity' | 'type' | 'quantity') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedEntries = [...entries].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'month') {
      comparison = getWeekNumber(a.month) - getWeekNumber(b.month);
    } else if (sortField === 'quantity') {
      comparison = a.quantity - b.quantity;
    } else if (sortField === 'location') {
      comparison = a.location.localeCompare(b.location);
    } else if (sortField === 'commodity') {
      comparison = a.commodity.localeCompare(b.commodity);
    } else if (sortField === 'type') {
      comparison = a.type.localeCompare(b.type);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // State for farmer list and edit selection
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [editSelectedFarmer, setEditSelectedFarmer] = useState<Farmer | null>(null);
  const [showEditDropdown, setShowEditDropdown] = useState(false);
  const editDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToFarmers((data) => {
      setFarmers(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target as Node)) {
        setShowEditDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredFarmers = editSearchQuery.trim() === ''
    ? farmers
    : farmers.filter(f => 
        (f.namaPenanggungjawab || '').toLowerCase().includes(editSearchQuery.toLowerCase()) ||
        (f.kecamatan || '').toLowerCase().includes(editSearchQuery.toLowerCase()) ||
        (f.desa || '').toLowerCase().includes(editSearchQuery.toLowerCase()) ||
        (f.alamat || '').toLowerCase().includes(editSearchQuery.toLowerCase())
      );

  const startEdit = (entry: LogisticsEntry) => {
    setEditingEntry(entry);
    const entryDate = new Date(entry.createdAt);
    const yyyy = entryDate.getFullYear();
    const mm = String(entryDate.getMonth() + 1).padStart(2, '0');
    const dd = String(entryDate.getDate()).padStart(2, '0');
    setEditInputDate(`${yyyy}-${mm}-${dd}`);
    setEditFormData({
      location: entry.location,
      commodity: entry.commodity,
      size: entry.size,
      type: entry.type,
      flow: entry.flow,
      month: entry.month,
      quantity: entry.quantity,
      unit: entry.unit,
      padReceiptImage: entry.padReceiptImage || undefined,
      farmerId: entry.farmerId || undefined,
      farmerName: entry.farmerName || undefined,
      farmerLocation: entry.farmerLocation || undefined,
    });
    setEditSearchQuery(entry.farmerName || '');
    if (entry.farmerId) {
      const found = farmers.find(f => f.id === entry.farmerId);
      if (found) {
        setEditSelectedFarmer(found);
      } else if (entry.farmerName) {
        setEditSelectedFarmer({
          id: entry.farmerId,
          namaPenanggungjawab: entry.farmerName,
          desa: entry.farmerLocation?.split(', ')[0] || '',
          kecamatan: entry.farmerLocation?.split(', ')[1] || '',
          userId: entry.userId,
          createdAt: Date.now()
        } as any);
      }
    } else {
      setEditSelectedFarmer(null);
    }
    setEditError(null);
    setEditImageError(null);
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      if (file.size > 2 * 1024 * 1024) {
        setEditImageError('Ukuran file PDF tidak boleh lebih dari 2MB.');
        return;
      }
      setEditImageError(null);
      setIsCompressingEdit(true);
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result && editFormData) {
          setEditFormData({ ...editFormData, padReceiptImage: evt.target.result as string });
        }
        setIsCompressingEdit(false);
      };
      reader.onerror = () => {
        setEditImageError('Gagal membaca file PDF');
        setIsCompressingEdit(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setEditImageError('File harus berupa gambar (.jpg, .jpeg, .png) atau PDF');
      return;
    }

    setEditImageError(null);
    setIsCompressingEdit(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          if (editFormData) {
            setEditFormData({ ...editFormData, padReceiptImage: compressedBase64 });
          }
        }
        setIsCompressingEdit(false);
      };
      img.onerror = () => {
        setEditImageError('Gagal memproses gambar');
        setIsCompressingEdit(false);
      };
      if (evt.target?.result) {
        img.src = evt.target.result as string;
      }
    };
    reader.onerror = () => {
      setEditImageError('Gagal membaca file');
      setIsCompressingEdit(false);
    };
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry || !editFormData) return;
    setEditLoading(true);
    setEditError(null);

    try {
      const selectedType = TYPES.find(t => t.name === editFormData.type);
      if (!selectedType) throw new Error('Format tipe tidak valid');

      if (editFormData.type === 'Hibah' && !editSelectedFarmer) {
        throw new Error('Harus memilih pembudidaya untuk penyaluran bantuan Hibah.');
      }

      await updateLogisticsEntry(editingEntry.id, {
        ...editFormData,
        flow: selectedType.flow as FlowType,
        createdAt: (() => {
          const parts = editInputDate.split('-');
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const originalTime = new Date(editingEntry.createdAt);
          return new Date(year, month, day, originalTime.getHours(), originalTime.getMinutes(), originalTime.getSeconds(), originalTime.getMilliseconds()).getTime();
        })(),
        padReceiptImage: (editFormData.type === 'Penjualan' || editFormData.type === 'Hibah') ? editFormData.padReceiptImage : undefined,
        ...(editFormData.type === 'Hibah' && editSelectedFarmer ? {
          farmerId: editSelectedFarmer.id,
          farmerName: editSelectedFarmer.namaPenanggungjawab,
          farmerLocation: `${editSelectedFarmer.desa}, ${editSelectedFarmer.kecamatan}`
        } : {
          farmerId: undefined,
          farmerName: undefined,
          farmerLocation: undefined
        })
      });

      setEditingEntry(null);
      setEditFormData(null);
      setEditSelectedFarmer(null);
      setEditSearchQuery('');
    } catch (err: any) {
      setEditError(err.message || 'Gagal mengubah data');
    } finally {
      setEditLoading(false);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(sortedEntries.map(e => ({
      'Tanggal Input': new Date(e.createdAt).toLocaleDateString('id-ID'),
      'Lokasi': e.location,
      'Komoditas': e.commodity,
      'Ukuran': e.size,
      'Tipe': e.type,
      'Arus': e.flow,
      'Minggu': e.month,
      'Jumlah': e.quantity,
      'Satuan': e.unit
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logistik Ikan");
    XLSX.writeFile(workbook, `Logistik_Ikan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLogisticsEntry(id);
      setDeletingId(null);
    } catch (error) {
      console.error('Gagal menghapus:', error);
      alert('Gagal menghapus data. Silakan coba lagi.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Riwayat Logistik</h2>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all shadow-md shadow-green-100"
        >
          <Download className="w-4 h-4" />
          Ekspor Excel
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
             <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th 
                  onClick={() => handleSort('month')}
                  className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors select-none group"
                >
                  <div className="flex items-center gap-1">
                    Minggu
                    {sortField === 'month' ? (
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
                  onClick={() => handleSort('commodity')}
                  className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors select-none group"
                >
                  <div className="flex items-center gap-1">
                    Komoditas
                    {sortField === 'commodity' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-600 font-bold" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-600 font-bold" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('type')}
                  className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors select-none group"
                >
                  <div className="flex items-center gap-1">
                    Tipe
                    {sortField === 'type' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-600 font-bold" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-600 font-bold" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('quantity')}
                  className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors select-none group"
                >
                  <div className="flex items-center gap-1">
                    Jumlah
                    {sortField === 'quantity' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-600 font-bold" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-600 font-bold" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bukti Penerimaan/Pengeluaran</th>
                {isAdmin && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedEntries.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-slate-400 italic">
                    Belum ada data tercatat.
                  </td>
                </tr>
              ) : (
                sortedEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700">{entry.month}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{entry.location}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-800 font-medium">{entry.commodity}</span>
                        <span className="text-xs text-slate-400">{entry.size}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          entry.flow === 'Masuk' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {entry.type}
                        </span>
                        {entry.type === 'Hibah' && entry.farmerName && (
                          <div className="text-[10px] text-slate-500 font-bold bg-slate-100/80 border border-slate-200/50 px-2 py-1 rounded-lg mt-1 w-max">
                            <span className="text-blue-700">Penerima:</span>
                            <div className="text-slate-700 font-extrabold">{entry.farmerName}</div>
                            <div className="text-[9px] text-slate-400 font-medium">{entry.farmerLocation}</div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">{entry.quantity.toLocaleString()}</span>
                      <span className="ml-1 text-xs text-slate-400">{entry.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      {entry.padReceiptImage ? (
                        entry.padReceiptImage.startsWith('data:application/pdf') ? (
                          <button
                            type="button"
                            onClick={() => setSelectedImage(entry.padReceiptImage ?? null)}
                            className="relative group block rounded-lg overflow-hidden border border-slate-200 cursor-pointer w-10 h-10 shrink-0 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center font-mono font-bold text-[9px] text-red-600"
                            title="Klik untuk melihat/mengunduh dokumen PDF"
                          >
                            PDF
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-[8px] text-white font-extrabold uppercase p-0.5">Buka</span>
                            </div>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedImage(entry.padReceiptImage ?? null)}
                            className="relative group block rounded-lg overflow-hidden border border-slate-200 cursor-pointer w-10 h-10 shrink-0"
                            title="Klik untuk memperbesar bukti penerimaan/pengeluaran"
                          >
                            <img 
                              src={entry.padReceiptImage} 
                              alt="Bukti Penerimaan/Pengeluaran" 
                              className="w-10 h-10 object-cover group-hover:scale-110 transition-transform duration-150"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-[9px] text-white font-extrabold uppercase p-0.5">Lihat</span>
                            </div>
                          </button>
                        )
                      ) : (entry.type === 'Penjualan' || entry.type === 'Hibah') ? (
                        <span className="text-[10px] text-slate-400 font-medium italic">Belum ada</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        {deletingId === entry.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors cursor-pointer"
                              title="Konfirmasi Hapus"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(entry)}
                              className="p-2 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Ubah"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(entry.id)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit */}
      {editingEntry && editFormData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Ubah Data Logistik</h3>
                <p className="text-xs text-slate-500 mt-0.5">Edit detail rekaman logistik ikan.</p>
              </div>
              <button
                type="button"
                onClick={() => { setEditingEntry(null); setEditFormData(null); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {editError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{editError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Lokasi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lokasi BBI</label>
                  <select
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value as BBILocation })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                  >
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>

                {/* Komoditas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Komoditas Ikan</label>
                  <select
                    value={editFormData.commodity}
                    onChange={(e) => setEditFormData({ ...editFormData, commodity: e.target.value as FishCommodity })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                  >
                    {COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Ukuran */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Kategori Ukuran</label>
                  <div className="flex gap-2">
                    {SIZES.map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, size })}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                          editFormData.size === size 
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tanggal Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Tanggal Input
                  </label>
                  <input
                    type="date"
                    value={editInputDate}
                    onChange={(e) => setEditInputDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                    required
                  />
                </div>

                {/* Minggu */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Minggu (Periode)</label>
                  <div className="relative">
                    <select
                      disabled
                      value={editFormData.month}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-semibold cursor-not-allowed outline-none appearance-none text-sm"
                    >
                      {WEEKS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <span className="absolute right-3 top-2.5 text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Otomatis
                    </span>
                  </div>
                </div>

                {/* Volume & Satuan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Volume/Jumlah</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editFormData.quantity || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, quantity: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                      required
                    />
                    <select
                      value={editFormData.unit}
                      onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value as 'ekor' | 'kg' })}
                      className="w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-bold"
                    >
                      <option value="ekor">ekor</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                </div>

                {/* Tipe Logistik */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Tipe Logistik</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {TYPES.map(type => (
                      <label
                        key={type.name}
                        className={cn(
                          "relative flex flex-col items-center justify-center py-2.5 px-1 border rounded-xl cursor-pointer transition-all text-center",
                          editFormData.type === type.name 
                            ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500" 
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <input
                          type="radio"
                          name="editLogisticsType"
                          value={type.name}
                          checked={editFormData.type === type.name}
                          onChange={() => {
                            setEditFormData({ ...editFormData, type: type.name });
                            if (type.name !== 'Hibah') {
                              setEditSelectedFarmer(null);
                              setEditSearchQuery('');
                            }
                          }}
                          className="sr-only"
                        />
                        <span className={cn(
                          "text-xs font-bold whitespace-nowrap",
                          editFormData.type === type.name ? "text-blue-700" : "text-slate-700"
                        )}>
                          {type.name}
                        </span>
                        <span className={cn(
                          "text-[9px] uppercase font-bold mt-0.5",
                          type.flow === 'Masuk' ? "text-green-600" : "text-orange-600"
                        )}>
                          {type.flow}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Pilih Pembudidaya (Khusus Hibah) */}
                {editFormData.type === 'Hibah' && (
                  <div className="md:col-span-2 space-y-1.5 border-t border-b border-slate-100 py-3.5 animate-in fade-in duration-200 text-sm">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-600" />
                      Pencarian Pembudidaya (Penerima Hibah) <span className="text-red-500 font-bold">*</span>
                    </label>

                    <div className="relative" ref={editDropdownRef}>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={editSearchQuery}
                          onChange={(e) => {
                            setEditSearchQuery(e.target.value);
                            setShowEditDropdown(true);
                          }}
                          onFocus={() => setShowEditDropdown(true)}
                          placeholder="Ketik nama penanggungjawab atau kecamatan/desa pembudidaya..."
                          className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-xs placeholder:text-slate-400"
                          required={!editSelectedFarmer}
                        />
                        {(editSearchQuery || editSelectedFarmer) && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditSearchQuery('');
                              setEditSelectedFarmer(null);
                            }}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                          >
                            <X className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>

                      {showEditDropdown && (
                        <div className="absolute z-30 w-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                            {filteredFarmers.length === 0 ? (
                              <div className="p-3 text-center text-slate-500 text-xs font-medium">
                                Tidak ada pembudidaya yang cocok
                              </div>
                            ) : (
                              filteredFarmers.map((farmer) => (
                                <button
                                  key={farmer.id}
                                  type="button"
                                  onClick={() => {
                                    setEditSelectedFarmer(farmer);
                                    setEditSearchQuery(farmer.namaPenanggungjawab);
                                    setShowEditDropdown(false);
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-2 bg-white hover:bg-slate-50/80 transition-colors flex flex-col gap-0.5",
                                    editSelectedFarmer?.id === farmer.id ? "bg-blue-50/50" : ""
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-slate-400" />
                                      {farmer.namaPenanggungjawab}
                                    </span>
                                    <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                      {farmer.kegiatanUsaha || 'Budidaya'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                    <span>{farmer.desa}, {farmer.kecamatan}</span>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {editSelectedFarmer && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5 max-w-sm animate-in zoom-in-95 duration-150 text-xs">
                        <div className="p-1 bg-emerald-100 text-emerald-700 rounded-lg">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">Pembudidaya Terpilih:</p>
                          <p className="font-semibold text-emerald-800 mt-0.5">{editSelectedFarmer.namaPenanggungjawab}</p>
                          <p className="text-slate-500 text-[11px]">{editSelectedFarmer.desa}, {editSelectedFarmer.kecamatan}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Gambar Bukti (Hanya jika tipe Penjualan atau Hibah di Edit Modal) */}
                {(editFormData.type === 'Penjualan' || editFormData.type === 'Hibah') && (
                  <div className="md:col-span-2 space-y-1.5 border-t border-slate-100 pt-4 animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-emerald-500" />
                      Bukti {editFormData.type === 'Penjualan' ? 'Setoran PAD' : 'Penerimaan/Pengeluaran'} <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold">Ubah Gambar</span>
                    </label>

                    {editFormData.padReceiptImage ? (
                      <div className="relative rounded-2xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between gap-4 max-w-md">
                        <div className="flex items-center gap-3">
                          {editFormData.padReceiptImage.startsWith('data:application/pdf') ? (
                            <div className="w-16 h-16 rounded-xl border border-slate-200 bg-red-50 text-red-600 flex flex-col items-center justify-center font-mono font-bold text-[10px]">
                              <span className="text-sm font-extrabold text-red-700">PDF</span>
                              <span>Dokumen</span>
                            </div>
                          ) : (
                            <img 
                              src={editFormData.padReceiptImage} 
                              alt="Bukti Penerimaan/Pengeluaran" 
                              referrerPolicy="no-referrer"
                              className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-white"
                            />
                          )}
                          <div>
                            <p className="text-xs font-bold text-slate-700">
                              Bukti_{editFormData.type === 'Penjualan' ? 'Setoran_PAD' : 'Penerimaan_Pengeluaran'}_Edit.{editFormData.padReceiptImage.startsWith('data:application/pdf') ? 'pdf' : 'jpeg'}
                            </p>
                            <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                              <Check className="w-3.5 h-3.5 text-emerald-500" /> Tersimpan / Siap diunggah {editFormData.padReceiptImage.startsWith('data:application/pdf') ? '(PDF)' : '(Terkompresi)'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, padReceiptImage: undefined })}
                          className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-xl transition-all shadow-sm cursor-pointer"
                          title="Hapus Bukti"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/10 rounded-2xl p-5 text-center transition-all cursor-pointer group max-w-md">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleEditImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={isCompressingEdit}
                        />
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-2.5 bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-500 rounded-xl transition-all shadow-sm">
                            {isCompressingEdit ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-700 text-xs">Pilih atau Seret Foto/Dokumen Baru</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">Mendukung .png, .jpg, .jpeg, .pdf</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {editImageError && (
                      <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {editImageError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setEditingEntry(null); setEditFormData(null); }}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editLoading || isCompressingEdit}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Modal Perbesar Gambar untuk Bukti PAD */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-slate-900/85 backdrop-blur-md flex items-center justify-center z-50 p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative bg-white rounded-3xl p-3 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-white/20 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="overflow-hidden rounded-2xl bg-slate-100 flex items-center justify-center min-h-[200px] w-full">
              {selectedImage.startsWith('data:application/pdf') ? (
                <div className="w-full flex flex-col gap-3">
                  <iframe 
                    src={selectedImage} 
                    className="w-full h-[50vh] rounded-xl border border-slate-200 bg-white"
                    title="Pratinjau PDF"
                  />
                  <div className="flex gap-2 justify-center pb-2">
                    <a 
                      href={selectedImage}
                      download="Bukti_Logistik.pdf"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh PDF
                    </a>
                  </div>
                </div>
              ) : (
                <img 
                  src={selectedImage} 
                  alt="Bukti Penerimaan/Pengeluaran Terbuka" 
                  className="max-h-[70vh] w-auto max-w-full object-contain pointer-events-none rounded-xl"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            <div className="text-center py-2.5">
              <p className="text-xs font-bold text-slate-700">Bukti Penerimaan/Pengeluaran Resmi (BBI)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
