'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function IndoorPage() {
  const [form, setForm] = useState({
    home_type: 'apartment',
    budget: 'free',
    num_rooms: 2,
    has_children: false,
    has_elderly: false,
    location: 'Delhi',
  });
  const [hacks, setHacks] = useState<any>(null);
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'hacks' | 'plants'>('hacks');

  async function fetchHacks() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/indoor/hacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setHacks(data);
    } catch { alert('Failed to fetch hacks. Check backend connection.'); }
    finally { setLoading(false); }
  }

  async function fetchPlants() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/indoor/plants`);
      const data = await res.json();
      setPlants(Array.isArray(data) ? data : []);
    } catch { alert('Failed to fetch plants.'); }
    finally { setLoading(false); }
  }

  const COST_COLORS: Record<string, string> = {
    free:   'bg-green-900/50 text-green-400',
    low:    'bg-blue-900/50 text-blue-400',
    medium: 'bg-yellow-900/50 text-yellow-400',
    high:   'bg-purple-900/50 text-purple-400',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-teal-400 mb-2">🏡 Indoor Air Quality Hacks</h1>
        <p className="text-gray-400">RAG-powered recommendations for improving your home's air quality — many are completely free.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('hacks')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'hacks' ? 'bg-teal-700 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
          🔧 Hacks & Tips
        </button>
        <button onClick={() => { setTab('plants'); if (!plants.length) fetchPlants(); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'plants' ? 'bg-teal-700 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
          🌿 Air-Purifying Plants
        </button>
      </div>

      {tab === 'hacks' && (
        <>
          {/* Filter Form */}
          <div className="glass-card p-5 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Home Type</label>
                <select value={form.home_type} onChange={(e) => setForm({ ...form, home_type: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500">
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="shared_accommodation">Shared / PG</option>
                  <option value="jhuggi_colony">Jhuggi Colony</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Budget</label>
                <select value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500">
                  <option value="free">Free Only</option>
                  <option value="low">Under ₹500</option>
                  <option value="medium">Under ₹2000</option>
                  <option value="high">Any Budget</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Number of Rooms</label>
                <input type="number" min={1} max={10} value={form.num_rooms} onChange={(e) => setForm({ ...form, num_rooms: +e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500" />
              </div>
            </div>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.has_children} onChange={(e) => setForm({ ...form, has_children: e.target.checked })} className="accent-teal-500" />
                Children at home
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.has_elderly} onChange={(e) => setForm({ ...form, has_elderly: e.target.checked })} className="accent-teal-500" />
                Elderly at home
              </label>
            </div>
            <button onClick={fetchHacks} disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition">
              {loading ? '🌿 Finding best hacks...' : '🔍 Get My Indoor Air Hacks'}
            </button>
          </div>

          {/* Results */}
          {hacks && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Quick wins */}
              {hacks.quick_wins?.length > 0 && (
                <div className="glass-card p-4 mb-4 border-l-4 border-teal-500">
                  <p className="text-sm font-semibold text-teal-400 mb-2">⚡ Quick Wins — Do These Right Now</p>
                  <ul className="space-y-1">
                    {hacks.quick_wins.map((win: string, i: number) => (
                      <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-teal-400">✓</span> {win}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hacks Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {hacks.hacks?.map((hack: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="glass-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{hack.icon}</span>
                        <div>
                          <p className="font-medium text-gray-200 text-sm">{hack.title}</p>
                          <p className="text-xs text-gray-500">{hack.category}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${COST_COLORS[hack.cost] || 'bg-gray-800 text-gray-400'}`}>
                        {hack.cost_inr}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{hack.description}</p>
                    <div className="text-xs text-green-400 mb-3">📈 {hack.effectiveness}</div>
                    <details className="group">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition">📋 Show Steps</summary>
                      <ol className="mt-2 space-y-1 ml-3">
                        {hack.steps?.map((step: string, j: number) => (
                          <li key={j} className="text-xs text-gray-400 list-decimal">{step}</li>
                        ))}
                      </ol>
                    </details>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}

      {tab === 'plants' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {plants.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-10">Loading plant data...</div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            {plants.map((plant: any, i: number) => (
              <div key={i} className="glass-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{plant.icon || '🌿'}</span>
                  <div>
                    <p className="font-medium text-gray-200">{plant.name}</p>
                    <p className="text-xs text-gray-500">{plant.hindi_name}</p>
                  </div>
                  <span className="ml-auto text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded-full">
                    Rank #{plant.pm25_absorption_rank}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                  <span>☀️ {plant.light_requirement}</span>
                  <span>💧 {plant.water_frequency}</span>
                  <span>🏠 Best: {plant.best_placement}</span>
                  <span>🌟 Care: {plant.care_difficulty}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

