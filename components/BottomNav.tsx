
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface BottomNavProps {
  tournamentId: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ tournamentId }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Auction', icon: 'lucide:gavel', path: `/auction/${tournamentId}` },
    { label: 'Squads', icon: 'lucide:users', path: `/roster/${tournamentId}` },
    { label: 'Summary', icon: 'lucide:layout-dashboard', path: `/summary/${tournamentId}` },
    { label: 'Settings', icon: 'lucide:settings', path: `/admin/${tournamentId}` },
  ];

  return (
    <nav className="shrink-0 fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-white/5 px-6 pt-3 pb-[34px] flex justify-between items-center z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.label}
            to={item.path}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-blue-500' : 'text-slate-500 hover:text-white'
            }`}
          >
            <iconify-icon icon={item.icon} className="text-xl" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
