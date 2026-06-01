import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInAnonymously, 
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
import Login from './components/Login';
import { Loader2 } from 'lucide-react';
import { setClientUserRole, setDiscoveredTargetUserId } from './services/userService';

interface CustomUser {
  username: string;
  role: 'admin' | 'guest';
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [customUser, setCustomUser] = useState<CustomUser | null>(() => {
    try {
      const saved = localStorage.getItem('siddat_login_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'input' | 'history' | 'farmer-input' | 'farmer-list' | 'farmer-map' | 'tpi-input' | 'tpi-list' | 'tpi-map' | 'ph-dashboard' | 'ph-input' | 'ph-history' | 'oxygen-input' | 'oxygen-history'>('home');
  const [entries, setEntries] = useState<LogisticsEntry[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [tpiList, setTpiList] = useState<Tpi[]>([]);
  const [phRecords, setPhRecords] = useState<PHRecord[]>([]);
  const [oxygenRecords, setOxygenRecords] = useState<OxygenRecord[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        // Automatically attempt to sign in anonymously
        signInAnonymously(auth)
          .then((cred) => {
            setUser(cred.user);
            setLoading(false);
          })
          .catch((error) => {
            console.warn('Anonymous login failed. Falling back to local guest user.', error);
            // Fallback user state so the UI functions directly even if Firebase Auth has anonymous disabled
            setUser({
              uid: 'guest_bbi_user',
              email: 'guest@siddatbbi.com',
              displayName: 'Tamu BBI',
              emailVerified: false,
              isAnonymous: true,
            } as any);
            setLoading(false);
          });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user && customUser) {
      setClientUserRole(customUser.role);
    }
  }, [user, customUser]);

  useEffect(() => {
    if (user) {
      const unsubscribeLogistics = subscribeToLogistics((data) => {
        const normalized = data.map(e => ({
          ...e,
          flow: e.flow || (e.type === 'Produksi' || e.type === 'Penyetokan Ulang' ? 'Masuk' : 'Keluar') as any
        }));
        setEntries(normalized);
        if (customUser?.role === 'admin' && data.length > 0) {
          const found = data.find(el => el.userId && el.userId !== user.uid);
          if (found?.userId) {
            setDiscoveredTargetUserId(found.userId);
          }
        }
      });
      const unsubscribeFarmers = subscribeToFarmers((data) => {
        setFarmers(data);
        if (customUser?.role === 'admin' && data.length > 0) {
          const found = data.find(el => el.userId && el.userId !== user.uid);
          if (found?.userId) {
            setDiscoveredTargetUserId(found.userId);
          }
        }
      });
      const unsubscribeTpi = subscribeToTpi((data) => {
        setTpiList(data);
        if (customUser?.role === 'admin' && data.length > 0) {
          const found = data.find(el => el.userId && el.userId !== user.uid);
          if (found?.userId) {
            setDiscoveredTargetUserId(found.userId);
          }
        }
      });
      const unsubscribePH = subscribeToPHRecords((data) => {
        setPhRecords(data);
        if (customUser?.role === 'admin' && data.length > 0) {
          const found = data.find(el => el.userId && el.userId !== user.uid);
          if (found?.userId) {
            setDiscoveredTargetUserId(found.userId);
          }
        }
      });
      const unsubscribeOxygen = subscribeToOxygenRecords((data) => {
        setOxygenRecords(data);
        if (customUser?.role === 'admin' && data.length > 0) {
          const found = data.find(el => el.userId && el.userId !== user.uid);
          if (found?.userId) {
            setDiscoveredTargetUserId(found.userId);
          }
        }
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
  }, [user, customUser]);

  const handleLoginSuccess = (username: string, role: 'admin' | 'guest') => {
    const userObj: CustomUser = { username, role };
    localStorage.setItem('siddat_login_user', JSON.stringify(userObj));
    setCustomUser(userObj);
  };

  const handleLogout = () => {
    localStorage.removeItem('siddat_login_user');
    setCustomUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!customUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const userDisplayName = customUser.role === 'admin' 
    ? 'Administrator (admin)' 
    : 'Tamu Kunjungan (guest)';

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      userEmail={userDisplayName}
      onLogout={handleLogout}
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
