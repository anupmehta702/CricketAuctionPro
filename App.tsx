
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuctionProvider } from './context/AuctionContext';
import LandingPage from './pages/LandingPage';
import AdminSetup from './pages/AdminSetup';
import AuctionPage from './pages/AuctionPage';
import SummaryPage from './pages/SummaryPage';
import RosterPage from './pages/RosterPage';
import PlayerSelectionPage from './pages/PlayerSelectionPage';
import LoginPage from './pages/LoginPage';
import CreateAccountPage from './pages/CreateAccountPage';
import PlayersPage from './pages/PlayersPage';
import AdminRoute from './components/AdminRoute';
import LogoutButton from './components/LogoutButton';

const App: React.FC = () => {
  return (
    <AuctionProvider>
      <HashRouter>
        <div className="min-h-screen bg-[#020617] text-white">
          <LogoutButton />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/create-account" element={<CreateAccountPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/admin/:tournamentId?" element={<AdminRoute><AdminSetup /></AdminRoute>} />
            <Route path="/selection/:tournamentId" element={<AdminRoute><PlayerSelectionPage /></AdminRoute>} />
            <Route path="/auction/:tournamentId/:playerId" element={<AdminRoute><AuctionPage /></AdminRoute>} />
            <Route path="/summary/:tournamentId" element={<SummaryPage />} />
            <Route path="/roster/:tournamentId" element={<RosterPage />} />
            <Route path="/players/:tournamentId" element={<PlayersPage />} />
            <Route path="*" element={<Navigate to="/landing" replace />} />
          </Routes>
        </div>
      </HashRouter>
    </AuctionProvider>
  );
};

export default App;
