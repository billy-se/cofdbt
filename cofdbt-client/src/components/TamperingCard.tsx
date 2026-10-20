import React from 'react';

interface TaperData {
  current_estimated_daily_avg_mg?: number;
  taper_status?: string;
  recommended_daily_limit_mg?: number;
}

interface TamperingCardProps {
  loading: boolean;
  taperData: TaperData | null;
}

export function TamperingCard({ loading, taperData }: TamperingCardProps) {
  return (
    <div className="bg-white border-2 border-black rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-orange-500 transition-colors">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Recommended Daily Coffee</h2>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-black font-mono">
            {loading ? '...' : `${taperData?.current_estimated_daily_avg_mg || 0}`}
          </span>
          <span className="text-sm text-zinc-600 font-bold">mg/day</span>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Based on your usual coffee habits this week
        </p>
      </div>
      <div className="mt-4 pt-3 border-t border-zinc-200 text-xs text-zinc-600 flex justify-between items-center">
        <span>Goal:</span>
        <span className="text-orange-600 font-bold text-xs">Keep under this to sleep well tonight</span>
      </div>
    </div>
  );
}