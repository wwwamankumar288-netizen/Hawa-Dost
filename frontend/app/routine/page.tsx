'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const EMISSION_COLORS = { low: 'emission-low', medium: 'emission-medium', high: 'emission-high' };
const RISK_COLORS = { safe: 'risk-safe', caution: 'risk-caution', avoid: 'risk-avoid' };

export default function RoutinePage() {
  const [profile, setProfile] = useState({
    location: 'Delhi',
    family_size: 4,
    children: 1,
    elderly: 0,
    pregnant: false,
    home_type: 'apartment',
    cooking_fuel: 'lpg',
    commute_method: 'personal_car',
    distance_km: 10,
    budget: 'low',
    language: 'en',
  });
  const [routine, setRoutine] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'result'>('form');

  async function generateRoutine() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/routine/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      setRoutine(data);
      setStep('result');
    } catch (err) {
      alert('Failed to generate routine. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-green-400 mb-2">📅 Daily Routine Builder</h1>
        <p className="text-gray-400">Get a personalized low-emission schedule tailored to your family and today's AQI.</p>
      </motion.div>

      {step === 'form' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-6">Tell us about your family</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Location */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">📍 City</label>
              <input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500" />
            </div>
            {/* Family Size */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">👨‍👩‍👧 Family Members</label>
              <input type="number" min={1} max={20} value={profile.family_size}
                onChange={(e) => setProfile({ ...profile, family_size: +e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500" />
            </div>
            {/* Children */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">🧒 Children under 12</label>
              <input type="number" min={0} max={10} value={profile.children}
                onChange={(e) => setProfile({ ...profile, children: +e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500" />
            </div>
            {/* Elderly */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">👴 Elderly (65+)</label>
              <input type="number" min={0} max={10} value={profile.elderly}
                onChange={(e) => setProfile({ ...profile, elderly: +e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500" />
            </div>
            {/* Home Type */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">🏠 Home Type</label>
              <select value={profile.home_type} onChange={(e) => setProfile({ ...profile, home_type: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500">
                <option value="apartment">Apartment / Flat</option>
                <option value="house">Independent House</option>
                <option value="shared_accommodation">Shared / PG</option>
                <option value="jhuggi_colony">Jhuggi / Informal Settlement</option>
              </select>
            </div>
            {/* Cooking Fuel */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">🔥 Cooking Fuel</label>
              <select value={profile.cooking_fuel} onChange={(e) => setProfile({ ...profile, cooking_fuel: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500">
                <option value="lpg">LPG Gas</option>
                <option value="electric">Electric / Induction</option>
                <option value="biomass">Biomass / Wood</option>
                <option value="kerosene">Kerosene</option>
                <option value="cng">CNG</option>
              </select>
            </div>
            {/* Commute */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">🚗 Primary Commute</label>
              <select value={profile.commute_method} onChange={(e) => setProfile({ ...profile, commute_method: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500">
                <option value="personal_car">Personal Car (Petrol/Diesel)</option>
                <option value="motorcycle">Motorcycle / Scooter</option>
                <option value="auto_rickshaw">Auto Rickshaw</option>
                <option value="bus">Bus (DTC / BEST)</option>
                <option value="metro">Metro / Local Train</option>
                <option value="cycle">Bicycle</option>
                <option value="walk">Walk</option>
                <option value="e_rickshaw">E-Rickshaw</option>
                <option value="work_from_home">Work From Home</option>
              </select>
            </div>
            {/* Distance */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">📏 Commute Distance (km)</label>
              <input type="number" min={0} max={100} value={profile.distance_km}
                onChange={(e) => setProfile({ ...profile, distance_km: +e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500" />
            </div>
            {/* Budget */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">💰 Budget for Changes</label>
              <select value={profile.budget} onChange={(e) => setProfile({ ...profile, budget: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500">
                <option value="free">Free only</option>
                <option value="low">Low (up to ₹500)</option>
                <option value="medium">Medium (up to ₹2000)</option>
                <option value="high">Any budget</option>
              </select>
            </div>
            {/* Pregnant */}
            <div className="flex items-center gap-3 mt-2">
              <input type="checkbox" id="pregnant" checked={profile.pregnant}
                onChange={(e) => setProfile({ ...profile, pregnant: e.target.checked })}
                className="w-4 h-4 accent-green-500" />
              <label htmlFor="pregnant" className="text-sm text-gray-300">🤰 Pregnant family member</label>
            </div>
          </div>

          <button onClick={generateRoutine} disabled={loading}
            className="w-full mt-8 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-4 rounded-xl font-semibold text-lg transition">
            {loading ? '🌿 Generating your personalized routine...' : '✨ Generate My Low-Emission Routine'}
          </button>
        </motion.div>
      )}

      {step === 'result' && routine && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* AQI Context Banner */}
          {routine.aqi_context && (
            <div className="glass-card p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Today's AQI in {profile.location}</p>
                <span className="text-3xl font-bold" style={{ color: routine.aqi_context.color }}>
                  {routine.aqi_context.aqi}
                </span>
                <span className="text-gray-400 ml-2">— {routine.aqi_context.category}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="bg-green-900/50 text-green-400 px-3 py-1 rounded-lg">
                  💨 {routine.co2_saved_kg} kg CO₂ saved
                </span>
                <span className="bg-blue-900/50 text-blue-400 px-3 py-1 rounded-lg">
                  ⏱ {routine.aqi_exposure_avoided_hours}h exposure avoided
                </span>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="glass-card p-4 mb-6 border-l-4 border-green-500">
            <p className="text-gray-300 text-sm leading-relaxed">{routine.daily_summary}</p>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            {routine.routine?.map((item: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card p-4 flex gap-4">
                <div className="w-14 text-center flex-shrink-0">
                  <p className="text-xs text-gray-500 mb-1">{item.time}</p>
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-gray-200 text-sm">{item.activity}</p>
                    <div className="flex gap-1 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${EMISSION_COLORS[item.emission_level as keyof typeof EMISSION_COLORS]}`}>
                        {item.emission_level}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${RISK_COLORS[item.health_risk as keyof typeof RISK_COLORS]}`}>
                        {item.health_risk}
                      </span>
                    </div>
                  </div>
                  {item.health_risk !== 'safe' && (
                    <p className="text-xs text-yellow-400 mb-1">💡 Alternative: {item.alternative}</p>
                  )}
                  <p className="text-xs text-gray-500">{item.impact_note}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <button onClick={() => setStep('form')} className="mt-6 w-full border border-white/10 text-gray-400 py-3 rounded-xl hover:bg-white/5 transition">
            ← Edit Profile & Regenerate
          </button>
        </motion.div>
      )}
    </div>
  );
}

