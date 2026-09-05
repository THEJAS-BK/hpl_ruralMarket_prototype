/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NavPage, Language, CommodityId } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DashboardView } from './components/DashboardView';
import { MandiMapView } from './components/MandiMapView';
import { MandiComparisonView } from './components/MandiComparisonView';
import { FreightBookingModal } from './components/FreightBookingModal';
import { DirectionsModal } from './components/DirectionsModal';
import { CallVyapariModal } from './components/CallVyapariModal';
import { NotificationDrawer } from './components/NotificationDrawer';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [language, setLanguage] = useState<Language>('en');
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityId>('soybean');

  // Modals state
  const [isFreightOpen, setIsFreightOpen] = useState(false);
  const [freightDestination, setFreightDestination] = useState('Ujjain Chimanganj');
  const [freightPayload, setFreightPayload] = useState<number>(50);

  const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);
  const [directionsMandi, setDirectionsMandi] = useState('Ujjain Chimanganj Mandi');

  const [isVyapariOpen, setIsVyapariOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleOpenFreight = (mandiName = 'Ujjain Chimanganj', payload = 50) => {
    setFreightDestination(mandiName);
    setFreightPayload(payload);
    setIsFreightOpen(true);
  };

  const handleOpenDirections = (mandiName = 'Ujjain Chimanganj Mandi') => {
    setDirectionsMandi(mandiName);
    setIsDirectionsOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-indigo-600 selection:text-white font-sans antialiased">
      {/* Top Application Header */}
      <Header
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        language={language}
        onToggleLanguage={() => setLanguage(language === 'en' ? 'hi' : 'en')}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {currentPage === 'dashboard' && (
          <DashboardView
            onNavigate={setCurrentPage}
            language={language}
            selectedCommodity={selectedCommodity}
            onSelectCommodity={setSelectedCommodity}
            onOpenFreightModal={handleOpenFreight}
          />
        )}

        {currentPage === 'mandi-map' && (
          <MandiMapView
            onNavigate={setCurrentPage}
            language={language}
            selectedCommodity={selectedCommodity}
            onSelectCommodity={setSelectedCommodity}
            onOpenDirections={handleOpenDirections}
            onOpenFreightModal={handleOpenFreight}
          />
        )}

        {currentPage === 'mandi-comparison' && (
          <MandiComparisonView
            onNavigate={setCurrentPage}
            language={language}
            selectedCommodity={selectedCommodity}
            onOpenDirections={handleOpenDirections}
            onOpenVyapariModal={() => setIsVyapariOpen(true)}
            onOpenFreightModal={handleOpenFreight}
          />
        )}
      </main>

      {/* Persistent Bottom Footer */}
      <Footer />

      {/* Floating & Interactive Modals */}
      <FreightBookingModal
        isOpen={isFreightOpen}
        onClose={() => setIsFreightOpen(false)}
        destinationMandi={freightDestination}
        defaultPayloadQtl={freightPayload}
      />

      <DirectionsModal
        isOpen={isDirectionsOpen}
        onClose={() => setIsDirectionsOpen(false)}
        destinationMandi={directionsMandi}
      />

      <CallVyapariModal
        isOpen={isVyapariOpen}
        onClose={() => setIsVyapariOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectAction={(page) => setCurrentPage(page as NavPage)}
      />
    </div>
  );
}
