import { useEffect, useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { getActiveCaffeine, getFDI, getTapering } from './services/api.js';
import { IntakeModal } from './components/IntakeModal.js';
import { CheckinModal } from './components/CheckinModal.js';
import { ActiveCaffeineCard } from './components/ActiveCaffeineCard.js';
import { TamperingCard } from './components/TamperingCard.js';
import { DecayChart } from './components/DecayChart.js';
import type { ChartPoint } from './components/DecayChart.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function App() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(() => {
    const saved = localStorage.getItem('cofdbt_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeData, setActiveData] = useState<any>(null);
  const [fdiData, setFdiData] = useState<any>(null);
  const [taperData, setTaperData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetch('http://localhost:4000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('cofdbt_user', JSON.stringify(data.user));
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login request error:', err);
      alert('Could not connect to the server.');
    }
  };

  const loadDashboardData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [activeRes, fdiRes, taperRes] = await Promise.all([
        getActiveCaffeine(user.id),
        getFDI(user.id),
        getTapering(user.id)
      ]);

      setActiveData(activeRes);
      setFdiData(fdiRes);
      setTaperData(taperRes);

      const todayStr = new Date().toISOString().split('T')[0];
      if (fdiRes?.latest_checkin_date === todayStr) {
        setHasCheckedInToday(true);
      }

      if (activeRes?.current_active_caffeine_mg !== undefined) {
        generateDecayPoints(activeRes.current_active_caffeine_mg, activeRes.half_life_used_hours || 5.0);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateDecayPoints = (initialMg: number, halfLifeHours: number) => {
    const points: ChartPoint[] = [];
    const now = new Date();

    for (let h = 0; h <= 12; h += 2) {
      const timeLabel = new Date(now.getTime() + h * 3600000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      const projectedMg = Math.round(initialMg * Math.pow(0.5, h / halfLifeHours));
      points.push({ time: timeLabel, caffeine_mg: projectedMg });
    }
    setChartData(points);
  };

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user]);

  if (!user) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
          <div className="bg-white border-2 border-black rounded-2xl p-8 shadow-sm max-w-md w-full text-center space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-black flex items-center justify-center gap-2">
              cofdbt
              <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-mono font-bold">
                v1.0
              </span>
            </h1>
            <p className="text-xs text-zinc-500 font-medium tracking-wide">Coffee, Do, Sleep</p>
            <div className="flex justify-center pt-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.log('Login Failed')}
              />
            </div>
          </div>
        </div>
      </GoogleOAuthProvider>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 font-sans flex flex-col justify-between">
      
      <header className="max-w-6xl w-full mx-auto flex flex-wrap justify-between items-center pb-3 border-b border-zinc-200 mb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black flex items-center gap-2">
            <img 
              src="/favicon.png" 
              alt="cofdbt logo" 
              className="w-6 h-6 rounded-md object-contain border border-zinc-300" 
            />
            cofdbt 
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-mono font-bold">
              v1.0
            </span>
          </h1>
          <p className="text-[11px] text-zinc-500 font-medium tracking-wide mt-0.5">
            Signed in as <span className="text-black font-semibold">{user.email}</span>
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button 
            type="button"
            onClick={() => setIsLogModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition shadow-sm cursor-pointer"
            title="Add a coffee, tea, or energy drink"
          >
            + Log Coffee
          </button>
          <button 
            type="button"
            disabled={hasCheckedInToday}
            onClick={() => setIsCheckinModalOpen(true)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              hasCheckedInToday 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 opacity-80 cursor-not-allowed' 
                : 'bg-black text-white hover:bg-zinc-800 shadow-sm cursor-pointer'
            }`}
            title={hasCheckedInToday ? "You have already completed today's check-in" : "Log last night's sleep and today's work stress"}
          >
            {hasCheckedInToday ? '✓ Checked In Today' : '+ Daily Check-In'}
          </button>
          <button 
            type="button"
            onClick={loadDashboardData}
            className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg transition shadow-sm cursor-pointer"
          >
            Refresh
          </button>
          <button 
            type="button"
            onClick={() => {
              localStorage.removeItem('cofdbt_user');
              setUser(null);
            }}
            className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg transition shadow-sm cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </header>

      <div className="max-w-6xl w-full mx-auto space-y-4 my-auto">
        
        <main className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ActiveCaffeineCard loading={loading} activeData={activeData} />

          <div className="bg-white border-2 border-black rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-orange-500 transition-colors">
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Your Energy Balance</h2>
              <div className="mt-2">
                <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wide font-mono ${
                  fdiData?.risk_tier === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-300' :
                  fdiData?.risk_tier === 'HIGH' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                  fdiData?.risk_tier === 'MODERATE' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {loading ? 'LOADING...' : fdiData?.risk_tier || 'LOW RISK'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">
                {loading ? 'Analyzing telemetry...' : fdiData?.recommendation || 'You are well-rested. Coffee intake is balanced.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-200 text-[11px] text-zinc-600 flex justify-between items-center">
              <span>Tiredness Score:</span>
              <span className="text-black font-bold font-mono text-xs">{fdiData?.fatigue_debt_index || 0}</span>
            </div>
          </div>

          <TamperingCard loading={loading} taperData={taperData} />
        </main>

        <DecayChart data={chartData} />

      </div>

      <div />

      <IntakeModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onLogSuccess={loadDashboardData}
        userId={user.id}
      />

      <CheckinModal
        isOpen={isCheckinModalOpen}
        onClose={() => setIsCheckinModalOpen(false)}
        onCheckinSuccess={() => {
          setHasCheckedInToday(true);
          loadDashboardData();
        }}
        userId={user.id}
      />

    </div>
  );
}