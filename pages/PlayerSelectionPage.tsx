import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { PlayerStatus } from '../types';
import BottomNav from '../components/BottomNav';
import playersImages from '../src/assets/players/index.js'

const PlayerSelectionPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { getTournamentData, players, categories, isSyncing,
     refreshPlayersFromSheet,getPlayersFromSheetAPI,bulkAddPlayers } = useAuction();
  const data = getTournamentData(tournamentId || '');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  //const [loading, setLoading] = useState(true);

  // Load from sheet on mount
  useEffect(() => {
    if (tournamentId) {
      //refreshPlayersFromSheet(tournamentId); //not refreshing here because this causes unnecessary refresh
    }
  }, [tournamentId]);

  const refreshPlayerData = async() =>{
    try{
      
      if(tournamentId){
        console.log("refreshing player data from API ")
        const playersToAdd = await getPlayersFromSheetAPI(tournamentId);      
        if (playersToAdd.length > 0) {
          bulkAddPlayers(tournamentId, playersToAdd);        
        }
      }
    } catch (err: any) {
      console.error('getDataFromAPI error:', err);
      //setError(err.message || 'An error occurred while fetching API data');
    }
    
    
  } 

  if (!data.tournament) return <div className="p-10 text-center">Tournament not found</div>;

  // Filter to only show players NOT "SOLD" (Available or Unsold)
  const displayPlayers = players.filter(p => p.tournamentId === tournamentId && p.status !== PlayerStatus.SOLD);

  return (
    <div className="w-full h-screen flex flex-col bg-[#020617] text-white overflow-hidden">
      <header className="shrink-0 pt-14 pb-6 px-5 flex flex-col gap-1 bg-slate-950/50 border-b border-white/5">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold font-display tracking-tight">Select Player</h1>
            <div className="flex items-center gap-2 mt-1">
               {isSyncing && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase">
                  <iconify-icon icon="lucide:refresh-cw" className="animate-spin" />
                  Updating from Sheet...
                </span>
              )}
            </div>
          </div>
        
          <div className="flex items-center gap-2 px-3 py-1">        
          {/* Live Data  */}
          <div className = "flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20">
            <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 ">
              <button
                onClick={refreshPlayerData}
                // className="px-2 py-0.5 rounded hover:bg-blue-500/20 transition-colors focus:outline-none"
                className = "text-[10px] font-bold uppercase tracking-widest text-blue-400"
                type="button"
                disabled={isSyncing}
                title="Refresh Data"
              >
                {isSyncing ? 'Syncing...' : 'Live Data'}
              </button>
            </span>
          </div>
          {/* player count display */}
          <div className = " flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
              {displayPlayers.length} To Auction
            </span>
          </div>
          </div>
        </div>
        <p className="text-xs text-slate-400">Showing all Available and Unsold participants</p>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4 no-scrollbar pb-40">
        {displayPlayers.length === 0 && !isSyncing ? (
          <div className="text-center py-20 text-slate-500 italic flex flex-col items-center gap-3">
            <iconify-icon icon="lucide:search-x" className="text-4xl opacity-20" />
            <p>No remaining players available for selection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {displayPlayers.map(p => {
              const cat = categories.find(c => c.id === p.categoryId);
              const isSelected = selectedPlayerId === p.id;
              
              const statusColor = p.status === PlayerStatus.UNSOLD 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

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
                        <img src={playersImages[p.imageUrl]} className="w-full h-full object-cover" alt={p.name} />
                      ) : (
                        <iconify-icon icon="lucide:user" className="text-xl text-slate-600" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">
                          {p.sheetId ? <span className="text-blue-500 mr-2 font-display">#{p.sheetId}</span> : null}
                          {p.name}
                        </p>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-bold uppercase ${statusColor}`}>
                          {p.status}
                        </span>
                      </div>
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
          disabled={!selectedPlayerId || isSyncing}
          onClick={() => navigate(`/auction/${tournamentId}/${selectedPlayerId}`)}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:grayscale text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold font-display text-lg shadow-lg active:scale-95 transition-all"
        >
          {isSyncing ? 'REFRESHING DATA...' : 'NEXT'} <iconify-icon icon="lucide:chevron-right" />
        </button>
      </footer>

      <BottomNav tournamentId={tournamentId!} />
    </div>
  );
};

export default PlayerSelectionPage;
