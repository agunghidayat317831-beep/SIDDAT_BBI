import React, { useState } from 'react';
import { addOxygenRecord } from '../services/oxygenService';
import { Save, Loader2, AlertCircle, Wind, Download, Upload, Check, X, Sparkles } from 'lucide-react';
import { WEEKS, LOCATIONS, BBILocation, OxygenRecord } from '../types';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';

export default function OxygenForm() {
  const [activeMode, setActiveMode] = useState<'manual' | 'excel'>('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Manual form state
  const [formData, setFormData] = useState({
    week: WEEKS[0],
    location: LOCATIONS[0] as BBILocation,
    oxygenValue: 6.0,
    notes: ''
  });

  // Excel import state
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    total: number;
    valid: Omit<OxygenRecord, 'id' | 'userId'>[];
    invalid: { row: number; errors: string[] }[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await addOxygenRecord({
        ...formData,
        createdAt: Date.now()
      });

      setSuccess(true);
      setFormData({
        week: WEEKS[0],
        location: LOCATIONS[0] as BBILocation,
        oxygenValue: 6.0,
        notes: ''
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data kadar oksigen air');
    } finally {
      setLoading(false);
    }
  };

  // Generate and download Excel Template for Kadar Oksigen
  const downloadTemplate = () => {
    const headers = ["Minggu Ke", "Lokasi BBI", "Kadar Oksigen (mg/L)", "Keterangan (Opsional)"];
    
    // Prefill with realistic examples to guide users
    const examples = [
      {
        "Minggu Ke": "Minggu ke 1",
        "Lokasi BBI": "Cipule",
        "Kadar Oksigen (mg/L)": 6.5,
        "Keterangan (Opsional)": "Pengukuran pagi hari, kondisi air bersih"
      },
      {
        "Minggu Ke": "Minggu ke 2",
        "Lokasi BBI": "Mekarbuana",
        "Kadar Oksigen (mg/L)": 5.4,
        "Keterangan (Opsional)": "Suhu air dingin, mendung"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(examples, { header: headers });
    
    // Set column widths to be more helpful and clean
    const wscols = headers.map(h => ({ wch: Math.max(h.length + 3, 18) }));
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Kadar Oksigen");
    XLSX.writeFile(wb, "Template_Data_Kadar_Oksigen.xlsx");
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

        const validRecords: Omit<OxygenRecord, 'id' | 'userId'>[] = [];
        const invalidRecords: { row: number; errors: string[] }[] = [];

        rawRows.forEach((row, idx) => {
          const rowNum = idx + 2; // Rows start at 1, Header is 1, so data row is index + 2
          const errors: string[] = [];

          const mingguRaw = String(row["Minggu Ke"] || "").trim();
          const lokasiRaw = String(row["Lokasi BBI"] || "").trim();
          const oxygenValueRaw = row["Kadar Oksigen (mg/L)"] || row["Kadar Oksigen"];
          const notesRaw = String(row["Keterangan (Opsional)"] || "").trim();

          let matchedWeek = "";
          if (!mingguRaw) {
            errors.push("Minggu Ke kosong");
          } else {
            // Case-insensitive match for week format "Minggu ke 1"
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
            // Case-insensitive match for Cipule or Mekarbuana
            const cleanLoc = LOCATIONS.find(loc => loc.toLowerCase() === lokasiRaw.toLowerCase());
            if (!cleanLoc) {
              errors.push(`Lokasi "${lokasiRaw}" tidak dikenal (Pilih "Cipule" atau "Mekarbuana")`);
            } else {
              matchedLocation = cleanLoc;
            }
          }

          const o2Val = parseFloat(oxygenValueRaw);
          if (oxygenValueRaw === null || oxygenValueRaw === undefined || isNaN(o2Val)) {
            errors.push("Nilai Kadar Oksigen kosong atau mengandung huruf");
          } else if (o2Val < 0 || o2Val > 25) {
            errors.push(`Nilai Kadar Oksigen (${o2Val}) di luar jangkauan aman (Rentang valid: 0 - 25 mg/L)`);
          }

          if (errors.length > 0) {
            invalidRecords.push({ row: rowNum, errors });
          } else {
            validRecords.push({
              week: matchedWeek,
              location: matchedLocation!,
              oxygenValue: o2Val,
              notes: notesRaw || undefined,
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

  // Safe Batch saving to Firebase
  const saveImportedData = async () => {
    if (!importResults || importResults.valid.length === 0) return;
    setImporting(true);
    setError(null);
    setSuccess(false);
    let successCount = 0;
    try {
      for (const record of importResults.valid) {
        await addOxygenRecord(record);
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
      {/* Header with Sub Header and Tab switcher */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wind className="w-5.5 h-5.5 text-sky-500" />
            Input Kadar Oksigen Air per Minggu
          </h2>
          <p className="text-sm text-slate-500 mt-1">Catat kadar oksigen terlarut (Dissolved Oxygen) kolam secara berkala.</p>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-center">
          <button
            type="button"
            onClick={() => { setActiveMode('manual'); setImportResults(null); }}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all",
              activeMode === 'manual' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Input Manual
          </button>
          <button
            type="button"
            onClick={() => { setActiveMode('excel'); }}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
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
            <p className="text-sm font-medium">Data kadar oksigen air berhasil disimpan!</p>
          </div>
        )}

        {/* Input Manual Mode */}
        {activeMode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Minggu Ke</label>
                <select
                  value={formData.week}
                  onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  required
                >
                  {WEEKS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Lokasi BBI</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value as BBILocation })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  required
                >
                  {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Kadar Oksigen (mg/L atau ppm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={formData.oxygenValue}
                  onChange={(e) => setFormData({ ...formData, oxygenValue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700"
                  required
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Keterangan (Opsional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none min-h-[80px]"
                  placeholder="Contoh: Pengukuran pagi hari sebelum aerator dinyalakan..."
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Simpan Data Oksigen
              </button>
            </div>
          </form>
        )}

        {/* Input via Excel Mode */}
        {activeMode === 'excel' && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <Download className="w-5 h-5 text-sky-500" />
                  Langkah 1: Unduh Template Excel Kadar Oksigen
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Gunakan template resmi ini untuk mencatat massal data kadar oksigen air mingguan. Sesuaikan isian kolom "Minggu Ke" dan "Lokasi BBI" agar terverifikasi otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="w-full md:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-1.5 shrink-0"
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
                <div className="p-4 bg-sky-50 text-sky-500 rounded-full shadow-sm">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-700 text-sm">Langkah 2: Pilih atau Drop File Excel Kadar Oksigen</p>
                  <p className="text-xs text-slate-400 mt-1">Mendukung file berformat (.xlsx, .xls)</p>
                </div>
              </div>
            </div>

            {/* Analysis & Upload Control */}
            {importResults && (
              <div className="space-y-5 border border-slate-200 rounded-2xl p-6 bg-white shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Hasil Analisis File Excel Kadar Oksigen</h4>
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
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold font-mono hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  
                  <button
                    type="button"
                    disabled={importing || importResults.valid.length === 0}
                    onClick={saveImportedData}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-100 transition-all flex items-center gap-1.5"
                  >
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan {importResults.valid.length} Data Kadar Oksigen ke Server
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
