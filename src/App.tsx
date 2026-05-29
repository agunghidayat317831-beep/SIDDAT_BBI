import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { auth } from './firebase';
import { LogisticsEntry, Farmer, Tpi, PHRecord, OxygenRecord } from './types';
import { subscribeToLogistics } from './services/logisticsService';
import { subscribeToFarmers } from './services/farmerService';
import { subscribeToTpi } from './services/tpiService';
import { subscribeToPHRecords } from './services/phService';
import { subscribeToOxygenRecords } from './services/oxygenService';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LogisticsForm from './components/LogisticsForm';
import HistoryTable from './components/HistoryTable';
import FarmerForm from './components/FarmerForm';
import FarmerList from './components/FarmerList';
import FarmerMap from './components/FarmerMap';
import TpiForm from './components/TpiForm';
import TpiList from './components/TpiList';
import TpiMap from './components/TpiMap';
import PHDashboard from './components/PHDashboard';
import PHForm from './components/PHForm';
import PHList from './components/PHList';
import OxygenForm from './components/OxygenForm';
import OxygenList from './components/OxygenList';
import Home from './components/Home';
import { Loader2, Fish, LogIn } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'input' | 'history' | 'farmer-input' | 'farmer-list' | 'farmer-map' | 'tpi-input' | 'tpi-list' | 'tpi-map' | 'ph-dashboard' | 'ph-input' | 'ph-history' | 'oxygen-input' | 'oxygen-history'>('home');
  const [entries, setEntries] = useState<LogisticsEntry[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [tpiList, setTpiList] = useState<Tpi[]>([]);
  const [phRecords, setPhRecords] = useState<PHRecord[]>([]);
  const [oxygenRecords, setOxygenRecords] = useState<OxygenRecord[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribeLogistics = subscribeToLogistics((data) => {
        const normalized = data.map(e => ({
          ...e,
          flow: e.flow || (e.type === 'Produksi' || e.type === 'Penyetokan Ulang' ? 'Masuk' : 'Keluar') as any
        }));
        setEntries(normalized);
      });
      const unsubscribeFarmers = subscribeToFarmers((data) => {
        setFarmers(data);
      });
      const unsubscribeTpi = subscribeToTpi((data) => {
        setTpiList(data);
      });
      const unsubscribePH = subscribeToPHRecords((data) => {
        setPhRecords(data);
      });
      const unsubscribeOxygen = subscribeToOxygenRecords((data) => {
        setOxygenRecords(data);
      });
      return () => {
        unsubscribeLogistics();
        unsubscribeFarmers();
        unsubscribeTpi();
        unsubscribePH();
        unsubscribeOxygen();
      };
    } else {
      setEntries([]);
      setFarmers([]);
      setTpiList([]);
      setPhRecords([]);
      setOxygenRecords([]);
    }
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login Error:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-blue-100 p-8 border border-slate-100 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <Fish className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Siddat BBI</h1>
          <p className="text-slate-500 mb-8">Sistem Pencatatan Logistik Ikan Terpadu BBI Cipule & Mekarbuana.</p>
          
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 group"
          >
            <LogIn className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
            Masuk dengan Google
          </button>
          
          <p className="mt-6 text-xs text-slate-400">
            Gunakan akun Google Anda untuk mengakses dashboard logistik.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onLogout={handleLogout}
      userEmail={user.email}
    >
      {activeTab === 'home' && <Home entries={entries} farmers={farmers} phRecords={phRecords} oxygenRecords={oxygenRecords} />}
      {activeTab === 'dashboard' && <Dashboard entries={entries} farmers={farmers} />}
      {activeTab === 'input' && <LogisticsForm />}
      {activeTab === 'history' && <HistoryTable entries={entries} />}
      {activeTab === 'farmer-input' && <FarmerForm />}
      {activeTab === 'farmer-list' && <FarmerList farmers={farmers} />}
      {activeTab === 'farmer-map' && <FarmerMap farmers={farmers} />}
      {activeTab === 'tpi-input' && <TpiForm />}
      {activeTab === 'tpi-list' && <TpiList tpiList={tpiList} />}
      {activeTab === 'tpi-map' && <TpiMap tpiList={tpiList} />}
      {activeTab === 'ph-dashboard' && <PHDashboard records={phRecords} />}
      {activeTab === 'ph-input' && <PHForm />}
      {activeTab === 'ph-history' && <PHList records={phRecords} />}
      {activeTab === 'oxygen-input' && <OxygenForm />}
      {activeTab === 'oxygen-history' && <OxygenList records={oxygenRecords} />}
    </Layout>
  );
}
