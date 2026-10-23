import React, { useEffect, useState } from 'react';
import { PageView } from '../types';
import {
  Activity,
  PlusCircle,
  LayoutDashboard,
  FolderOpen,
  Wifi,
  WifiOff,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { SkinLensApi } from '../services/api';
import { Button } from './Button';

interface NavbarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  onNewScreening: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onNewScreening,
}) => {
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkConn = async () => {
      const ok = await SkinLensApi.checkBackendConnection();
      if (mounted) setIsBackendConnected(ok);
    };
    checkConn();
    const interval = setInterval(checkConn, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-3 group text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-teal-800 bg-clip-text text-transparent">
                    SkinLens
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                    MVP
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 leading-none">
                  Explainable AI Lesion Screening
                </p>
              </div>
            </button>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  currentPage === 'dashboard'
                    ? 'bg-slate-100 text-teal-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>

              <button
                onClick={() => onNavigate('cases')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  currentPage === 'cases' || currentPage === 'case-details'
                    ? 'bg-slate-100 text-teal-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                Cases & Reviews
              </button>
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Backend Connectivity Status */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border font-medium transition-all ${
                isBackendConnected === true
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isBackendConnected === false
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
              title={
                isBackendConnected
                  ? 'FastAPI Backend Live on port 8000'
                  : 'Backend offline, running in interactive client demo mode'
              }
            >
              {isBackendConnected === true ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>API Online</span>
                </>
              ) : isBackendConnected === false ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Demo Mode</span>
                </>
              ) : (
                <span>Checking...</span>
              )}
            </div>

            {/* Primary Action Button: New Screening */}
            <Button
              onClick={onNewScreening}
              variant="primary"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md shadow-teal-600/20"
            >
              New Screening
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
