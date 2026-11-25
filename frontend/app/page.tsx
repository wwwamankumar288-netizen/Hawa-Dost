'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AQICard } from '@/components/AQICard';
import { QuickActions } from '@/components/QuickActions';
import { SmogHeatmap } from '@/components/SmogHeatmap';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HomePage() {
  const [aqi, setAqi] = useState<any>(null);
  const [city, setCity] = useState('Delhi');
  const [inputCity, setInputCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [popularCities, setPopularCities] = useState<any[]>([]);

  useEffect(() => {
    fetchAQI(city);
    fetchPopularCities();
  }, []);

  async function fetchAQI(cityName: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/aqi/city/${encodeURIComponent(cityName)}`);
      const data = await res.json();
      setAqi(data);
      setCity(cityName);
    } catch (err) {
      console.error('AQI fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPopularCities() {
    try {
      const res = await fetch(`${API_URL}/api/aqi/popular-cities`);
      const data = await res.json();
      setPopularCities(data);
    } catch (err) {}
  }

  function getAQIClass(aqiVal: number) {
    if (aqiVal <= 50)  return 'aqi-good';
    if (aqiVal <= 100) return 'aqi-moderate';
    if (aqiVal <= 150) return 'aqi-sensitive';
    if (aqiVal <= 200) return 'aqi-unhealthy';
    if (aqiVal <= 300) return 'aqi-very-bad';
    return 'aqi-hazardous';
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-5xl">🌿</span>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-teal-300 bg-clip-text text-transparent">
            Hawa Dost
          </h1>
        </div>
        <p className="text-xl text-gray-400 mb-2">हवा दोस्त — Your Air Quality Companion</p>
        <p className="text-gray-500 max-w-2xl mx-auto">
          GenAI-powered guidance for families navigating winter smog and urban air pollution.
          Personalized, actionable, and in your language.
        </p>
      </motion.div>

      {/* City Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 mb-8 max-w-lg mx-auto"
      >
        <input
          type="text"
          value={inputCity}
          onChange={(e) => setInputCity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && inputCity && fetchAQI(inputCity)}
          placeholder="Enter your city (e.g. Delhi, Lahore, Mumbai)"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
        />
        <button
          onClick={() => inputCity && fetchAQI(inputCity)}
          className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-medium transition"
        >
          Check AQI
        </button>
      </motion.div>

      {/* AQI Card */}
      {loading ? (
        <div className="glass-card p-8 text-center animate-pulse mb-8">
          <div className="h-20 bg-white/5 rounded-lg mb-4" />
          <div className="h-6 bg-white/5 rounded-lg w-3/4 mx-auto" />
        </div>
      ) : aqi ? (
        <AQICard aqi={aqi} />
      ) : null}

      {/* Quick Actions */}
      <QuickActions />

      {/* Popular Cities Grid */}
      {popularCities.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10"
        >
          <h2 className="text-xl font-semibold text-gray-300 mb-4">🌏 Cities Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {popularCities.slice(0, 8).map((c: any) => (
              <button
                key={c.city}
                onClick={() => fetchAQI(c.city)}
                className="glass-card p-4 text-left hover:border-green-600/40 transition group cursor-pointer"
              >
                <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-2 ${getAQIClass(c.aqi)}`}>
                  AQI {c.aqi}
                </div>
                <p className="text-sm font-medium text-gray-300 group-hover:text-white transition truncate">
                  {c.city}
                </p>
                <p className="text-xs text-gray-500">{c.category}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12 glass-card p-6"
      >
        <h2 className="text-xl font-semibold text-gray-200 mb-6 text-center">
          🧠 Powered by Google Gemini AI
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '💬', title: 'Chat with Hawa Dost', desc: 'Ask anything in Hindi or English. Get real-time AQI-aware advice from our AI companion.' },
            { icon: '📅', title: 'Personalized Routines', desc: 'Get a daily schedule tailored to your family profile, home type, and current air quality.' },
            { icon: '🌱', title: 'Impact Analysis', desc: 'See the CO₂ and health impact of your choices, with sustainable alternatives and local costs.' },
          ].map((item) => (
            <div key={item.title} className="text-center p-4">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-gray-200 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

