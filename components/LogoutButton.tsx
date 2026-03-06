import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../src/supabaseClient';
import { useAuction } from '../context/AuctionContext';

const LogoutButton: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuction();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return user ? (
    <button
      onClick={handleLogout}
      className="fixed top-4 right-4 bg-white/5 text-slate-400 px-4 py-2 rounded-lg hover:text-red-500 hover:bg-white/10 transition-colors focus:outline-none"
      title="Logout"
    >
      Logout
    </button>
  ) : null;
};

export default LogoutButton;
