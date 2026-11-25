'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function TrackerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    transport_choice: 'personal_car',
    cooking_fuel: 'lpg',
    outdoor_hours: 0,
    mask_worn: false,
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hawa_dost_tracker');
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  // Emission factors (simplified)
  const CO2_FACTORS: Record<string, number> = {
    personal_car: 2.52, motorcycle: 1.44, bus: 0.9, metro: 0.49,
    cycle: 0, walk: 0, e_rickshaw: 0.12, work_from_home: 0,
  };

  function calculateDailyCO2(entry: any) {
    return CO2_FACTORS[entry.transport_choice] || 0;
  }

  function logEntry() {
    const co2 = calculateDailyCO2(form);
    const baseline = CO2_FACTORS['personal_car'];
    const saved = Math.max(0, baseline - co2);
    const newEntry = { ...form, co2_emitted: co2, co2_saved: saved };
    const updated = [...entries, newEntry].slice(-30); // keep last 30 days
    setEntries(updated);
    localStorage.setItem('hawa_dost_tracker', JSON.stringify(updated));
  }

  const totalCO2Saved = entries.reduce((sum, e) => sum + (e.co2_saved || 0), 0);
  const totalExposureAvoided = entries.reduce((sum, e) => sum + (e.mask_worn ? 2 : 0), 0);
  const streakDays = entries.length;
  const treesEquivalent = +(totalCO2Saved / 21.7).toFixed(1);

  const chartData = entries.slice(-14).map((e) => ({
    date: new Date(e.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    saved: +e.co2_saved.toFixed(2),
    emitted: +e.co2_emitted.toFixed(2),
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-purple-400 mb-2">📊 Family Impact Tracker</h1>
        <p className="text-gray-400">Log your daily choices and see your cumulative environmental and health impact.</p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'CO₂ Saved', value: `${totalCO2Saved.toFixed(1)} kg`, icon: '💨', color: 'text-green-400' },
          { label: 'Trees Equivalent', value: `${treesEquivalent}`, icon: '🌳', color: 'text-emerald-400' },
          { label: 'Mask Days', value: `${totalExposureAvoided / 2}`, icon: '😷', color: 'text-blue-400' },
          { label: 'Days Tracked', value: `${streakDays}`, icon: '🔥', color: 'text-orange-400' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <div className="text-3xl mb-1">{stat.icon}</div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="glass-card p-5 mb-8">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">📈 CO₂ Saved vs Emitted (last 14 days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="savedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4caf50" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4caf50" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="emittedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f44336" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f44336" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="saved" stroke="#4caf50" fill="url(#savedGrad)" name="CO₂ Saved (kg)" />
              <Area type="monotone" dataKey="emitted" stroke="#f44336" fill="url(#emittedGrad)" name="CO₂ Emitted (kg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log Entry */}
      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">📝 Log Today's Choices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">🚗 Transport Used</label>
            <select value={form.transport_choice} onChange={(e) => setForm({ ...form, transport_choice: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500">
              <option value="personal_car">Personal Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="bus">Bus</option>
              <option value="metro">Metro</option>
              <option value="cycle">Bicycle</option>
              <option value="walk">Walk</option>
              <option value="e_rickshaw">E-Rickshaw</option>
              <option value="work_from_home">Work From Home</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">⏱ Hours Outdoors</label>
            <input type="number" min={0} max={24} step={0.5} value={form.outdoor_hours}
              onChange={(e) => setForm({ ...form, outdoor_hours: +e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <input type="checkbox" id="mask" checked={form.mask_worn}
              onChange={(e) => setForm({ ...form, mask_worn: e.target.checked })} className="w-4 h-4 accent-purple-500" />
            <label htmlFor="mask" className="text-sm text-gray-300">😷 Wore N95 mask outdoors</label>
          </div>
        </div>
        <button onClick={logEntry}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-medium transition">
          ✅ Log Today's Entry
        </button>
      </div>

      {/* Recent Entries */}
      {entries.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Recent Entries</h2>
          <div className="space-y-2">
            {entries.slice(-7).reverse().map((entry, i) => (
              <div key={i} className="glass-card px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{entry.date}</span>
                  <span className="text-xs text-gray-300">{entry.transport_choice.replace(/_/g, ' ')}</span>
                  {entry.mask_worn && <span className="text-xs">😷</span>}
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-green-400">+{entry.co2_saved?.toFixed(2)} kg saved</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

