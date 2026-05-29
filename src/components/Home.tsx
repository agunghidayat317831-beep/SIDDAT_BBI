import React, { useState } from 'react';
import Dashboard from './Dashboard';
import PHDashboard from './PHDashboard';
import OxygenDashboard from './OxygenDashboard';
import { LogisticsEntry, Farmer, PHRecord, OxygenRecord, WEEKS } from '../types';
import { FISH_PRICES } from '../constants';
import { 
  Home as HomeIcon,
  Package, 
  Coins, 
  Droplets, 
  Wind, 
  Activity, 
  ChevronRight, 
  Sparkles,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';

interface HomeProps {
  entries: LogisticsEntry[];
  farmers: Farmer[];
  phRecords: PHRecord[];
  oxygenRecords: OxygenRecord[];
}

export default function Home({ entries, farmers, phRecords, oxygenRecords }: HomeProps) {
  const [innerTab, setInnerTab] = useState<'logistik' | 'ph' | 'oksigen'>('logistik');

  // Logistics calculations
  const totalIn = entries.filter(e => e.flow === 'Masuk').reduce((acc, curr) => acc + curr.quantity, 0);
  const totalOut = entries.filter(e => e.flow === 'Keluar').reduce((acc, curr) => acc + curr.quantity, 0);
  const currentStock = totalIn - totalOut;
  const totalPAD = entries.reduce((acc, curr) => {
    if (curr.type !== 'Penjualan') return acc;
    const price = FISH_PRICES[curr.commodity]?.[curr.size] || 0;
    return acc + (curr.quantity * price);
  }, 0);

  // pH calculation
  const latestPH = phRecords.length > 0 
    ? [...phRecords].sort((a, b) => {
        const idxA = WEEKS.indexOf(a.week);
        const idxB = WEEKS.indexOf(b.week);
        if (idxB !== idxA) return idxB - idxA;
        return b.createdAt - a.createdAt;
      })[0] 
    : null;
  
  const getPHStatus = (val: number) => {
    if (val < 6.5) return { label: 'Asam', color: 'text-red-600 bg-red-50 border-red-100' };
    if (val > 8.5) return { label: 'Basa', color: 'text-purple-600 bg-purple-50 border-purple-100' };
    return { label: 'Optimal', color: 'text-green-600 bg-green-50 border-green-100' };
  };

  // Oxygen calculation
  const latestOxygen = oxygenRecords.length > 0 
    ? [...oxygenRecords].sort((a, b) => {
        const idxA = WEEKS.indexOf(a.week);
        const idxB = WEEKS.indexOf(b.week);
        if (idxB !== idxA) return idxB - idxA;
        return b.createdAt - a.createdAt;
      })[0] 
    : null;

  const getOxygenStatus = (val: number) => {
    if (val < 4.0) return { label: 'Kritis (Rendah)', color: 'text-red-600 bg-red-50 border-red-100' };
    if (val > 9.0) return { label: 'Sangat Tinggi', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
    return { label: 'Optimal', color: 'text-sky-600 bg-sky-50 border-sky-100' };
  };

  const phStatus = latestPH ? getPHStatus(latestPH.phValue) : null;
  const oxygenStatus = latestOxygen ? getOxygenStatus(latestOxygen.oxygenValue) : null;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 text-white rounded-2xl p-6 md:p-8 overflow-hidden shadow-lg shadow-blue-100">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute left-1/3 bottom-0 translate-y-12 w-48 h-48 bg-sky-500/20 rounded-full blur-xl"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Sistem Pemantauan Terpadu BBI
            </div>
            <h1 className="text-2xl md:text-3.5xl font-extrabold tracking-tight">Selamat Datang di Beranda Utama</h1>
            <p className="text-blue-100 text-sm max-w-xl">
              Pantau seluruh aktivitas pembenihan ikan, logistik benih, kualitas pH air kolam, hingga kadar oksigen terlarut (DO) dalam satu pintu secara real-time.
            </p>
          </div>
          
          <div className="flex bg-white/15 backdrop-blur-sm p-4 rounded-2xl border border-white/10 items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl">
              <HomeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Status BBI</p>
              <p className="text-sm font-extrabold text-white">Karawang Terpantau Baik</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards of the 3 Domains */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Logistics Summary */}
        <div 
          onClick={() => setInnerTab('logistik')}
          className={cn(
            "group bg-white p-6 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden",
            innerTab === 'logistik' ? "border-blue-500 ring-2 ring-blue-500/10 shadow-md" : "border-slate-200 hover:border-blue-300 hover:shadow-sm"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl inline-block">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logistik & Distribusi</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{currentStock.toLocaleString()} <span className="text-xs font-normal text-slate-400">Ekor Benih</span></h3>
              </div>
            </div>
            <button className="p-1 px-2.5 bg-slate-50 text-slate-400 font-bold text-[10px] rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-all flex items-center gap-0.5">
              Detail <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Estimasi PAD:</span>
            <span className="font-extrabold text-blue-600 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-yellow-500" />
              Rp {totalPAD.toLocaleString()}
            </span>
          </div>
        </div>

        {/* pH Air Summary */}
        <div 
          onClick={() => setInnerTab('ph')}
          className={cn(
            "group bg-white p-6 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden",
            innerTab === 'ph' ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-md" : "border-slate-200 hover:border-emerald-300 hover:shadow-sm"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl inline-block">
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Indikator pH Air</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {latestPH ? latestPH.phValue.toFixed(1) : '-'} <span className="text-xs font-normal text-slate-400">pH</span>
                </h3>
              </div>
            </div>
            <button className="p-1 px-2.5 bg-slate-50 text-slate-400 font-bold text-[10px] rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all flex items-center gap-0.5">
              Detail <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Status Pengamatan Terakhir:</span>
            {phStatus ? (
              <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border", phStatus.color)}>
                {phStatus.label}
              </span>
            ) : <span className="text-slate-400">-</span>}
          </div>
        </div>

        {/* Oxygen DO Summary */}
        <div 
          onClick={() => setInnerTab('oksigen')}
          className={cn(
            "group bg-white p-6 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden",
            innerTab === 'oksigen' ? "border-sky-500 ring-2 ring-sky-500/10 shadow-md" : "border-slate-200 hover:border-sky-300 hover:shadow-sm"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="p-2.5 bg-sky-50 text-sky-500 rounded-xl inline-block">
                <Wind className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kadar Oksigen (DO)</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {latestOxygen ? `${latestOxygen.oxygenValue.toFixed(2)}` : '-'} <span className="text-xs font-normal text-slate-400">mg/L</span>
                </h3>
              </div>
            </div>
            <button className="p-1 px-2.5 bg-slate-50 text-slate-400 font-bold text-[10px] rounded-lg group-hover:bg-sky-50 group-hover:text-sky-600 transition-all flex items-center gap-0.5">
              Detail <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Status Oksigen Terakhir:</span>
            {oxygenStatus ? (
              <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border", oxygenStatus.color)}>
                {oxygenStatus.label}
              </span>
            ) : <span className="text-slate-400">-</span>}
          </div>
        </div>
      </div>

      {/* Main Interactive Dashboard Viewport */}
      <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Visualisasi & Analitik Detail
            </h2>
            <p className="text-xs text-slate-500">Pilih salah satu modul di bawah ini untuk melihat grafik tren dan data analitik secara mendalam.</p>
          </div>

          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
            <button
              onClick={() => setInnerTab('logistik')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5",
                innerTab === 'logistik' ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Package className="w-4 h-4" />
              Logistik
            </button>
            <button
              onClick={() => setInnerTab('ph')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5",
                innerTab === 'ph' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Droplets className="w-4 h-4" />
              pH Air
            </button>
            <button
              onClick={() => setInnerTab('oksigen')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5",
                innerTab === 'oksigen' ? "bg-sky-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Wind className="w-4 h-4" />
              Kadar Oksigen
            </button>
          </div>
        </div>

        {/* Dashboard Viewer box */}
        <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-1">
          {innerTab === 'logistik' && <Dashboard entries={entries} farmers={farmers} />}
          {innerTab === 'ph' && <PHDashboard records={phRecords} />}
          {innerTab === 'oksigen' && <OxygenDashboard records={oxygenRecords} />}
        </div>
      </div>
    </div>
  );
}
