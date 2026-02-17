
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuctionProvider } from './context/AuctionContext';
import LandingPage from './pages/LandingPage';
import AdminSetup from './pages/AdminSetup';
import AuctionPage from './pages/AuctionPage';
import SummaryPage from './pages/SummaryPage';
import RosterPage from './pages/RosterPage';
import PlayerSelectionPage from './pages/PlayerSelectionPage';

const App: React.FC = () => {
  return (
    <AuctionProvider>
      <HashRouter>
        <div className="min-h-screen bg-[#020617] text-white">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/admin/:tournamentId?" element={<AdminSetup />} />
            <Route path="/selection/:tournamentId" element={<PlayerSelectionPage />} />
            <Route path="/auction/:tournamentId/:playerId" element={<AuctionPage />} />
            <Route path="/summary/:tournamentId" element={<SummaryPage />} />
            <Route path="/roster/:tournamentId" element={<RosterPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </HashRouter>
    </AuctionProvider>
  );
};

export default App;
