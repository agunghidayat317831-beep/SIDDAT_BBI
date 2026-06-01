import React, { useState } from 'react';
import { 
  LOCATIONS, 
  COMMODITIES, 
  SIZES, 
  TYPES, 
  WEEKS, 
  BBILocation, 
  FishCommodity, 
  SizeCategory, 
  LogisticsType,
  FlowType,
  LogisticsEntry
} from '../types';
import { addLogisticsEntry } from '../services/logisticsService';
import { cn } from '../lib/utils';
import { Save, Loader2, AlertCircle, Download, Upload, Check, X, ClipboardList } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function LogisticsForm() {
  const [activeMode, setActiveMode] = useState<'manual' | 'excel'>('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Manual form state
  const [formData, setFormData] = useState({
    location: LOCATIONS[0],
    commodity: COMMODITIES[0],
    size: SIZES[0],
    type: TYPES[0].name,
    month: WEEKS[0],
    quantity: 0,
    unit: 'ekor' as 'ekor' | 'kg'
  });

  // State for PAD image receipt upload
  const [padReceiptImage, setPadReceiptImage] = useState<string | null>(null);
  const [padImageError, setPadImageError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Excel import state
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    total: number;
    valid: Omit<LogisticsEntry, 'id' | 'userId'>[];
    invalid: { row: number; errors: string[] }[];
  } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPadImageError('File harus berupa gambar (.jpg, .jpeg, .png)');
      return;
    }

    setPadImageError(null);
    setIsCompressing(true);

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
          setPadReceiptImage(compressedBase64);
        }
        setIsCompressing(false);
      };
      img.onerror = () => {
        setPadImageError('Gagal memproses gambar');
        setIsCompressing(false);
      };
      if (evt.target?.result) {
        img.src = evt.target.result as string;
      }
    };
    reader.onerror = () => {
      setPadImageError('Gagal membaca file');
      setIsCompressing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const selectedType = TYPES.find(t => t.name === formData.type);
      if (!selectedType) throw new Error('Invalid type');

      await addLogisticsEntry({
        ...formData,
        flow: selectedType.flow as FlowType,
        createdAt: Date.now(),
        ...(formData.type === 'Penjualan' && padReceiptImage ? { padReceiptImage } : {})
      });

      setSuccess(true);
      setFormData(prev => ({ ...prev, quantity: 0 }));
      setPadReceiptImage(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  // Generate and download Excel Template for Logistics Data
  const downloadTemplate = () => {
    const headers = [
      "Minggu Ke", 
      "Lokasi BBI", 
      "Komoditas", 
      "Kategori Ukuran", 
      "Tipe Logistik", 
      "Volume/Jumlah", 
      "Satuan"
    ];
    
    // Prefill with realistic examples to guide users
    const examples = [
      {
        "Minggu Ke": "Minggu ke 1",
        "Lokasi BBI": "Cipule",
        "Komoditas": "Nila",
        "Kategori Ukuran": "3-5 cm",
        "Tipe Logistik": "Produksi",
        "Volume/Jumlah": 1500,
        "Satuan": "ekor"
      },
      {
        "Minggu Ke": "Minggu ke 2",
        "Lokasi BBI": "Mekarbuana",
        "Komoditas": "Lele",
        "Kategori Ukuran": "1-3 cm",
        "Tipe Logistik": "Penjualan",
        "Volume/Jumlah": 100,
        "Satuan": "kg"
      },
      {
        "Minggu Ke": "Minggu ke 3",
        "Lokasi BBI": "Cipule",
        "Komoditas": "Ikan Mas",
        "Kategori Ukuran": "3-5 cm",
        "Tipe Logistik": "Kematian Ikan",
        "Volume/Jumlah": 50,
        "Satuan": "ekor"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(examples, { header: headers });
    
    // Set column widths to be readable
    const wscols = headers.map(h => ({ wch: Math.max(h.length + 3, 18) }));
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Logistik");
    XLSX.writeFile(wb, "Template_Data_Logistik_Ikan.xlsx");
  };

  // Parse Excel spreadsheet
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawRows = XLSX.utils.sheet_to_json<any>(ws);

        if (rawRows.length === 0) {
          setError("File Excel kosong atau tidak menemukan baris data.");
          return;
        }

        const validRecords: Omit<LogisticsEntry, 'id' | 'userId'>[] = [];
        const invalidRecords: { row: number; errors: string[] }[] = [];

        rawRows.forEach((row, idx) => {
          const rowNum = idx + 2; // Header is row 1
          const errors: string[] = [];

          const mingguRaw = String(row["Minggu Ke"] || "").trim();
          const lokasiRaw = String(row["Lokasi BBI"] || "").trim();
          const komoditasRaw = String(row["Komoditas"] || "").trim();
          const ukuranRaw = String(row["Kategori Ukuran"] || "").trim();
          const tipeRaw = String(row["Tipe Logistik"] || "").trim();
          const qtyRaw = row["Volume/Jumlah"];
          const satuanRaw = String(row["Satuan"] || "").trim().toLowerCase();

          let matchedWeek = "";
          if (!mingguRaw) {
            errors.push("Minggu Ke kosong");
          } else {
            const cleanW = WEEKS.find(w => w.toLowerCase() === mingguRaw.toLowerCase());
            if (!cleanW) {
              errors.push(`Format Minggu "${mingguRaw}" tidak valid (Contoh: "Minggu ke 1")`);
            } else {
              matchedWeek = cleanW;
            }
          }

          let matchedLocation: BBILocation | null = null;
          if (!lokasiRaw) {
            errors.push("Lokasi BBI kosong");
          } else {
            const cleanLoc = LOCATIONS.find(loc => loc.toLowerCase() === lokasiRaw.toLowerCase());
            if (!cleanLoc) {
              errors.push(`Lokasi "${lokasiRaw}" tidak dikenal (Pilih "Cipule" atau "Mekarbuana")`);
            } else {
              matchedLocation = cleanLoc;
            }
          }

          let matchedCommodity: FishCommodity | null = null;
          if (!komoditasRaw) {
            errors.push("Komoditas kosong");
          } else {
            const cleanCom = COMMODITIES.find(c => c.toLowerCase() === komoditasRaw.toLowerCase());
            if (!cleanCom) {
              errors.push(`Komoditas "${komoditasRaw}" tidak dikenal (Pilih "Ikan Mas", "Nila", atau "Lele")`);
            } else {
              matchedCommodity = cleanCom;
            }
          }

          let matchedSize: SizeCategory | null = null;
          if (!ukuranRaw) {
            errors.push("Kategori Ukuran kosong");
          } else {
            const cleanSize = SIZES.find(s => s.toLowerCase() === ukuranRaw.toLowerCase());
            if (!cleanSize) {
              errors.push(`Ukuran "${ukuranRaw}" tidak dikenal (Pilih "1-3 cm", "3-5 cm", atau "Indukan")`);
            } else {
              matchedSize = cleanSize;
            }
          }

          let matchedTypeObj: typeof TYPES[number] | null = null;
          if (!tipeRaw) {
            errors.push("Tipe Logistik kosong");
          } else {
            const cleanType = TYPES.find(t => t.name.toLowerCase() === tipeRaw.toLowerCase());
            if (!cleanType) {
              errors.push(`Tipe "${tipeRaw}" tidak valid (Pilih "Produksi", "Penjualan", "Penyetokan Ulang", "Hibah", atau "Kematian Ikan")`);
            } else {
              matchedTypeObj = cleanType;
            }
          }

          const quantityNum = parseFloat(qtyRaw);
          if (qtyRaw === null || qtyRaw === undefined || isNaN(quantityNum)) {
            errors.push("Volume/Jumlah kosong atau bukan angka");
          } else if (quantityNum < 0) {
            errors.push(`Volume/Jumlah (${quantityNum}) tidak boleh negatif`);
          }

          let matchedUnitObj: 'ekor' | 'kg' = 'ekor';
          if (!satuanRaw) {
            errors.push("Satuan kosong");
          } else if (satuanRaw !== 'ekor' && satuanRaw !== 'kg') {
            errors.push(`Satuan "${satuanRaw}" tidak dikenal (Harus "ekor" atau "kg")`);
          } else {
            matchedUnitObj = satuanRaw;
          }

          if (errors.length > 0) {
            invalidRecords.push({ row: rowNum, errors });
          } else {
            validRecords.push({
              month: matchedWeek,
              location: matchedLocation!,
              commodity: matchedCommodity!,
              size: matchedSize!,
              type: matchedTypeObj!.name,
              flow: matchedTypeObj!.flow,
              quantity: quantityNum,
              unit: matchedUnitObj,
              createdAt: Date.now()
            });
          }
        });

        setImportResults({
          total: rawRows.length,
          valid: validRecords,
          invalid: invalidRecords
        });
        setError(null);
      } catch (err: any) {
        setError("Gagal membaca file Excel. Pastikan format file .xlsx valid.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Safe bulk saving to server
  const saveImportedData = async () => {
    if (!importResults || importResults.valid.length === 0) return;
    setImporting(true);
    setError(null);
    setSuccess(false);
    let successCount = 0;
    try {
      for (const record of importResults.valid) {
        await addLogisticsEntry(record);
        successCount++;
      }
      setSuccess(true);
      setImportResults(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(`Berhasil menyimpan ${successCount} dari ${importResults.valid.length} data. Error: ${err.message || 'Gagal menyimpan data.'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header width Mode Switcher Tab */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-5.5 h-5.5 text-blue-500" />
            Input Data Logistik
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Lengkapi formulir di bawah atau unggah file untuk mencatat arus logistik ikan.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => { setActiveMode('manual'); setImportResults(null); }}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer",
              activeMode === 'manual' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Input Manual
          </button>
          <button
            type="button"
            onClick={() => { setActiveMode('excel'); }}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
              activeMode === 'excel' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Download className="w-3.5 h-3.5" />
            Impor Masal Excel
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-700">
            <Check className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">Data logistik berhasil disimpan!</p>
          </div>
        )}

        {/* Manual entry mode */}
        {activeMode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lokasi */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Lokasi BBI</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value as BBILocation })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>

              {/* Komoditas */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Komoditas Ikan</label>
                <select
                  value={formData.commodity}
                  onChange={(e) => setFormData({ ...formData, commodity: e.target.value as FishCommodity })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  {COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Ukuran */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Kategori Ukuran</label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFormData({ ...formData, size })}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all border cursor-pointer",
                        formData.size === size 
                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200" 
                          : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minggu */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Waktu/Periode (Minggu)</label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  {WEEKS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              {/* Tipe Logistik */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Tipe Logistik</label>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {TYPES.map(type => (
                    <label
                      key={type.name}
                      className={cn(
                        "relative flex flex-col p-4 border rounded-xl cursor-pointer transition-all",
                        formData.type === type.name 
                          ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500" 
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="logisticsType"
                        value={type.name}
                        checked={formData.type === type.name}
                        onChange={() => setFormData({ ...formData, type: type.name })}
                        className="sr-only"
                      />
                      <span className={cn(
                        "text-sm font-bold",
                        formData.type === type.name ? "text-blue-700" : "text-slate-700"
                      )}>
                        {type.name}
                      </span>
                      <span className={cn(
                        "text-[10px] uppercase font-bold mt-1",
                        type.flow === 'Masuk' ? "text-green-600" : "text-orange-600"
                      )}>
                        {type.flow}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Jumlah */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Volume/Jumlah</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    required
                  />
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'ekor' | 'kg' })}
                    className="w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="ekor">ekor</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              {/* Upload Gambar Setoran PAD (Hanya Penjualan) */}
              {formData.type === 'Penjualan' && (
                <div className="md:col-span-2 space-y-2 border-t border-slate-100 pt-4 animate-in fade-in duration-200">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-emerald-500" />
                    Bukti Setoran PAD <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold">Direkomendasikan</span>
                  </label>
                  
                  {padReceiptImage ? (
                    <div className="relative rounded-2xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between gap-4 max-w-md">
                      <div className="flex items-center gap-3">
                        <img 
                          src={padReceiptImage} 
                          alt="Bukti Setoran PAD" 
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-white"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-700">Bukti_Setoran_PAD.jpeg</p>
                          <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                            <Check className="w-3.5 h-3.5 text-emerald-500" /> Siap diunggah (Terkompresi)
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPadReceiptImage(null)}
                        className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-xl transition-all shadow-sm cursor-pointer"
                        title="Hapus Bukti"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/10 rounded-2xl p-6 text-center transition-all cursor-pointer group max-w-md">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isCompressing}
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-500 rounded-xl transition-all shadow-sm">
                          {isCompressing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 text-xs">Pilih atau Seret Foto Setoran PAD</p>
                          <p className="text-[10px] text-slate-400 mt-1">Mendukung format gambar (.png, .jpg, .jpeg)</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {padImageError && (
                    <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {padImageError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Simpan Catatan
              </button>
            </div>
          </form>
        )}

        {/* Switch on Excel importer sheet mode */}
        {activeMode === 'excel' && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-500" />
                  Langkah 1: Unduh Template Excel Logistik Ikan
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Gunakan template ini untuk mencatat massal logistik ikan. Pastikan isian Minggu Ke, Lokasi BBI, Komoditas, Kategori Ukuran, Tipe Logistik, dan Satuan terisi sesuai pilihan standar.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="w-full md:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Unduh Template (.xlsx)
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/30 rounded-2xl p-10 text-center transition-colors relative">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-blue-50 text-blue-500 rounded-full shadow-sm">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-700 text-sm">Langkah 2: Pilih atau Drop File Excel Logistik Ikan</p>
                  <p className="text-xs text-slate-400 mt-1">Mendukung file berformat (.xlsx, .xls)</p>
                </div>
              </div>
            </div>

            {/* Analysis & Upload Control */}
            {importResults && (
              <div className="space-y-5 border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Hasil Analisis File Excel Logistik</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Terbaca total <span className="font-bold text-slate-700">{importResults.total} baris data</span> dari file Anda.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      {importResults.valid.length} Baris Valid
                    </span>
                    {importResults.invalid.length > 0 && (
                      <span className="text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 flex items-center gap-1.5">
                        <X className="w-4 h-4" />
                        {importResults.invalid.length} Bermasalah
                      </span>
                    )}
                  </div>
                </div>

                {/* Validation errors list */}
                {importResults.invalid.length > 0 && (
                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 space-y-2 max-h-[180px] overflow-y-auto">
                    <p className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      Koreksi Isian Data pada Baris Berikut:
                    </p>
                    <div className="space-y-1.5 pl-2">
                       {importResults.invalid.map((item, i) => (
                        <p key={i} className="text-[11px] text-red-700 font-medium">
                          • <span className="font-extrabold">Baris {item.row}</span>: {item.errors.join(', ')}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirm upload action items */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setImportResults(null)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold font-mono hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  
                  <button
                    type="button"
                    disabled={importing || importResults.valid.length === 0}
                    onClick={saveImportedData}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-100 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan {importResults.valid.length} Data Logistik ke Server
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
