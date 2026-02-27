
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { PlayerStatus, Bid, Team } from '../types';
import BottomNav from '../components/BottomNav';
import { json } from 'stream/consumers';
import playersImages from '../src/assets/players/index.js'

const AuctionPage: React.FC = () => {
  const { tournamentId, playerId } = useParams<{ tournamentId: string, playerId: string }>();
  const navigate = useNavigate();
  const { getTournamentData, placeBid, finalizePlayer, bids, categories, players, isSyncing, clearBids } = useAuction();
  const data = getTournamentData(tournamentId || '');
  const [selectedBidTeam, setSelectedBidTeam] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [localSyncing, setLocalSyncing] = useState(false);

  const currentPlayer = players.find(p => p.id === playerId);
  const playerCategory = categories.find(c => c.id === currentPlayer?.categoryId);
  
  const playerBids = useMemo(() => 
    bids.filter(b => b.playerId === playerId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [bids, playerId]
  );

  useEffect(() => {
    clearBids();
  }, []);
  
  const currentHighestBid = playerBids[0];
  const nextMinBid = currentHighestBid ? currentHighestBid.amount + 0.1 : (playerCategory?.basePrice || 0);

  useEffect(() => {
    if (playerCategory) {
      setBidAmount(parseFloat(nextMinBid.toFixed(2)));
    }
  }, [currentPlayer, playerCategory, nextMinBid]);

  if (!data.tournament || !currentPlayer) return <div className="p-10 text-center text-slate-400">Loading auction data...</div>;

  const handlePlaceBid = () => {
    if (!selectedBidTeam) return alert("Please select a team from Section 2 first!");
    const error = placeBid({
      tournamentId: tournamentId!,
      playerId: playerId!,
      teamId: selectedBidTeam,
      amount: bidAmount
    });
    if (error) alert(error);
  };

  const handleSold = async () => {
    if (!currentHighestBid) return alert("No bids have been placed for this player yet!");
    setLocalSyncing(true);
    await finalizePlayer(currentPlayer.id, PlayerStatus.SOLD, currentHighestBid.teamId, currentHighestBid.amount);
    setLocalSyncing(false);
    navigate(`/selection/${tournamentId}`);
  };

  const handleUnsold = async () => {
    setLocalSyncing(true);
    await finalizePlayer(currentPlayer.id, PlayerStatus.UNSOLD);
    setLocalSyncing(false);
    navigate(`/selection/${tournamentId}`);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-[#020617] text-white overflow-hidden">
      {/* Dynamic Header */}
      <header className="shrink-0 pt-14 pb-4 px-5 flex justify-between items-center bg-slate-950/80 border-b border-white/5 z-20">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h1 className="text-lg font-bold font-display tracking-tight uppercase">Live Auction</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {isSyncing && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500 uppercase">
              <iconify-icon icon="lucide:refresh-cw" className="animate-spin" />
              Syncing Sheet...
            </div>
          )}
          <div className="bg-blue-600/10 border border-blue-500/20 px-3 py-1 rounded-full">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{data.tournament.name}</span>
          </div>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-8 no-scrollbar pb-40 transition-opacity ${localSyncing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        
        {/* SECTION 1: Current Player Card */}
        <section className="flex flex-col gap-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Section 1: Current Player</h3>
          <div className="relative rounded-[2rem] overflow-hidden glass-card border border-white/10 p-6 shadow-2xl">
            {/* Ambient Background Glow */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />
            
            <div className="flex flex-col md:flex-row gap-6 relative z-10">
              {/* Player Image - Large & Card Style */}
              <div className="w-full md:w-40 h-48 md:h-40 rounded-3xl bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                {currentPlayer.imageUrl ? (
                  <img src={playersImages[currentPlayer.imageUrl]} className="w-full h-full object-cover" alt={currentPlayer.name} />
                ) : (
                  <iconify-icon icon="lucide:user" className="text-6xl text-slate-700" />
                )}
              </div>
              
              {/* Player Info */}
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase tracking-wider">{playerCategory?.name}</span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">{currentPlayer.profile}</span>
                  </div>
                  <h2 className="text-4xl font-bold font-display leading-none mb-1 tracking-tight">{currentPlayer.name}</h2>
                  <p className="text-slate-400 text-sm font-medium tracking-wide">
                    ID: <span className="text-blue-500 font-bold">#{currentPlayer.sheetId || currentPlayer.id.slice(-4).toUpperCase()}</span>
                  </p>
                </div>
                
                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Base Price</p>
                    <p className="text-xl font-bold text-white">₹{playerCategory?.basePrice.toFixed(2)} Cr</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-red-400 uppercase font-bold tracking-widest mb-1 pulse-glow">Current Top Bid</p>
                    <p className="text-3xl font-bold text-yellow-500 font-display">
                      ₹{currentHighestBid ? currentHighestBid.amount.toFixed(2) : '0.00'} <span className="text-sm font-normal opacity-60">Cr</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Teams Overview Grid */}
        <section className="flex flex-col gap-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Section 2: Teams Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.teams.map(t => (
              <button 
                key={t.id} 
                onClick={() => setSelectedBidTeam(t.id)}
                className={`p-4 rounded-3xl border transition-all duration-300 text-left relative overflow-hidden ${
                  selectedBidTeam === t.id 
                  ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                  : 'glass-card border-white/5 hover:bg-white/5'
                }`}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold italic ${selectedBidTeam === t.id ? 'bg-white/20' : 'bg-blue-500/20 text-blue-400'}`}>
                      {t.name.substring(0,2).toUpperCase()}
                    </div>
                    <span className={`text-[10px] font-bold ${selectedBidTeam === t.id ? 'text-white' : 'text-slate-500'}`}>
                      {t.playersCount}/{data.tournament!.playersPerTeam}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold truncate mb-1">{t.name}</h4>
                  <p className={`text-[10px] font-bold ${selectedBidTeam === t.id ? 'text-blue-100' : 'text-yellow-500/80'}`}>
                    ₹{t.remainingPurse.toFixed(2)} Cr Left
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* SECTION 3: Bidding Controls & Audit History */}
        <section className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Section 3: Place Bid</h3>
            <div className="glass-card rounded-[2rem] p-6 border border-white/10 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adjust Amount</span>
                <div className="flex gap-2">
                <button onClick={() => setBidAmount(prev => parseFloat((prev + 0.05).toFixed(2)))} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all">+5L</button>
                  <button onClick={() => setBidAmount(prev => parseFloat((prev + 0.1).toFixed(2)))} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all">+10L</button>
                  <button onClick={() => setBidAmount(prev => parseFloat((prev + 0.25).toFixed(2)))} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all">+25L</button>
                  <button onClick={() => setBidAmount(prev => parseFloat((prev + 0.5).toFixed(2)))} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all">+50L</button>
                  <button onClick={() => setBidAmount(prev => parseFloat((prev + 1.0).toFixed(2)))} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all">+1Cr</button>
                </div>
              </div>
              
              <div className="relative group">
                <button 
                  onClick={handlePlaceBid}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] py-5 flex items-center justify-center gap-4 font-bold font-display text-xl shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all group"
                >
                  <iconify-icon icon="lucide:gavel" className="text-2xl group-hover:rotate-12 transition-transform" />
                  PLACE BID FOR {selectedBidTeam ? data.teams.find(t => t.id === selectedBidTeam)?.name : 'SELECTED TEAM'}
                  <span className="ml-2 bg-white/20 px-3 py-1 rounded-lg text-sm">₹{bidAmount.toFixed(2)} Cr</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Audit History</h3>
             <div className="glass-card rounded-[2rem] p-2 border border-white/5 min-h-[160px] max-h-[220px] overflow-y-auto no-scrollbar">
                {playerBids.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                    <iconify-icon icon="lucide:history" className="text-3xl mb-2 opacity-20" />
                    <p className="text-xs italic">No bidding history yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {playerBids.map((bid, i) => {
                      const team = data.teams.find(t => t.id === bid.teamId);
                      return (
                        <div key={bid.id} className={`flex items-center justify-between p-4 rounded-2xl border-l-4 transition-all ${
                          i === 0 
                          ? 'border-l-yellow-500 bg-yellow-500/5 shadow-lg' 
                          : 'border-l-blue-500/20 bg-white/5 opacity-60 scale-95'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold italic text-xs ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-400'}`}>
                              {team?.name.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{team?.name}</p>
                              <p className="text-[10px] text-slate-500">{new Date(bid.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                            </div>
                          </div>
                          <p className={`text-lg font-bold font-display ${i === 0 ? 'text-yellow-500' : 'text-slate-400'}`}>₹{bid.amount.toFixed(2)} Cr</p>
                        </div>
                      );
                    })}
                  </div>
                )}
             </div>
          </div>
        </section>

        {/* SECTION 4: Final Action Buttons */}
        <section className="flex flex-col gap-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Section 4: Final Verdict</h3>
          <div className="grid grid-cols-2 gap-4 pb-12">
            <button 
              onClick={handleSold}
              disabled={!currentHighestBid || localSyncing}
              className="py-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 disabled:grayscale rounded-[1.5rem] font-bold font-display text-lg uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 transition-all active:scale-95 border border-emerald-400/20"
            >
              <iconify-icon icon={localSyncing ? "lucide:refresh-cw" : "lucide:check-circle"} className={`text-2xl ${localSyncing ? 'animate-spin' : ''}`} /> 
              {localSyncing ? 'SYNCING...' : 'SOLD'}
            </button>
            <button 
              onClick={handleUnsold}
              disabled={localSyncing}
              className="py-6 bg-rose-600 hover:bg-rose-500 disabled:opacity-20 disabled:grayscale rounded-[1.5rem] font-bold font-display text-lg uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-rose-900/20 transition-all active:scale-95 border border-rose-400/20"
            >
              <iconify-icon icon={localSyncing ? "lucide:refresh-cw" : "lucide:x-circle"} className={`text-2xl ${localSyncing ? 'animate-spin' : ''}`} /> 
              {localSyncing ? 'SYNCING...' : 'UNSOLD'}
            </button>
          </div>
        </section>

      </main>

      {/* Persistent Bottom Navigation */}
      <BottomNav tournamentId={tournamentId!} />
    </div>
  );
};

export default AuctionPage;
