import React, { useState } from 'react';
import axios from 'axios';

interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckinSuccess: () => void;
  userId: string; 
}

const API_BASE = 'http://localhost:4000/api';

export function CheckinModal({ isOpen, onClose, onCheckinSuccess, userId }: CheckinModalProps) {
  const [sleepHours, setSleepHours] = useState<string>('7.0');
  const [workloadScore, setWorkloadScore] = useState<string>('3');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post(`${API_BASE}/checkins`, {
        user_id: userId,
        sleep_hours: parseFloat(sleepHours),
        fatigue_score: parseInt(workloadScore, 10),
        notes: notes.trim() || undefined
      });

      setLoading(false);
      onCheckinSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to submit check-in:', err);
      setError(err.response?.data?.error || 'Failed to save check-in. Make sure backend is running.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white border-2 border-black rounded-xl max-w-md w-full p-6 shadow-2xl">
        
        <div className="flex justify-between items-center pb-4 border-b border-zinc-200">
          <div>
            <h2 className="text-lg font-bold text-black">Daily Telemetry Check-in</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Log your sleep and workload to calculate burnout risk</p>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-black font-bold text-lg px-2"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
              Sleep Last Night (Hours)
            </label>
            <input 
              type="number" 
              step="0.5" 
              min="0" 
              max="24"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-black font-mono focus:outline-none focus:border-orange-500 transition"
              required 
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Sleep &lt; 5h applies a 0.70 budget modifier; 5–7h applies 0.85.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
              Workload Intensity (1 - 5)
            </label>
            <select
              value={workloadScore}
              onChange={(e) => setWorkloadScore(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-black font-medium focus:outline-none focus:border-orange-500 transition"
            >
              <option value="1">1 - Very Light / Rest Day</option>
              <option value="2">2 - Light Workload</option>
              <option value="3">3 - Moderate (Normal)</option>
              <option value="4">4 - Heavy Coding / Sprint</option>
              <option value="5">5 - Critical Burnout Risk / Crunch</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
              Notes (Optional)
            </label>
            <input 
              type="text" 
              placeholder="e.g., Late night production deploy"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-black text-xs focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Check-in'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}