import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TopNav, { type Language } from './components/TopNav';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const { pathname } = useLocation();
  const isMapPage = pathname.startsWith('/map');

  const toggleLanguage = () => setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-indigo-600 selection:text-white font-sans antialiased">
      <TopNav language={language} onToggleLanguage={toggleLanguage} />
      <main
        className={
          isMapPage
            ? 'flex-1 w-full'
            : 'flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12'
        }
      >
        <Routes>
          <Route path="/" element={<DashboardPage language={language} />} />
          <Route path="/map" element={<MapPage language={language} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
