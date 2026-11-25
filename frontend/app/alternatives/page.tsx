'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const QUICK_ACTIVITIES = [
  'Driving diesel car to work daily',
  'Cooking on biomass/wood chulha',
  'Using diesel generator for power backup',
  'Burning crop stubble',
  'Using kerosene lamp/heater',
  'Air conditioning with old AC unit',
];

export default function AlternativesPage() {
  const [activity, setActivity] = useState('');
  const [location, setLocation] = useState('Delhi');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function analyzeActivity(act?: string) {
    const toAnalyze = act || activity;
    if (!toAnalyze.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/impact/quick/${encodeURIComponent(toAnalyze)}?location=${encodeURIComponent(location)}`);
      const data = await res.json();
      setResult(data);
    } catch { alert('Analysis failed. Check backend connection.'); }
    finally { setLoading(false); }
  }

  const FEASIBILITY_COLOR = (score: number) =>
    score >= 8 ? 'text-green-400' : score >= 5 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-400 mb-2">🌱 Sustainable Alternatives</h1>
        <p className="text-gray-400">
          Tell us any daily activity and Gemini AI will find you better alternatives with real CO₂ savings and cost comparisons.
        </p>
      </motion.div>

      {/* Input */}
      <div className="glass-card p-5 mb-6">
        <div className="flex gap-3 mb-4">
          <input value={activity} onChange={(e) => setActivity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && analyzeActivity()}
            placeholder="Describe an activity (e.g. 'driving petrol car 15km daily')"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
          <input value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="City"
            className="w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
        </div>
        <button onClick={() => analyzeActivity()} disabled={loading || !activity.trim()}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition">
          {loading ? '🧠 Analyzing with Gemini AI...' : '🔍 Find Sustainable Alternatives'}
        </button>

        {/* Quick picks */}
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-2">Or try a quick example:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIVITIES.map((act) => (
              <button key={act} onClick={() => { setActivity(act); analyzeActivity(act); }}
                className="text-xs bg-emerald-900/30 border border-emerald-800/40 text-emerald-400 px-3 py-1 rounded-full hover:bg-emerald-900/60 transition">
                {act}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Original Activity Stats */}
          <div className="glass-card p-4 mb-6 border-l-4 border-red-600">
            <p className="text-sm text-gray-400 mb-1">Current Activity</p>
            <p className="font-semibold text-gray-200 mb-2">{result.original_activity}</p>
            <div className="flex gap-4 flex-wrap">
              <span className="text-xs bg-red-900/50 text-red-300 px-3 py-1 rounded-full">
                💨 {result.original_emission_kg_per_day} kg CO₂/day
              </span>
              <span className="text-xs bg-orange-900/50 text-orange-300 px-3 py-1 rounded-full">
                ⚠️ {result.original_health_risk}
              </span>
            </div>
          </div>

          {/* Alternatives */}
          <h2 className="text-lg font-semibold text-gray-200 mb-4">✨ Sustainable Alternatives</h2>
          <div className="space-y-4 mb-6">
            {result.alternatives?.map((alt: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="glass-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{alt.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-200">{alt.name}</p>
                      <p className="text-xs text-gray-500">{alt.availability}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${FEASIBILITY_COLOR(alt.feasibility)}`}>
                      {alt.feasibility}/10 feasibility
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="bg-green-900/30 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">CO₂ Saved</p>
                    <p className="text-sm font-bold text-green-400">{alt.co2_saved_kg_per_year} kg/yr</p>
                  </div>
                  <div className="bg-blue-900/30 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Health Benefit</p>
                    <p className="text-xs font-medium text-blue-400">{alt.health_benefit}</p>
                  </div>
                  <div className="bg-purple-900/30 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Monthly Cost</p>
                    <p className="text-sm font-bold text-purple-400">₹{alt.monthly_cost_inr}</p>
                  </div>
                  <div className="bg-yellow-900/30 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Current Cost</p>
                    <p className="text-sm font-bold text-yellow-400">₹{alt.current_monthly_cost_inr}</p>
                  </div>
                </div>

                <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-lg p-3">
                  <p className="text-xs text-emerald-400 font-medium mb-1">🚀 First Step Today:</p>
                  <p className="text-xs text-gray-300">{alt.first_step}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Community Impact */}
          {result.community_impact && (
            <div className="glass-card p-5 border border-emerald-800/30">
              <h3 className="font-semibold text-emerald-400 mb-3">🌍 Community Impact — If 1,000 Families Switch</h3>
              <p className="text-gray-300 text-sm mb-2">{result.community_impact.if_1000_families}</p>
              <div className="flex gap-4">
                <span className="text-xs bg-green-900/50 text-green-400 px-3 py-1 rounded-full">
                  🌲 Equivalent to {result.community_impact.trees_equivalent?.toLocaleString()} trees planted
                </span>
                <span className="text-xs bg-blue-900/50 text-blue-400 px-3 py-1 rounded-full">
                  {result.community_impact.co2_equivalent}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

