
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { PlayerStatus } from '../types';
import BottomNav from '../components/BottomNav';

const PlayerSelectionPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { getTournamentData, players, categories } = useAuction();
  const data = getTournamentData(tournamentId || '');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  if (!data.tournament) return <div className="p-10 text-center">Tournament not found</div>;

  const availablePlayers = players.filter(p => p.tournamentId === tournamentId && p.status === PlayerStatus.AVAILABLE);

  return (
    <div className="w-full h-screen flex flex-col bg-[#020617] text-white overflow-hidden">
      <header className="shrink-0 pt-14 pb-6 px-5 flex flex-col gap-1 bg-slate-950/50 border-b border-white/5">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-display tracking-tight">Select Player</h1>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">{availablePlayers.length} Available</span>
          </div>
        </div>
        <p className="text-xs text-slate-400">Choose the next participant for the live auction</p>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4 no-scrollbar pb-40">
        {availablePlayers.length === 0 ? (
          <div className="text-center py-20 text-slate-500 italic">
            No available players remaining in this tournament.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {availablePlayers.map(p => {
              const cat = categories.find(c => c.id === p.categoryId);
              const isSelected = selectedPlayerId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                    isSelected ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10' : 'glass-card border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 overflow-hidden">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                      ) : (
                        <iconify-icon icon="lucide:user" className="text-xl text-slate-600" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{p.name}</p>
                      <p className="text-[10px] text-blue-400 uppercase font-bold tracking-tighter">
                        {cat?.name} • {p.profile}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500">Base Price</p>
                    <p className="text-xs font-bold text-[#D4AF37] font-display">₹{cat?.basePrice.toFixed(2)} Cr</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <footer className="shrink-0 bg-slate-900 border-t border-white/10 px-5 pt-4 pb-24 fixed bottom-0 left-0 right-0 z-40">
        <button
          disabled={!selectedPlayerId}
          onClick={() => navigate(`/auction/${tournamentId}/${selectedPlayerId}`)}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:grayscale text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold font-display text-lg shadow-lg active:scale-95 transition-all"
        >
          NEXT <iconify-icon icon="lucide:chevron-right" />
        </button>
      </footer>

      <BottomNav tournamentId={tournamentId!} />
    </div>
  );
};

export default PlayerSelectionPage;
