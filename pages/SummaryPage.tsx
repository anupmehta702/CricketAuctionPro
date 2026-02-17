
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { PlayerStatus } from '../types';
import BottomNav from '../components/BottomNav';

const SummaryPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { getTournamentData, players, teams } = useAuction();
  const data = getTournamentData(tournamentId || '');

  if (!data.tournament) return <div className="p-10 text-center">Tournament not found</div>;

  const tournamentPlayers = players.filter(p => p.tournamentId === tournamentId);
  const soldPlayersCount = tournamentPlayers.filter(p => p.status === PlayerStatus.SOLD).length;
  const totalSpent = teams.reduce((acc, t) => acc + (t.purse - t.remainingPurse), 0);

  return (
    <div className="w-full h-screen flex flex-col bg-[#020617] text-white overflow-hidden">
      <header className="shrink-0 pt-14 pb-6 px-5 flex flex-col gap-1 bg-slate-950/50 border-b border-white/5">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-display tracking-tight">Auction Summary</h1>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">View Mode</span>
          </div>
        </div>
        <p className="text-xs text-slate-400">Tournament: {data.tournament.name}</p>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4 pb-28 no-scrollbar">
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Players Sold</p>
            <p className="text-xl font-bold font-display">{soldPlayersCount} <span className="text-[10px] text-slate-500">/ {tournamentPlayers.length}</span></p>
          </div>
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Spent</p>
            <p className="text-xl font-bold font-display text-[#D4AF37]">₹{totalSpent.toFixed(1)} <span className="text-[10px] font-normal">Cr</span></p>
          </div>
        </div>

        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-2 mb-1">Participating Teams</h3>
        <div className="space-y-4">
          {data.teams.map(team => {
            const teamSpent = team.purse - team.remainingPurse;
            const progress = (teamSpent / team.purse) * 100;
            return (
              <div key={team.id} className="glass-card rounded-2xl p-4 flex flex-col gap-4 border-l-4 border-l-blue-600 transition-all hover:bg-white/5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold italic">
                        {team.name.substring(0,2).toUpperCase()}
                      </div>
                      <h2 className="text-lg font-bold font-display">{team.name}</h2>
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase">{team.playersCount} Players • ₹{teamSpent.toFixed(2)} Cr Spent</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-lg font-bold text-[#D4AF37] font-display">₹{team.remainingPurse.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">Cr Left</span></p>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav tournamentId={tournamentId!} />
    </div>
  );
};

export default SummaryPage;
