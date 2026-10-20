import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export interface ChartPoint {
  time: string;
  caffeine_mg: number;
}

interface DecayChartProps {
  data: ChartPoint[];
}

export function DecayChart({ data }: DecayChartProps) {
  return (
    <div className="bg-white border-2 border-black rounded-xl p-6 shadow-sm mt-8 hover:border-orange-500 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            When Will Coffee Leave Your Body?
          </h2>
          <p className="text-xs text-zinc-600 mt-1">
            Estimated active blood caffeine over the next 12 hours
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="caffeineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#71717a" fontSize={12} tickLine={false} />
            <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', borderRadius: '8px', border: 'none', color: '#fff' }}
              formatter={(value: any) => [`${value ?? 0} mg`, 'Active Caffeine']}
            />
            <ReferenceLine 
              y={50} 
              stroke="#ef4444" 
              strokeDasharray="3 3" 
              label={{ value: 'Sleep Threshold (50mg)', fill: '#ef4444', fontSize: 11, position: 'top' }} 
            />
            <Area 
              type="monotone" 
              dataKey="caffeine_mg" 
              stroke="#ea580c" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#caffeineGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}