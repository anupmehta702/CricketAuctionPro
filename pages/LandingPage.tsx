
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { tournaments, players } = useAuction();

  return (
    <div className="w-full h-screen flex flex-col bg-[#020617] text-white overflow-hidden">
      <header className="shrink-0 pt-14 pb-4 px-6 flex justify-between items-center bg-slate-950/50 border-b border-white/5">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-[0.2em] text-blue-500 uppercase mb-1">Pro Cricket</span>
          <h1 className="text-xl font-bold font-display leading-tight">Auction Manager</h1>
        </div>
        <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden flex items-center justify-center bg-slate-800">
          <iconify-icon icon="lucide:user" className="text-xl text-slate-500" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6 no-scrollbar pb-10">
        <div className="flex justify-between items-end">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">My Tournaments</h2>
          <button 
            onClick={() => navigate('/admin')}
            className="text-xs font-bold text-blue-400 flex items-center gap-1"
          >
            <iconify-icon icon="lucide:plus-circle" /> New
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {tournaments.length === 0 ? (
            <div className="glass-card rounded-3xl p-5 border-dashed border-white/10 flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center">
                <iconify-icon icon="lucide:trophy" className="text-2xl text-slate-700" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-bold text-slate-400 mb-1">No tournaments found</h4>
                <p className="text-xs text-slate-600">Ready to create your first one?</p>
              </div>
              <button 
                onClick={() => navigate('/admin')}
                className="mt-2 px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors"
              >
                Create Tournament
              </button>
            </div>
          ) : (
            tournaments.map(t => (
              <div key={t.id} className="glass-card rounded-3xl p-5 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-blue-600/20 transition-all" />
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <h3 className="flex flex-col">
                      <span className="block text-xs text-slate-500 font-bold uppercase tracking-tighter mb-1">
                        {t.venue} • {t.numberOfTeams} Teams
                      </span>
                      <span className="text-lg font-bold font-display">{t.name}</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate(`/admin/${t.id}`)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    >
                      <iconify-icon icon="lucide:pencil" className="text-sm text-slate-400" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex flex-col">
                    <p className="text-[10px] text-slate-500 uppercase">Registered Players</p>
                    <p className="text-sm font-bold font-display">
                      {players.filter(p => p.tournamentId === t.id).length} Players
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Persisted</p>
                    <p className="text-sm font-bold font-display text-[#D4AF37] tracking-tight uppercase">Ready</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/selection/${t.id}`)}
                  className="w-full py-3.5 rounded-2xl action-gradient font-bold font-display text-sm tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 active:scale-[0.98] transition-all"
                >
                  <iconify-icon icon="lucide:gavel" className="text-lg" /> START AUCTION
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 glass-card rounded-2xl p-4 flex items-center gap-4 border-l-4 border-l-yellow-500">
          <iconify-icon icon="lucide:info" className="text-yellow-500 text-xl" />
          <div>
            <p className="text-xs font-bold">Pro Tip</p>
            <p className="text-[10px] text-slate-400">Select players individually from the pool to begin their live bidding session.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
