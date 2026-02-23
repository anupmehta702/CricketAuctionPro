
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { PlayerStatus, Team,FetchedPlayer,Player } from '../types';
import BottomNav from '../components/BottomNav';

declare const XLSX: any;





const SummaryPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { getTournamentData, sheetUrl, updateUrl,getPlayersTeamWiseFromAPI,getTeamsFromSheetAPI } = useAuction();
  const data = getTournamentData(tournamentId || '');
  const [fetchedTeams, setFetchedTeams] = useState<Team[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<Record<string, FetchedPlayer[]>>({});
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 

  const getExportUrl = (url: string) => {
    try {
      const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (idMatch && idMatch[1]) {
        return `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=xlsx`;
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {        
           // 1. Get all teams from web API
          const teams = await getTeamsFromSheetAPI();
        
          // 2. For each teamId, hit the API to get players and team details
          let playersMap: Record<string, Player[]> = {};
          const updatedTeamsMap: Record<string, Team & { spent?: number, remaining?: number }> = {};
        
          await Promise.all(teams.map(async (team) => {
            //get team wise player details from Web api
            playersMap[team.id] = await getPlayersTeamWiseFromAPI(team.id,team.tournamentId); 
        
            updatedTeamsMap[team.id] = {
              ...team,
              spent: team.purse - (team.remainingPurse ?? 0),
              remaining: (team.remainingPurse ?? 0)
            }          
        }));

        const finalTeams = teams.map(t => updatedTeamsMap[t.id] || { ...t, spent: 0, remaining: t.purse });
        setFetchedTeams(finalTeams);
        setTeamPlayers(playersMap);
        if (finalTeams.length > 0) setActiveTeamId(finalTeams[0].id);
      } catch (err: any) {
        console.error('Summary fetch error:', err);
        setError(err.message || 'An error occurred while fetching summary data');
      } finally {
        setLoading(false);
      }
    };

    if (sheetUrl) {
      fetchData();
    } else {
      setLoading(false);
      setError('Sheet URL not configured. Please set it in Admin Setup.');
    }
  }, [sheetUrl]);

  if (!data.tournament) return <div className="p-10 text-center">Tournament not found</div>;

  const activeTeam = fetchedTeams.find(t => t.id === activeTeamId);
  const activePlayers = activeTeamId ? teamPlayers[activeTeamId] || [] : [];

  const filteredHeaders = activePlayers.length > 0 
    ? Object.keys(activePlayers[0]).filter(key => !['team name', 'status', 'teamid'].includes(key.toLowerCase()))
    : [];

  return (
    <div className="w-full h-screen flex flex-col bg-[#020617] text-white overflow-hidden">
      <header className="shrink-0 pt-14 pb-4 px-5 flex flex-col gap-4 bg-slate-950/50 border-b border-white/5">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-display tracking-tight">Auction Summary</h1>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20">
            <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
              {loading ? 'Syncing...' : 'Live Data'}
            </span>
          </div>
        </div>
        
        {/* Team Tabs */}
        {!loading && !error && fetchedTeams.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
            {fetchedTeams.map(team => (
              <button
                key={team.id}
                onClick={() => setActiveTeamId(team.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  activeTeamId === team.id 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                {team.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6 pb-28 no-scrollbar">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <iconify-icon icon="lucide:refresh-cw" className="text-4xl text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400 animate-pulse">Fetching live auction data...</p>
          </div>
        ) : error ? (
          <div className="glass-card rounded-2xl p-8 text-center border-l-4 border-l-red-500">
            <iconify-icon icon="lucide:alert-circle" className="text-3xl text-red-500 mb-2" />
            <p className="text-sm text-red-400 font-bold">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-white/5 rounded-lg text-xs font-bold hover:bg-white/10"
            >
              Retry Sync
            </button>
          </div>
        ) : activeTeam ? (
          <>
            {/* Purse Details Card */}
            <div className="glass-card rounded-2xl p-5 shadow-xl border border-white/5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Purse Spent</p>
                  <p className="text-xl font-bold font-display text-white">₹{(activeTeam as any).spent || 0} <span className="text-xs font-normal opacity-60">Cr</span></p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] text-yellow-500 uppercase font-bold">Remaining</p>
                  <p className="text-xl font-bold font-display text-yellow-500">₹{(activeTeam as any).remaining || 0} <span className="text-xs font-normal opacity-60">Cr</span></p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Total Budget</span>
                  <span className="text-xs font-bold">₹{(activeTeam as any).purse} Cr</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-500" 
                    style={{ width: `${Math.min(100, (((activeTeam as any).spent || 0) / (activeTeam as any).purse) * 100)}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Team Header Info */}
            <div className="flex justify-between items-end px-1">
              <div>
                <h2 className="text-xl font-bold font-display">{activeTeam.name}</h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Owner: {activeTeam.owner}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Squad Size</p>
                <p className="text-lg font-bold text-blue-400">{activePlayers.length}</p>
              </div>
            </div>

            {/* Players List (Card Layout) */}
            <div className="flex flex-col gap-3">
              {activePlayers.length > 0 ? (
                activePlayers.map((player, idx) => {
                  // Try to find common fields from the API response
                  const playerName = player['fullName'] || player['Full Name'] || player['Name'] || player['name'] || player['Player Name'] || 'Unknown Player';
                  const playerPrice = player['Price'] || player['price'] || player['Sold Price'] || player['sold price'] || player['Amount'] || player['amount'] || '0';
                  const playerProfile = player['Profile'] || player['profile'] || player['Role'] || player['role'] || '';
                  const playerCategory = player['Category'] || player['category'] || '';
                  const playerImage = player['Image'] || player['image'] || player['ImageUrl'] || player['imageUrl'] || '';
                  const playerId = player['ID'] || player['id'] || player['Player ID'] || '';

                  return (
                    <div
                      key={idx}
                      className="glass-card rounded-2xl p-4 flex items-center justify-between border border-white/5 hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 overflow-hidden">
                          {playerImage ? (
                            <img src={playerImage} className="w-full h-full object-cover" alt={playerName} />
                          ) : (
                            <iconify-icon icon="lucide:user" className="text-xl text-slate-600" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">
                              {playerId ? <span className="text-blue-500 mr-2 font-display">#{playerId}</span> : null}
                              {playerName}
                            </p>
                          </div>
                          <p className="text-[10px] text-blue-400 uppercase font-bold tracking-tighter">
                            {playerCategory}{playerCategory && playerProfile ? ' • ' : ''}{playerProfile}
                          </p>
                          
                          {/* Show other fields if any (excluding common ones) */}
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            {Object.entries(player).map(([key, val]) => {
                              const lowerKey = key.toLowerCase(); 
                              if (['fullname','name', 'full name', 'player name', 'price', 'sold price', 'amount', 'profile', 'role', 'category', 'image', 'imageurl', 'id', 'player id', 'team name', 'status', 'teamid'].includes(lowerKey)) return null;
                              return (
                                <span key={key} className="text-[8px] text-slate-500 uppercase">
                                  <span className="font-bold">{key}:</span> {String(val)}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Sold For</p>
                        <p className="text-sm font-bold text-yellow-500 font-display">₹{playerPrice} Cr</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center glass-card rounded-2xl border border-white/5">
                  <iconify-icon icon="lucide:users" className="text-3xl text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 italic">No players found in this squad</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 italic text-sm">
            No teams found for this tournament
          </div>
        )}
      </main>

      <BottomNav tournamentId={tournamentId!} />
    </div>
  );
};

export default SummaryPage;
