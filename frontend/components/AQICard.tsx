'use client';

import { motion } from 'framer-motion';

interface AQICardProps {
  aqi: {
    aqi: number;
    category: string;
    color: string;
    pm25?: number;
    pm10?: number;
    no2?: number;
    o3?: number;
    city: string;
    health_message: string;
    cigarette_equivalent: number;
    outdoor_safe: boolean;
    mask_required: boolean;
    timestamp: string;
  };
}

function getAQIClass(aqi: number) {
  if (aqi <= 50)  return 'aqi-good';
  if (aqi <= 100) return 'aqi-moderate';
  if (aqi <= 150) return 'aqi-sensitive';
  if (aqi <= 200) return 'aqi-unhealthy';
  if (aqi <= 300) return 'aqi-very-bad';
  return 'aqi-hazardous';
}

function getSmogBg(aqi: number) {
  if (aqi <= 50)  return 'from-green-900/20 to-transparent';
  if (aqi <= 100) return 'from-yellow-900/20 to-transparent';
  if (aqi <= 150) return 'from-orange-900/30 to-transparent';
  if (aqi <= 200) return 'from-red-900/30 to-transparent';
  if (aqi <= 300) return 'from-purple-900/40 to-transparent';
  return 'from-red-950/60 to-transparent';
}

export function AQICard({ aqi: data }: AQICardProps) {
  const isHazardous = data.aqi > 300;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative glass-card p-6 mb-8 overflow-hidden ${isHazardous ? 'danger-pulse' : ''}`}
    >
      {/* Smog background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getSmogBg(data.aqi)} smog-layer`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">📍 {data.city}</p>
            <div className="flex items-center gap-3">
              <span className={`text-6xl font-black tabular-nums`} style={{ color: data.color }}>
                {data.aqi}
              </span>
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getAQIClass(data.aqi)}`}>
                  {data.category}
                </span>
                <p className="text-xs text-gray-500 mt-1">AQI Index</p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="flex flex-col gap-1">
              <span className={`text-sm px-2 py-1 rounded-lg ${data.outdoor_safe ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                {data.outdoor_safe ? '✅ Outdoor Safe' : '🚫 Stay Indoors'}
              </span>
              <span className={`text-sm px-2 py-1 rounded-lg ${data.mask_required ? 'bg-orange-900/50 text-orange-400' : 'bg-gray-800 text-gray-500'}`}>
                {data.mask_required ? '😷 Mask Required' : '😊 No Mask Needed'}
              </span>
            </div>
          </div>
        </div>

        {/* Cigarette Equivalent */}
        {data.cigarette_equivalent > 0 && (
          <div className="bg-red-950/40 border border-red-900/30 rounded-xl p-3 mb-4">
            <p className="text-sm text-red-300">
              🚬 Breathing this air = smoking <strong>{data.cigarette_equivalent} cigarette{data.cigarette_equivalent !== 1 ? 's' : ''}</strong> today
            </p>
          </div>
        )}

        {/* Health Message */}
        <p className="text-gray-300 text-sm mb-4">{data.health_message}</p>

        {/* Pollutant Grid */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'PM2.5', value: data.pm25, unit: 'µg/m³', limit: 15 },
            { label: 'PM10',  value: data.pm10,  unit: 'µg/m³', limit: 45 },
            { label: 'NO₂',   value: data.no2,   unit: 'µg/m³', limit: 25 },
            { label: 'O₃',    value: data.o3,    unit: 'µg/m³', limit: 100 },
          ].map((p) => (
            <div key={p.label} className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">{p.label}</p>
              <p className={`text-lg font-bold ${p.value && p.value > p.limit ? 'text-red-400' : 'text-green-400'}`}>
                {p.value !== undefined && p.value !== null ? p.value.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-gray-600">{p.unit}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-600 mt-3 text-right">
          Updated: {new Date(data.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </motion.div>
  );
}

