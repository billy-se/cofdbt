import { useState } from 'react';
import { logCoffee } from '../services/api.js';

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogSuccess: () => void;
  userId: string;
}

export function IntakeModal({ isOpen, onClose, onLogSuccess, userId }: IntakeModalProps) {
  const [tbspFraction, setTbspFraction] = useState<number>(1.0);
  const [waterRatio, setWaterRatio] = useState<number>(100);
  const [workIntensity, setWorkIntensity] = useState<string>('medium');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await logCoffee({
        user_id: userId,
        volume_tbsp_fraction: tbspFraction,
        water_ratio_percent: waterRatio,
        work_intensity: workIntensity,
        ui_mode: 'easy',
      });
      onLogSuccess(); 
      onClose();
    } catch (err) {
      console.error('Failed to log intake:', err);
      alert('Error logging coffee. Check if backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="bg-white border-2 border-black rounded-xl max-w-md w-full p-6 shadow-2xl text-slate-800">
      
      <div className="flex justify-between items-center pb-4 border-b border-zinc-200">
        <div>
          <h2 className="text-lg font-bold text-black">Log Coffee Intake</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Record dose and water concentration</p>
        </div>
        <button 
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-black font-bold text-lg px-2"
        >
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
            Amount (Tablespoons)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[0.5, 1.0, 1.5, 2.0].map((fraction) => (
              <button
                key={fraction}
                type="button"
                onClick={() => setTbspFraction(fraction)}
                className={`py-2 text-xs font-bold font-mono rounded-lg border-2 transition ${
                  tbspFraction === fraction
                    ? 'bg-orange-500 text-white border-black shadow-sm'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:border-black'
                }`}
              >
                {fraction} tbsp
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
            <span>Water Ratio: {waterRatio}%</span>
            <span className={waterRatio < 50 ? 'text-orange-600 font-bold' : 'text-zinc-400'}>
              {waterRatio < 50 ? '⚡ Concentrated (+15% boost)' : 'Standard Brew'}
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={waterRatio}
            onChange={(e) => setWaterRatio(Number(e.target.value))}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
            Workload Context
          </label>
          <select
            value={workIntensity}
            onChange={(e) => setWorkIntensity(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-300 text-black font-medium rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500 transition"
          >
            <option value="low">Low Load (Administrative / Light)</option>
            <option value="medium">Medium Load (Standard Coding)</option>
            <option value="high_stakes">High Stakes (Crunch / Debugging)</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4 border-t border-zinc-200">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-1/2 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Log Cup'}
          </button>
        </div>
      </form>
    </div>
  </div>
);
}