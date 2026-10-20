import React from 'react';

interface ActiveData {
  current_active_caffeine_mg?: number;
  half_life_used_hours?: number;
  active_logs_count?: number;
}

interface ActiveCaffeineCardProps {
  loading: boolean;
  activeData: ActiveData | null;
}

export function ActiveCaffeineCard({ loading, activeData }: ActiveCaffeineCardProps) {
  return (
    <div className="bg-white border-2 border-black rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-orange-500 transition-colors">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Caffeine Right Now</h2>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-black font-mono">
            {loading ? '...' : activeData?.current_active_caffeine_mg ?? 0}
          </span>
          <span className="text-base text-orange-600 font-bold">mg</span>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Fades naturally by about half every 5 hours.
        </p>
      </div>
      <div className="mt-4 pt-3 border-t border-zinc-200 text-xs text-zinc-600 flex justify-between items-center">
        <span>Cups logged today:</span>
        <span className="text-black font-bold font-mono text-sm">{activeData?.active_logs_count || 0}</span>
      </div>
    </div>
  );
}