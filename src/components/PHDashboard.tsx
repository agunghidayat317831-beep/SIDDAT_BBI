import React from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ReferenceArea,
  Legend
} from 'recharts';
import { PHRecord, WEEKS } from '../types';
import { Droplets, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface PHDashboardProps {
  records: PHRecord[];
}

export default function PHDashboard({ records }: PHDashboardProps) {
  // Prep data for chart: map week string to numeric index for XAxis
  const chartData = records
    .sort((a, b) => WEEKS.indexOf(a.week) - WEEKS.indexOf(b.week))
    .map(r => ({
      week: r.week,
      weekIndex: WEEKS.indexOf(r.week) + 1,
      phValue: r.phValue,
      location: r.location
    }));

  const cipuleData = chartData.filter(d => d.location === 'Cipule');
  const mekarbuanaData = chartData.filter(d => d.location === 'Mekarbuana');

  const maxWeekIndex = chartData.length > 0
    ? Math.max(...chartData.map(d => d.weekIndex))
    : 10;

  const getPHColor = (val: number) => {
    if (val < 6.5) return "#ef4444"; // Red
    if (val > 8.5) return "#a855f7"; // Purple
    return "#22c55e"; // Green
  };

  const getLatestRecord = () => {
    if (records.length === 0) return null;
    return [...records].sort((a, b) => {
      const idxA = WEEKS.indexOf(a.week);
      const idxB = WEEKS.indexOf(b.week);
      if (idxB !== idxA) {
        return idxB - idxA;
      }
      return b.createdAt - a.createdAt;
    })[0];
  };

  const latest = getLatestRecord();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Status pH Terakhir</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-800">
                {latest ? latest.phValue.toFixed(1) : '-'}
              </p>
              <p className="text-xs text-slate-400 mt-1">{latest ? latest.week : 'Belum ada data'}</p>
            </div>
            {latest && (
              <div className={`p-2 rounded-xl ${
                latest.phValue < 6.5 ? 'bg-red-50 text-red-500' :
                latest.phValue > 8.5 ? 'bg-purple-50 text-purple-500' :
                'bg-green-50 text-green-500'
              }`}>
                {latest.phValue >= 6.5 && latest.phValue <= 8.5 ? (
                  <CheckCircle className="w-8 h-8" />
                ) : (
                  <AlertCircle className="w-8 h-8" />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Rentang Ideal</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-800">6.5 - 8.5</span>
            <div className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">
              Optimal
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 italic flex items-center gap-1">
            <Info className="w-3 h-3" />
            pH di luar rentang dapat memicu stres ikan.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Total Pengamatan</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-800">{records.length}</span>
            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
              <Droplets className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Data dikumpulkan mingguan.</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              Kurva Tren pH Air (XY Scatter)
            </h3>
            <p className="text-sm text-slate-500">Visualisasi fluktuasi pH air per minggu.</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div> Asam ({"<"}6.5)</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"></div> Ideal (6.5-8.5)</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Basa ({">"}8.5)</div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                type="number" 
                dataKey="weekIndex" 
                name="Minggu" 
                unit="" 
                domain={[1, maxWeekIndex]}
                allowDecimals={false}
                label={{ value: 'Minggu Ke-', position: 'insideBottomRight', offset: -10, fontSize: 12 }}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                type="number" 
                dataKey="phValue" 
                name="pH" 
                unit="" 
                domain={[0, 14]}
                label={{ value: 'Nilai pH', angle: -90, position: 'insideLeft', fontSize: 12 }}
                tick={{ fontSize: 11 }}
              />
              <ZAxis type="number" range={[60, 60]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xl text-white">
                        <p className="text-xs font-bold mb-1">{data.week}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.location === 'Cipule' ? '#3b82f6' : '#10b981' }}></div>
                          <span className="text-xl font-bold font-mono">{data.phValue.toFixed(1)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{data.location}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              {/* Background Zones */}
              {React.createElement(ReferenceArea as any, { 
                y1: 6.5, 
                y2: 8.5, 
                fill: "#22c55e", 
                fillOpacity: 0.05 
              })}
              
              {/* Threshold Lines */}
              <ReferenceLine y={6.5} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Asam', fill: '#ef4444', fontSize: 10 }} />
              <ReferenceLine y={8.5} stroke="#a855f7" strokeDasharray="3 3" label={{ position: 'right', value: 'Basa', fill: '#a855f7', fontSize: 10 }} />
              
              <Scatter name="BBI Cipule" data={cipuleData} fill="#3b82f6" line={{ stroke: '#3b82f6', strokeWidth: 3, type: 'monotone' }} shape="circle" />
              <Scatter name="BBI Mekarbuana" data={mekarbuanaData} fill="#10b981" line={{ stroke: '#10b981', strokeWidth: 3, type: 'monotone' }} shape="circle" />
              <Legend verticalAlign="top" height={36}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
