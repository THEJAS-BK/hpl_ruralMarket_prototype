import React, { useState } from 'react';
import { NavPage, Language } from '../types';

interface HeaderProps {
  currentPage: NavPage;
  onNavigate?: (page: NavPage) => void;
  onPageChange?: (page: NavPage) => void;
  language: Language;
  onToggleLanguage?: () => void;
  onLanguageToggle?: (lang: Language) => void;
  onOpenNotifications: () => void;
  notificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  onPageChange,
  language,
  onToggleLanguage,
  onLanguageToggle,
  onOpenNotifications,
  notificationCount = 3,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);

  const handleNavigate = (page: NavPage) => {
    if (onNavigate) onNavigate(page);
    if (onPageChange) onPageChange(page);
  };

  const handleLangToggle = (lang: Language) => {
    if (onLanguageToggle) onLanguageToggle(lang);
    if (onToggleLanguage) onToggleLanguage();
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="h-16 max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-space-md">
        {/* Brand and Status */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => handleNavigate('dashboard')}
            className="flex items-center gap-3 text-left cursor-pointer focus:outline-none"
            id="brand-logo-btn"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-xs">
              K
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg tracking-tight text-slate-900 leading-none">
                KisanPulse
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mt-0.5">
                Agri-Spot Intelligence
              </span>
            </div>
          </button>

          <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-md border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-medium text-slate-600">
              {language === 'en' ? 'Live APMC Feed • Malwa' : 'लाइव मंडी भाव • मालवा'}
            </span>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1" id="nav-menu">
          <button
            onClick={() => handleNavigate('dashboard')}
            id="nav-dashboard-tab"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'dashboard'
                ? 'bg-slate-50 text-indigo-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {language === 'en' ? 'Dashboard' : 'डैशबोर्ड'}
          </button>
          <button
            onClick={() => handleNavigate('mandi-map')}
            id="nav-map-tab"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'mandi-map'
                ? 'bg-slate-50 text-indigo-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {language === 'en' ? 'Mandi Map' : 'मंडी नक्शा'}
          </button>
          <button
            onClick={() => handleNavigate('mandi-comparison')}
            id="nav-comparison-tab"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'mandi-comparison'
                ? 'bg-slate-50 text-indigo-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {language === 'en' ? 'Mandi Comparison' : 'मंडी तुलना'}
          </button>
        </nav>

        {/* Right Action Utilities */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => handleLangToggle('en')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              type="button"
            >
              EN
            </button>
            <button
              onClick={() => handleLangToggle('hi')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                language === 'hi'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              type="button"
            >
              हिंदी
            </button>
          </div>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            id="notifications-toggle-btn"
            aria-label="Notifications"
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600"></span>
            )}
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors text-left focus:outline-none"
              id="user-profile-btn"
            >
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
                alt="Rajesh Patidar"
                className="w-7 h-7 rounded-full object-cover"
              />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  Rajesh Patidar
                </span>
                <span className="text-[10px] text-slate-500 leading-tight">
                  Depalpur, MP
                </span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-11 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50 animate-in fade-in">
                <div className="p-2 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">Rajesh Patidar</p>
                  <p className="text-xs text-slate-500">Patidar Farmstead, Depalpur</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-600 bg-emerald-50">
                    Kisan ID: MP-IND-9082
                  </span>
                </div>
                <div className="py-2 text-xs text-slate-600">
                  <div className="px-2 py-1 flex justify-between">
                    <span className="text-slate-500">Active Land:</span>
                    <span className="font-semibold text-slate-900">24 Acres</span>
                  </div>
                  <div className="px-2 py-1 flex justify-between">
                    <span className="text-slate-500">Default Mandi:</span>
                    <span className="font-semibold text-indigo-600">Ujjain Chimanganj</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      handleNavigate('mandi-comparison');
                      setProfileOpen(false);
                    }}
                    className="w-full py-1.5 px-2 text-left rounded-lg text-indigo-600 hover:bg-slate-50 text-xs font-semibold flex items-center justify-between transition-colors"
                  >
                    <span>View Net Realization</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 bg-white px-2 py-1.5">
        <button
          onClick={() => handleNavigate('dashboard')}
          className={`flex-1 py-1.5 text-center text-xs font-medium rounded-md transition-colors ${
            currentPage === 'dashboard' ? 'bg-slate-100 text-indigo-600 font-semibold' : 'text-slate-600'
          }`}
        >
          {language === 'en' ? 'Dashboard' : 'डैशबोर्ड'}
        </button>
        <button
          onClick={() => handleNavigate('mandi-map')}
          className={`flex-1 py-1.5 text-center text-xs font-medium rounded-md transition-colors ${
            currentPage === 'mandi-map' ? 'bg-slate-100 text-indigo-600 font-semibold' : 'text-slate-600'
          }`}
        >
          {language === 'en' ? 'Map' : 'नक्शा'}
        </button>
        <button
          onClick={() => handleNavigate('mandi-comparison')}
          className={`flex-1 py-1.5 text-center text-xs font-medium rounded-md transition-colors ${
            currentPage === 'mandi-comparison' ? 'bg-slate-100 text-indigo-600 font-semibold' : 'text-slate-600'
          }`}
        >
          {language === 'en' ? 'Comparison' : 'तुलना'}
        </button>
      </div>
    </header>
  );
};
