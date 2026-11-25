'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navLinks = [
  { href: '/',             label: 'Dashboard',  icon: '🏠' },
  { href: '/chat',         label: 'Chat',        icon: '💬' },
  { href: '/routine',      label: 'My Routine',  icon: '📅' },
  { href: '/indoor',       label: 'Indoor Hacks',icon: '🏡' },
  { href: '/alternatives', label: 'Alternatives',icon: '🌱' },
  { href: '/tracker',      label: 'Tracker',     icon: '📊' },
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <span className="font-bold text-green-400 text-lg">Hawa Dost</span>
          <span className="text-xs text-gray-500 hidden sm:inline">हवा दोस्त</span>
        </Link>
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
                pathname === link.href
                  ? 'bg-green-900/50 text-green-400 font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              <span className="hidden md:inline">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

