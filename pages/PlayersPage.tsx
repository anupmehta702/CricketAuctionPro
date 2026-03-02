
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { Player, PlayerStatus, PlayerProfile } from '../types';
import BottomNav from '../components/BottomNav';
import playersImages from '../src/assets/players/index.js';

const PlayersPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const {
    players: allPlayers,
    categories,
    teams,
    refreshPlayersFromSheet,
    getPlayersFromSheetAPI,      
    getTournamentData,
    isSyncing,
    bulkAddPlayers
  } = useAuction();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'sold' | 'unsold'>('available');

  const data = getTournamentData(tournamentId || '');

  let players = allPlayers.filter(p => p.tournamentId === tournamentId);

  useEffect(() => {
    const loadPlayers = async () => {
      if (tournamentId && players.length === 0) {
        setLoading(true);
        try {
          const playersToAdd = await getPlayersFromSheetAPI(tournamentId);   
          if (playersToAdd.length > 0) {
            bulkAddPlayers(tournamentId, playersToAdd);        
          }   
        } catch (error) {
          console.error("Error fetching players:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadPlayers();
  }, [tournamentId, players.length, refreshPlayersFromSheet]);

  const handleRefresh = async () => {
    if (tournamentId) {
      try {
        const newPlayers = await getPlayersFromSheetAPI(tournamentId);
        if (newPlayers.length > 0) {
          bulkAddPlayers(tournamentId, newPlayers);        
        }
      } catch (error) {
        console.error("Error refreshing players:", error);
      }
    }
  };

  const getRoleColor = (profile: PlayerProfile) => {
    switch (profile) {
      case PlayerProfile.BATSMAN: return 'bg-gradient-to-br from-amber-400 to-amber-600';
      case PlayerProfile.BOWLER: return 'bg-gradient-to-br from-blue-400 to-blue-600';
      case PlayerProfile.ALL_ROUNDER: return 'bg-gradient-to-br from-emerald-400 to-emerald-600';
      default: return 'bg-gradient-to-br from-purple-400 to-purple-600';
    }
  };

  const getRoleAbbr = (profile: PlayerProfile) => {
    switch (profile) {
      case PlayerProfile.BATSMAN: return 'BAT';
      case PlayerProfile.BOWLER: return 'BOWL';
      case PlayerProfile.ALL_ROUNDER: return 'AR';
      default: return 'WK';
    }
  };

  const renderPlayerCard = (player: Player) => {
    const category = categories.find(c => c.id === player.categoryId);
    const team = teams.find(t => t.id === player.soldToTeamId);
    return (
      <div key={player.id} className="glass-card rounded-2xl p-4 flex gap-4 items-center group active:scale-[0.98] transition-all">
        <div className="w-14 h-14 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden">
          {player.imageUrl && playersImages[player.imageUrl] ? (
            <img src={playersImages[player.imageUrl]} className="w-full h-full object-cover" />
          ) : (
            <iconify-icon icon="lucide:user" className="text-2xl text-slate-600" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-base font-bold font-display">{player.name}</h3>
            <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${getRoleColor(player.profile)}`}>
              {getRoleAbbr(player.profile)}
            </span>
          </div>
          <p className="text-xs text-slate-400">{category?.name || 'Uncategorized'}</p>
        </div>
        <div className="text-right">
          {player.status === PlayerStatus.SOLD && team ? (
            <>
              <div className="flex gap-1.5 items-center justify-end">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">SOLD TO</p>
                <p className="text-sm font-bold">{team.name}</p>
              </div>
              <p className="text-lg font-bold text-yellow-500">₹{player.soldPrice?.toFixed(2)} Cr</p>
            </>
          ) : (
            <>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Base Price</p>
              <p className="text-lg font-bold text-yellow-500">{category?.basePrice} Cr</p>
            </>
          )}
        </div>
      </div>
    );
  };

  const availablePlayers = players.filter(p => p.status === PlayerStatus.AVAILABLE);
  const soldPlayers = players.filter(p => p.status === PlayerStatus.SOLD);
  const unsoldPlayers = players.filter(p => p.status === PlayerStatus.UNSOLD);

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] pb-24 text-white">
      <header className="shrink-0 pt-14 pb-6 px-5 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-md border-b border-white/5 flex justify-between items-center">
        <h1 className="text-xl font-bold font-display">All Players</h1>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20">
            <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
              <button
                onClick={handleRefresh}
                className="px-2 py-0.5 uppercase rounded hover:bg-blue-500/20 transition-colors focus:outline-none"
                type="button"
                disabled={isSyncing || loading}
                title="Refresh Data"
              >
                {/* <iconify-icon icon={(isSyncing || loading) ? 'line-md:loading-loop' : 'lucide:refresh-cw'} className="text-base" /> */}
                {(isSyncing || loading) ? 'Syncing...' : 'Live Data'}
              </button>
            </span>
          </div>
        
      </header>
      <main className="flex-1 px-5 py-6 space-y-8">
        {(loading) ? (
          <div className="text-center py-20 text-slate-600 italic">Loading players...</div>
        ) : (
          <>
            <div className="flex border-b border-slate-700">
              <button onClick={() => setActiveTab('available')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'available' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-slate-400'}`}>Available</button>
              <button onClick={() => setActiveTab('sold')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'sold' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-slate-400'}`}>Sold</button>
              <button onClick={() => setActiveTab('unsold')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'unsold' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-slate-400'}`}>Unsold</button>
            </div>

            <div className="py-6">
              {activeTab === 'available' && (
                <div>
                  <h2 className="text-lg font-bold mb-4">Available</h2>
                  {availablePlayers.length > 0 ? (
                    <div className="space-y-4">{availablePlayers.map(renderPlayerCard)}</div>
                  ) : (
                    <p className="text-slate-500">No available players.</p>
                  )}
                </div>
              )}
              {activeTab === 'sold' && (
                <div>
                  <h2 className="text-lg font-bold mb-4">Sold</h2>
                  {soldPlayers.length > 0 ? (
                    <div className="space-y-4">{soldPlayers.map(renderPlayerCard)}</div>
                  ) : (
                    <p className="text-slate-500">No sold players.</p>
                  )}
                </div>
              )}
              {activeTab === 'unsold' && (
                <div>
                  <h2 className="text-lg font-bold mb-4">Unsold</h2>
                  {unsoldPlayers.length > 0 ? (
                    <div className="space-y-4">{unsoldPlayers.map(renderPlayerCard)}</div>
                  ) : (
                    <p className="text-slate-500">No unsold players.</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <BottomNav tournamentId={tournamentId!} />
    </div>
  );
};

export default PlayersPage;
