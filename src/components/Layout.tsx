import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Fish,
  Users,
  Map as MapIcon,
  UserPlus,
  Droplets,
  Activity,
  Wind,
  Home as HomeIcon,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getClientUserRole } from '../services/userService';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'home' | 'dashboard' | 'input' | 'history' | 'farmer-input' | 'farmer-list' | 'farmer-map' | 'tpi-input' | 'tpi-list' | 'tpi-map' | 'ph-dashboard' | 'ph-input' | 'ph-history' | 'oxygen-input' | 'oxygen-history';
  setActiveTab: (tab: 'home' | 'dashboard' | 'input' | 'history' | 'farmer-input' | 'farmer-list' | 'farmer-map' | 'tpi-input' | 'tpi-list' | 'tpi-map' | 'ph-dashboard' | 'ph-input' | 'ph-history' | 'oxygen-input' | 'oxygen-history') => void;
  userEmail?: string | null;
  onLogout?: () => void;
}

export default function Layout({ children, activeTab, setActiveTab, userEmail, onLogout }: LayoutProps) {
  const isAdmin = getClientUserRole() === 'admin';
  const navItems = [
    { id: 'home', label: 'Beranda Utama', icon: HomeIcon, group: 'Utama' },
    ...(isAdmin ? [{ id: 'input', label: 'Input Logistik', icon: PlusCircle, group: 'Logistik' } as const] : []),
    { id: 'history', label: 'Riwayat Logistik', icon: History, group: 'Logistik' },
    ...(isAdmin ? [{ id: 'ph-input', label: 'Input pH Air', icon: Droplets, group: 'pH Air' } as const] : []),
    { id: 'ph-history', label: 'Riwayat pH Air', icon: History, group: 'pH Air' },
    ...(isAdmin ? [{ id: 'oxygen-input', label: 'Input Oksigen Air', icon: Wind, group: 'Kadar Oksigen' } as const] : []),
    { id: 'oxygen-history', label: 'Riwayat Oksigen', icon: History, group: 'Kadar Oksigen' },
    ...(isAdmin ? [{ id: 'farmer-input', label: 'Input Pembudidaya', icon: UserPlus, group: 'Pembudidaya' } as const] : []),
    { id: 'farmer-list', label: 'Daftar Pembudidaya', icon: Users, group: 'Pembudidaya' },
    { id: 'farmer-map', label: 'Peta Lokasi', icon: MapIcon, group: 'Pembudidaya' },
    ...(isAdmin ? [{ id: 'tpi-input', label: 'Input TPI', icon: PlusCircle, group: 'Lokasi TPI' } as const] : []),
    { id: 'tpi-list', label: 'Daftar TPI', icon: Users, group: 'Lokasi TPI' },
    { id: 'tpi-map', label: 'Peta TPI', icon: MapIcon, group: 'Lokasi TPI' },
  ] as const;

  const groups = ['Utama', 'Logistik', 'pH Air', 'Kadar Oksigen', 'Pembudidaya', 'Lokasi TPI'] as const;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Fish className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-xl text-slate-800 tracking-tight">Siddat BBI</h1>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {groups.map(group => (
            <div key={group} className="space-y-2">
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group}</p>
              {navItems.filter(item => item.group === group).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    activeTab === item.id 
                      ? "bg-blue-50 text-blue-700 font-semibold shadow-sm" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4 transition-colors",
                    activeTab === item.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="px-4 py-3 bg-slate-50 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sesi Aktif</p>
            <p className="text-sm font-bold text-slate-700 truncate mt-1">{userEmail || 'Tamu BBI Siddat'}</p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 transition-colors font-bold rounded-xl text-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar Sesi
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-6xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
