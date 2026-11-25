'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const actions = [
  { href: '/chat',         icon: '💬', title: 'Ask Hawa Dost',      desc: 'Chat with AI for personalized advice', color: 'from-green-900 to-green-800' },
  { href: '/routine',      icon: '📅', title: 'Build My Routine',   desc: 'AI low-emission daily schedule',       color: 'from-blue-900 to-blue-800'  },
  { href: '/indoor',       icon: '🏡', title: 'Indoor Hacks',       desc: 'Improve air quality at home',          color: 'from-teal-900 to-teal-800'  },
  { href: '/alternatives', icon: '🌱', title: 'Sustainable Swaps',  desc: 'Better choices with real impact data', color: 'from-emerald-900 to-emerald-800' },
  { href: '/tracker',      icon: '📊', title: 'Track My Impact',    desc: 'See your family\'s progress',          color: 'from-purple-900 to-purple-800' },
];

export function QuickActions() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-300 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {actions.map((action, i) => (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i + 0.2 }}
          >
            <Link
              href={action.href}
              className={`block glass-card p-4 hover:scale-105 transition-transform bg-gradient-to-br ${action.color} bg-opacity-20 group`}
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</div>
              <p className="font-semibold text-sm text-gray-200 mb-1">{action.title}</p>
              <p className="text-xs text-gray-500">{action.desc}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

