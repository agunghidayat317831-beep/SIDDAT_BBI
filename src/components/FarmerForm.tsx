import React, { useState } from 'react';
import { addFarmer } from '../services/farmerService';
import { Save, Loader2, AlertCircle, MapPin, Download, Upload, X, Check, Sparkles, Camera, User, Image } from 'lucide-react';
import { cn } from '../lib/utils';
import { KECAMATAN, KECAMATAN_DESA, KEGIATAN_USAHA, KLASIFIKASI_KOLAM, STATUS_KEPEMILIKAN, STATUS_PROFESI, BENTUK_USAHA, TEKNOLOGI_BUDIDAYA, Farmer } from '../types';
import * as XLSX from 'xlsx';

export default function FarmerForm() {
  const [activeMode, setActiveMode] = useState<'manual' | 'excel'>('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Manual form state
  const [formData, setFormData] = useState({
    kecamatan: '',
    desa: '',
    namaPenanggungjawab: '',
    kegiatanUsaha: '',
    email: '',
    telephone: '',
    klasifikasiKolam: '',
    teknologiBudidaya: '',
    bentukUsaha: '',
    statusProfesi: '',
    statusKepemilikan: '',
    periodeSewa: '',
    jenisIkanUtama: '',
    jenisIkanTambahan: '',
    omzet: 0,
    alamat: '',
    latitude: -6.301873,
    longitude: 107.304801,
    photoUrl: ''
  });

  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('File harus berupa gambar (.jpg, .jpeg, .png)');
      return;
    }

    setPhotoError(null);
    setIsCompressingPhoto(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 450;
        const MAX_HEIGHT = 450;
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
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setFormData(prev => ({ ...prev, photoUrl: compressedBase64 }));
        }
        setIsCompressingPhoto(false);
      };
      img.onerror = () => {
        setPhotoError('Gagal memproses gambar');
        setIsCompressingPhoto(false);
      };
      if (evt.target?.result) {
        img.src = evt.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  // Excel import state
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    total: number;
    valid: Omit<Farmer, 'id' | 'userId'>[];
    invalid: { row: number; errors: string[] }[];
  } | null>(null);

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
      const submitData = { ...formData };
      if (!submitData.photoUrl) {
         delete (submitData as any).photoUrl;
      }

      await addFarmer({
        ...submitData,
        createdAt: Date.now()
      });

      setSuccess(true);
      setFormData({
        kecamatan: '',
        desa: '',
        namaPenanggungjawab: '',
        kegiatanUsaha: '',
        email: '',
        telephone: '',
        klasifikasiKolam: '',
        teknologiBudidaya: '',
        bentukUsaha: '',
        statusProfesi: '',
        statusKepemilikan: '',
        periodeSewa: '',
        jenisIkanUtama: '',
        jenisIkanTambahan: '',
        omzet: 0,
        alamat: '',
        latitude: -6.301873,
        longitude: 107.304801,
        photoUrl: ''
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data pembudidaya');
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

  // Generate and download Excel Template
  const downloadTemplate = () => {
    const headers = [
      "Kecamatan",
      "Desa/Kelurahan",
      "Nama Penanggungjawab",
      "Kegiatan Usaha",
      "Email",
      "Telephone",
      "Klasifikasi Kolam",
      "Teknologi Budidaya",
      "Bentuk Usaha",
      "Status Profesi",
      "Status Kepemilikan",
      "Periode Sewa",
      "Jenis Ikan Utama",
      "Jenis Ikan Tambahan",
      "Omzet per Tahun (Rupiah)",
      "Alamat",
      "Latitude",
      "Longitude"
    ];

    // Prefill with realistic examples to guide users
    const examples = [
      {
        "Kecamatan": "Kecamatan Tegalwaru",
        "Desa/Kelurahan": "Mekarbuana",
        "Nama Penanggungjawab": "Heri Kuswanto",
        "Kegiatan Usaha": "Budidaya Ikan",
        "Email": "herikuswanto@example.com",
        "Telephone": "081234567890",
        "Klasifikasi Kolam": "Kolam Air Tenang",
        "Teknologi Budidaya": "Semi Intensif",
        "Bentuk Usaha": "Perseorangan",
        "Status Profesi": "Utama",
        "Status Kepemilikan": "Milik Sendiri",
        "Periode Sewa": "-",
        "Jenis Ikan Utama": "Nila",
        "Jenis Ikan Tambahan": "Mas",
        "Omzet per Tahun (Rupiah)": 50000000,
        "Alamat": "Jalan Wisata Curug Cigentis RT 02/01",
        "Latitude": -6.345821,
        "Longitude": 107.284214
      },
      {
        "Kecamatan": "Kecamatan Ciampel",
        "Desa/Kelurahan": "Mulyasari",
        "Nama Penanggungjawab": "Siti Aminah",
        "Kegiatan Usaha": "Pembenihan Ikan",
        "Email": "sitiaminah@example.com",
        "Telephone": "085712345678",
        "Klasifikasi Kolam": "Pembenihan dan Pendederan Air Tawar",
        "Teknologi Budidaya": "Bioflok",
        "Bentuk Usaha": "Kelompok",
        "Status Profesi": "Sampingan",
        "Status Kepemilikan": "Kerjasama/Bagi Hasil",
        "Periode Sewa": "3 Tahun",
        "Jenis Ikan Utama": "Lele",
        "Jenis Ikan Tambahan": "Nila",
        "Omzet per Tahun (Rupiah)": 35000000,
        "Alamat": "Kompleks BBI Kampung Cipule Kidul RT 12/04",
        "Latitude": -6.301873,
        "Longitude": 107.304801
      }
    ];

    const ws = XLSX.utils.json_to_sheet(examples, { header: headers });
    
    // Set column widths to be more helpful and clean
    const wscols = headers.map(h => ({ wch: Math.max(h.length + 3, 16) }));
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Pembudidaya");
    XLSX.writeFile(wb, "Template_Data_Pembudidaya.xlsx");
  };

  // Convert string lists safely matching case-insensitively
  const getCleanOption = (list: string[], val: string): string | null => {
    const found = list.find(item => item.toLowerCase() === val.toLowerCase());
    return found || null;
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

        const validRecords: Omit<Farmer, 'id' | 'userId'>[] = [];
        const invalidRecords: { row: number; errors: string[] }[] = [];

        rawRows.forEach((row, idx) => {
          const rowNum = idx + 2; // Rows starts at 1, Header is 1, so row indexing is + 2
          const errors: string[] = [];

          const kecamatanVal = String(row["Kecamatan"] || "").trim();
          const desaVal = String(row["Desa/Kelurahan"] || "").trim();
          const namaPenanggungjawab = String(row["Nama Penanggungjawab"] || "").trim();
          const kegiatanUsaha = String(row["Kegiatan Usaha"] || "").trim();
          const email = String(row["Email"] || "").trim();
          const telephone = String(row["Telephone"] || "").trim();
          const klasifikasiKolam = String(row["Klasifikasi Kolam"] || "").trim();
          const teknologiBudidaya = String(row["Teknologi Budidaya"] || "").trim();
          const bentukUsaha = String(row["Bentuk Usaha"] || "").trim();
          const statusProfesi = String(row["Status Profesi"] || "").trim();
          const statusKepemilikan = String(row["Status Kepemilikan"] || "").trim();
          const periodeSewa = String(row["Periode Sewa"] || "").trim();
          const jenisIkanUtama = String(row["Jenis Ikan Utama"] || "").trim();
          const jenisIkanTambahan = String(row["Jenis Ikan Tambahan"] || "").trim();
          const omzetRaw = row["Omzet per Tahun (Rupiah)"] || row["Omzet"];
          const alamat = String(row["Alamat"] || "").trim();
          const latitudeRaw = row["Latitude"];
          const longitudeRaw = row["Longitude"];

          // Validations
          let matchedKec = "";
          if (!kecamatanVal) {
            errors.push("Kecamatan kosong");
          } else {
            const cleanKec = getCleanOption(KECAMATAN, kecamatanVal);
            if (!cleanKec) {
              errors.push(`Kecamatan "${kecamatanVal}" tidak terdaftar`);
            } else {
              matchedKec = cleanKec;
            }
          }

          let matchedDesa = "";
          if (!desaVal) {
            errors.push("Desa/Kelurahan kosong");
          } else if (matchedKec) {
            const desas = KECAMATAN_DESA[matchedKec] || [];
            const cleanD = getCleanOption(desas, desaVal);
            if (!cleanD) {
              errors.push(`Desa "${desaVal}" tidak terdaftar di ${matchedKec}`);
            } else {
              matchedDesa = cleanD;
            }
          }

          if (!namaPenanggungjawab) errors.push("Nama Penanggungjawab kosong");

          let matchedKeg = "";
          if (!kegiatanUsaha) {
            errors.push("Kegiatan Usaha kosong");
          } else {
            const cleanKeg = getCleanOption(KEGIATAN_USAHA, kegiatanUsaha);
            if (!cleanKeg) {
              errors.push(`Kegiatan Usaha "${kegiatanUsaha}" tidak sesuai`);
            } else {
              matchedKeg = cleanKeg;
            }
          }

          let matchedKlas = "";
          if (!klasifikasiKolam) {
            errors.push("Klasifikasi Kolam kosong");
          } else {
            const cleanKlas = getCleanOption(KLASIFIKASI_KOLAM, klasifikasiKolam);
            if (!cleanKlas) {
              errors.push(`Klasifikasi Kolam "${klasifikasiKolam}" tidak sesuai`);
            } else {
              matchedKlas = cleanKlas;
            }
          }

          let matchedTek = "";
          if (!teknologiBudidaya) {
            errors.push("Teknologi Budidaya kosong");
          } else {
            const cleanTek = getCleanOption(TEKNOLOGI_BUDIDAYA, teknologiBudidaya);
            if (!cleanTek) {
              errors.push(`Teknologi Budidaya "${teknologiBudidaya}" tidak sesuai`);
            } else {
              matchedTek = cleanTek;
            }
          }

          let matchedBentuk = "";
          if (!bentukUsaha) {
            errors.push("Bentuk Usaha kosong");
          } else {
            const cleanB = getCleanOption(BENTUK_USAHA, bentukUsaha);
            if (!cleanB) {
              errors.push(`Bentuk Usaha "${bentukUsaha}" tidak sesuai`);
            } else {
              matchedBentuk = cleanB;
            }
          }

          let matchedProf = "";
          if (!statusProfesi) {
            errors.push("Status Profesi kosong");
          } else {
            const cleanP = getCleanOption(STATUS_PROFESI, statusProfesi);
            if (!cleanP) {
              errors.push(`Status Profesi "${statusProfesi}" tidak sesuai`);
            } else {
              matchedProf = cleanP;
            }
          }

          let matchedKep = "";
          if (!statusKepemilikan) {
            errors.push("Status Kepemilikan kosong");
          } else {
            const cleanKep = getCleanOption(STATUS_KEPEMILIKAN, statusKepemilikan);
            if (!cleanKep) {
              errors.push(`Status Kepemilikan "${statusKepemilikan}" tidak sesuai`);
            } else {
              matchedKep = cleanKep;
            }
          }

          if (!alamat) errors.push("Alamat kosong");

          const omzet = parseFloat(omzetRaw) || 0;
          const latitude = parseFloat(latitudeRaw) || -6.301873;
          const longitude = parseFloat(longitudeRaw) || 107.304801;

          if (errors.length > 0) {
            invalidRecords.push({ row: rowNum, errors });
          } else {
            validRecords.push({
              kecamatan: matchedKec,
              desa: matchedDesa,
              namaPenanggungjawab,
              kegiatanUsaha: matchedKeg,
              email,
              telephone,
              klasifikasiKolam: matchedKlas,
              teknologiBudidaya: matchedTek,
              bentukUsaha: matchedBentuk,
              statusProfesi: matchedProf,
              statusKepemilikan: matchedKep,
              periodeSewa,
              jenisIkanUtama,
              jenisIkanTambahan,
              omzet,
              alamat,
              latitude,
              longitude,
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
    // Clear elements to allow uploading the same file again if edited
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
        await addFarmer(record);
        successCount++;
      }
      setSuccess(true);
      setImportResults(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(`Baru berhasil menyimpan ${successCount} dari ${importResults.valid.length} data. Error: ${err.message || 'Gagal menyimpan data.'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header with Sub Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5.5 h-5.5 text-blue-600" />
            Input Data Pembudidaya
          </h2>
          <p className="text-sm text-slate-500 mt-1">Lengkapi data pembudidaya penerima bibit.</p>
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
            <p className="text-sm font-medium">Data pembudidaya berhasil disimpan!</p>
          </div>
        )}

        {/* Input Manual View */}
        {activeMode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Side: Form Fields Grid */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Kecamatan</label>
                    <select
                      value={formData.kecamatan}
                      onChange={(e) => handleKecamatanChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700"
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
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700"
                      required
                      disabled={!formData.kecamatan}
                    >
                      <option value="">Pilih Desa/Kelurahan</option>
                      {formData.kecamatan && KECAMATAN_DESA[formData.kecamatan]?.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <InputGroup label="Nama Penanggungjawab" value={formData.namaPenanggungjawab} onChange={v => setFormData({...formData, namaPenanggungjawab: v})} />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Kegiatan Usaha</label>
                    <select
                      value={formData.kegiatanUsaha}
                      onChange={(e) => setFormData({ ...formData, kegiatanUsaha: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700"
                      required
                    >
                      <option value="">Pilih Kegiatan Usaha</option>
                      {KEGIATAN_USAHA.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <InputGroup label="Email" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
                  <InputGroup label="Telephone" value={formData.telephone} onChange={v => setFormData({...formData, telephone: v})} />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Klasifikasi Kolam</label>
                    <select
                      value={formData.klasifikasiKolam}
                      onChange={(e) => setFormData({ ...formData, klasifikasiKolam: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700"
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
                      value={formData.teknologiBudidaya}
                      onChange={(e) => setFormData({ ...formData, teknologiBudidaya: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700"
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
                      value={formData.bentukUsaha}
                      onChange={(e) => setFormData({ ...formData, bentukUsaha: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700"
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
                      value={formData.statusProfesi}
                      onChange={(e) => setFormData({ ...formData, statusProfesi: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700"
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
                      value={formData.statusKepemilikan}
                      onChange={(e) => setFormData({ ...formData, statusKepemilikan: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700"
                      required
                    >
                      <option value="">Pilih Status Kepemilikan</option>
                      {STATUS_KEPEMILIKAN.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <InputGroup label="Periode Sewa" value={formData.periodeSewa} onChange={v => setFormData({...formData, periodeSewa: v})} />
                  <InputGroup label="Jenis Ikan Utama" value={formData.jenisIkanUtama} onChange={v => setFormData({...formData, jenisIkanUtama: v})} />
                  <InputGroup label="Jenis Ikan Tambahan" value={formData.jenisIkanTambahan} onChange={v => setFormData({...formData, jenisIkanTambahan: v})} />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Omzet (per Tahun)</label>
                    <input
                      type="number"
                      value={formData.omzet || ''}
                      onChange={(e) => setFormData({ ...formData, omzet: parseFloat(e.target.value) || 0 })}
                      placeholder="Contoh: 50000000"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2 lg:col-span-3 space-y-2">
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
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700"
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
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700"
                      required
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border border-slate-200 text-sm"
                    >
                      <MapPin className="w-4 h-4 text-slate-500" />
                      Ambil Lokasi Saat Ini
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side Column: Photo Upload Widget (Top Right) */}
              <div className="w-full lg:w-80 lg:shrink-0 flex flex-col gap-6">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-600" />
                      Foto Pembudidaya
                    </p>
                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                        className="text-xs text-red-600 hover:text-red-750 font-semibold flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Hapus
                      </button>
                    )}
                  </div>

                  <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center min-h-[220px] overflow-hidden group">
                    {isCompressingPhoto ? (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                        <p className="text-xs text-slate-500 font-semibold font-mono">Mengompres gambar...</p>
                      </div>
                    ) : formData.photoUrl ? (
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <img 
                          src={formData.photoUrl} 
                          alt="Pas Foto Pembudidaya" 
                          referrerPolicy="no-referrer"
                          className="w-32 h-32 rounded-full object-cover border-4 border-slate-100 shadow-md transition-transform group-hover:scale-105 duration-200"
                        />
                        <p className="text-xs font-bold text-slate-700 mt-4">Foto terpilih</p>
                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center justify-center gap-1 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-emerald-500" /> Siap diunggah
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 cursor-pointer w-full h-full relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3 group-hover:scale-110 transition-transform duration-150">
                          <Camera className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">Pilih atau Seret Foto</p>
                        <p className="text-[10px] text-slate-400 mt-1">Mendukung format PNG, JPG, JPEG</p>
                      </div>
                    )}
                  </div>
                  {photoError && (
                    <p className="text-xs font-medium text-red-600 text-center animate-in fade-in duration-150">
                      {photoError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Simpan Data Pembudidaya
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
                  <Download className="w-5 h-5 text-blue-600 animate-pulse" />
                  Langkah 1: Unduh Template Excel Resmi
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Gunakan template resmi kami yang telah terintegrasi dengan opsi pilihan resmi Kecamatan & Desa di Karawang untuk memastikan keakuratan pelaporan.
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
                <div className="p-4 bg-blue-50 text-blue-600 rounded-full shadow-sm">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-700 text-sm">Langkah 2: Pilih atau Drop File Excel yang Sudah Diisi</p>
                  <p className="text-xs text-slate-400 mt-1">Mendukung format spreadsheet (.xlsx, .xls)</p>
                </div>
              </div>
            </div>

            {/* Analysis & Upload Control */}
            {importResults && (
              <div className="space-y-5 border border-slate-200 rounded-2xl p-6 bg-white shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Hasil Analisis File Excel</h4>
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

                {/* Validation errors */}
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

                {/* Confirm upload buttons */}
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
                    Simpan {importResults.valid.length} Data Pembudidaya ke Server
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

function InputGroup({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (v: string) => void, type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700"
        required
      />
    </div>
  );
}
