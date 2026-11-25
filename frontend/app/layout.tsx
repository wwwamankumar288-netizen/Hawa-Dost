import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'Hawa Dost — Your Air Quality Companion',
  description: 'GenAI-powered assistant helping families navigate winter smog and urban air pollution with personalized, actionable guidance.',
  keywords: ['air quality', 'AQI', 'smog', 'pollution', 'Delhi', 'India', 'health'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="smog-bg min-h-screen">
        <Navigation />
        <main className="pt-16 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}

