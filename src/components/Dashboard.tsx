import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { LogisticsEntry, Farmer, WEEKS, LOCATIONS } from '../types';
import { FISH_PRICES } from '../constants';
import { TrendingUp, TrendingDown, Package, ArrowUpRight, ArrowDownRight, Activity, Users, Coins } from 'lucide-react';
import { cn } from '../lib/utils';

interface DashboardProps {
  entries: LogisticsEntry[];
  farmers: Farmer[];
}

export default function Dashboard({ entries, farmers }: DashboardProps) {
  const [selectedLocation, setSelectedLocation] = useState<'Semua' | 'Cipule' | 'Mekarbuana'>('Semua');

  // Helper to calculate PAD for an entry
  const calculatePAD = (entry: LogisticsEntry) => {
    if (entry.type !== 'Penjualan') return 0;
    const price = FISH_PRICES[entry.commodity]?.[entry.size] || 0;
    return entry.quantity * price;
  };

  // Calculate stats
  const totalIn = entries.filter(e => e.flow === 'Masuk').reduce((acc, curr) => acc + curr.quantity, 0);
  const totalOut = entries.filter(e => e.flow === 'Keluar').reduce((acc, curr) => acc + curr.quantity, 0);
  const currentStock = totalIn - totalOut;
  const totalFarmers = farmers.length;
  const totalPAD = entries.reduce((acc, curr) => acc + calculatePAD(curr), 0);

  // Weekly Flow Data (Inflow vs Outflow) - Cumulative Calculation per Location
  const cumulativeData = LOCATIONS.reduce((acc, loc) => {
    acc[loc] = { in: 0, out: 0 };
    return acc;
  }, {} as Record<string, { in: number, out: number }>);

  const weeklyFlowData = WEEKS.map(week => {
    const weekEntries = entries.filter(e => e.month === week);
    const result: any = { name: week };
    
    LOCATIONS.forEach(loc => {
      const locEntries = weekEntries.filter(e => e.location === loc);
      const locIn = locEntries.filter(e => e.flow === 'Masuk').reduce((acc, curr) => acc + curr.quantity, 0);
      const locOut = locEntries.filter(e => e.flow === 'Keluar').reduce((acc, curr) => acc + curr.quantity, 0);
      
      cumulativeData[loc].in += locIn;
      cumulativeData[loc].out += locOut;
      
      result[`${loc}_In`] = cumulativeData[loc].in;
      result[`${loc}_Out`] = cumulativeData[loc].out;
      result[`${loc}_WeeklyIn`] = locIn;
      result[`${loc}_WeeklyOut`] = locOut;
    });

    return result;
  });

  // Weekly Outflow Data (Penjualan & Hibah) & PAD
  const weeklyData = WEEKS.map(week => {
    const weekEntries = entries.filter(e => e.month === week);
    return {
      name: week,
      Produksi: weekEntries.filter(e => e.type === 'Produksi' || e.type === 'Penyetokan Ulang').reduce((acc, curr) => acc + curr.quantity, 0),
      Penjualan: weekEntries.filter(e => e.type === 'Penjualan').reduce((acc, curr) => acc + curr.quantity, 0),
      Hibah: weekEntries.filter(e => e.type === 'Hibah').reduce((acc, curr) => acc + curr.quantity, 0),
      Kematian: weekEntries.filter(e => e.type === 'Kematian Ikan').reduce((acc, curr) => acc + curr.quantity, 0),
      PAD_Cipule: weekEntries.filter(e => e.location === 'Cipule').reduce((acc, curr) => acc + calculatePAD(curr), 0),
      PAD_Mekarbuana: weekEntries.filter(e => e.location === 'Mekarbuana').reduce((acc, curr) => acc + calculatePAD(curr), 0),
    };
  });

  // Location Comparison Data
  const locationData = LOCATIONS.map(loc => {
    const locEntries = entries.filter(e => e.location === loc);
    return {
      name: loc,
      Produksi: locEntries.filter(e => e.type === 'Produksi' || e.type === 'Penyetokan Ulang').reduce((acc, curr) => acc + curr.quantity, 0),
      Pengeluaran: locEntries.filter(e => e.type === 'Penjualan' || e.type === 'Hibah' || e.type === 'Kematian Ikan').reduce((acc, curr) => acc + curr.quantity, 0),
      PAD: locEntries.reduce((acc, curr) => acc + calculatePAD(curr), 0),
    };
  });

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Total Arus Masuk" 
          value={totalIn} 
          icon={ArrowUpRight} 
          color="text-green-600" 
          bgColor="bg-green-50" 
          subtitle="Produksi + Penyetokan"
        />
        <StatCard 
          title="Total Arus Keluar" 
          value={totalOut} 
          icon={ArrowDownRight} 
          color="text-orange-600" 
          bgColor="bg-orange-50" 
          subtitle="Penjualan + Hibah + Kematian"
        />
        <StatCard 
          title="Stok Akhir" 
          value={currentStock} 
          icon={Package} 
          color="text-blue-600" 
          bgColor="bg-blue-50" 
          subtitle="Saldo Berjalan"
        />
        <StatCard 
          title="Total PAD" 
          value={`Rp ${totalPAD.toLocaleString()}`} 
          icon={Coins} 
          color="text-yellow-600" 
          bgColor="bg-yellow-50" 
          subtitle="Pendapatan Asli Daerah"
        />
        <StatCard 
          title="Total Pembudidaya" 
          value={totalFarmers} 
          icon={Users} 
          color="text-purple-600" 
          bgColor="bg-purple-50" 
          subtitle="Penerima Bibit"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly PAD Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              Estimasi Pendapatan Asli Daerah (PAD) Mingguan
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string) => [`Rp ${value.toLocaleString()}`, name.replace('PAD_', 'PAD ')]}
                />
                <Legend iconType="circle" />
                <Bar dataKey="PAD_Cipule" name="BBI Cipule" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PAD_Mekarbuana" name="BBI Mekarbuana" fill="#4ade80" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Monthly Inflow vs Outflow Line Chart (Cumulative) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Kurva Komulatif Pemasukan vs Pengeluaran
            </h3>
            
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['Semua', 'Cipule', 'Mekarbuana'] as const).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setSelectedLocation(loc)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                    selectedLocation === loc 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {loc === 'Semua' ? 'Semua Lokasi' : `BBI ${loc}`}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [value.toLocaleString(), '']}
                />
                <Legend iconType="circle" />
                {(selectedLocation === 'Semua' || selectedLocation === 'Cipule') && (
                  <>
                    <Line 
                      type="monotone" 
                      dataKey="Cipule_In" 
                      name="Cipule: Komulatif Masuk"
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#10b981' }} 
                      activeDot={{ r: 6 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Cipule_Out" 
                      name="Cipule: Komulatif Keluar"
                      stroke="#ef4444" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#ef4444' }} 
                      activeDot={{ r: 6 }} 
                    />
                  </>
                )}
                {(selectedLocation === 'Semua' || selectedLocation === 'Mekarbuana') && (
                  <>
                    <Line 
                      type="monotone" 
                      dataKey="Mekarbuana_In" 
                      name="Mekarbuana: Komulatif Masuk"
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#3b82f6' }} 
                      activeDot={{ r: 6 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Mekarbuana_Out" 
                      name="Mekarbuana: Komulatif Keluar"
                      stroke="#f59e0b" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#f59e0b' }} 
                      activeDot={{ r: 6 }} 
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Table */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider" rowSpan={2}>Minggu</th>
                  {(selectedLocation === 'Semua' || selectedLocation === 'Cipule') && (
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-center border-l border-slate-200" colSpan={3}>BBI Cipule</th>
                  )}
                  {(selectedLocation === 'Semua' || selectedLocation === 'Mekarbuana') && (
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-center border-l border-slate-200" colSpan={3}>BBI Mekarbuana</th>
                  )}
                </tr>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {(selectedLocation === 'Semua' || selectedLocation === 'Cipule') && (
                    <>
                      <th className="px-4 py-2 font-bold text-slate-500 text-right border-l border-slate-200">K. Masuk</th>
                      <th className="px-4 py-2 font-bold text-slate-500 text-right">K. Keluar</th>
                      <th className="px-4 py-2 font-bold text-slate-500 text-right">Stok</th>
                    </>
                  )}
                  {(selectedLocation === 'Semua' || selectedLocation === 'Mekarbuana') && (
                    <>
                      <th className="px-4 py-2 font-bold text-slate-500 text-right border-l border-slate-200">K. Masuk</th>
                      <th className="px-4 py-2 font-bold text-slate-500 text-right">K. Keluar</th>
                      <th className="px-4 py-2 font-bold text-slate-500 text-right">Stok</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {weeklyFlowData.filter((d, i) => {
                  const hasData = LOCATIONS.some(loc => d[`${loc}_WeeklyIn`] > 0 || d[`${loc}_WeeklyOut`] > 0);
                  const prevHadData = i > 0 && LOCATIONS.some(loc => weeklyFlowData[i-1][`${loc}_In`] > 0 || weeklyFlowData[i-1][`${loc}_Out`] > 0);
                  return hasData || prevHadData;
                }).map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{row.name}</td>
                    {/* Cipule */}
                    {(selectedLocation === 'Semua' || selectedLocation === 'Cipule') && (
                      <>
                        <td className="px-4 py-3 text-right text-green-600 font-semibold border-l border-slate-100">{row.Cipule_In.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-red-600 font-semibold">{row.Cipule_Out.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600">{(row.Cipule_In - row.Cipule_Out).toLocaleString()}</td>
                      </>
                    )}
                    {/* Mekarbuana */}
                    {(selectedLocation === 'Semua' || selectedLocation === 'Mekarbuana') && (
                      <>
                        <td className="px-4 py-3 text-right text-green-600 font-semibold border-l border-slate-100">{row.Mekarbuana_In.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-red-600 font-semibold">{row.Mekarbuana_Out.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600">{(row.Mekarbuana_In - row.Mekarbuana_Out).toLocaleString()}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Activity Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Tren Produksi & Pengeluaran Mingguan
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Produksi" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Penjualan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Hibah" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Kematian" name="Kematian Ikan" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Location Comparison Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Produktivitas per Lokasi
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Produksi" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor, subtitle }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h4 className="text-3xl font-bold text-slate-900 mt-1">{value.toLocaleString()}</h4>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </div>
      <div className={cn("p-3 rounded-xl", bgColor)}>
        <Icon className={cn("w-6 h-6", color)} />
      </div>
    </div>
  );
}
