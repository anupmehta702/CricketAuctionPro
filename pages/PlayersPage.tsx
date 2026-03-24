
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { Player, PlayerStatus, PlayerProfile, Category, Team } from '../types';
import BottomNav from '../components/BottomNav';
import PlayerCard from '../components/PlayerCard';
import PlayerListItem from '../components/PlayerListItem';
import EditPlayerModal from '../components/EditPlayerModal';

// Define an enum for view modes
enum ViewMode {
  CARD = 'CARD',
  LIST = 'LIST'
}

const PlayersPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const {
    players: allPlayers,
    categories,
    teams,
    getPlayersFromSheetAPI,      
    getTournamentData,
    isSyncing,
    bulkAddPlayers,
    user,
    updatePlayer
  } = useAuction();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'sold' | 'unsold'>('available');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CARD); // Default to card view

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
  }, [tournamentId, players.length]);

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

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
  };

  const handleCancelEdit = () => {
    setEditingPlayer(null);
  };

  const handleUpdatePlayer = async (updatedData: Player) => {
    const playerStatus = updatedData.soldToTeamId ? PlayerStatus.SOLD : PlayerStatus.AVAILABLE;
    await updatePlayer({ ...updatedData, status: playerStatus });
    setEditingPlayer(null);
  };

  const availablePlayers = players.filter(p => p.status === PlayerStatus.AVAILABLE);
  const soldPlayers = players.filter(p => p.status === PlayerStatus.SOLD || p.status === PlayerStatus.RETAINED);
  const unsoldPlayers = players.filter(p => p.status === PlayerStatus.UNSOLD);

  const renderPlayerList = (players: Player[]) => {
    if (players.length === 0) {
      return <p className="text-slate-500 w-full text-center py-10">No players in this category.</p>;
    }

    if (viewMode === ViewMode.LIST) {
      return <div className="space-y-4">{players.map(p => <PlayerListItem key={p.id} player={p} onEdit={handleEditPlayer} />)}</div>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {players.map(p => <PlayerCard key={p.id} player={p} onEdit={handleEditPlayer} />)}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] pb-24 text-white">
      <header className="shrink-0 pt-14 pb-6 px-5 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-md border-b border-white/5">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold font-display">All Players</h1>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20">
            <span className={`w-1.5 h-1.5 rounded-full ${loading || isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
            <button
              onClick={handleRefresh}
              className="px-2 py-0.5 uppercase rounded hover:bg-blue-500/20 transition-colors focus:outline-none text-[10px] font-bold tracking-widest text-blue-400"
              type="button"
              disabled={isSyncing || loading}
              title="Refresh Data"
            >
              {(isSyncing || loading) ? 'Syncing...' : 'Live Data'}
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex border-b border-slate-700">
            <button onClick={() => setActiveTab('available')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'available' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-slate-400'}`}>{`Available (${availablePlayers.length})`}</button>
            <button onClick={() => setActiveTab('sold')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'sold' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-slate-400'}`}>{`Sold (${soldPlayers.length})`}</button>
            <button onClick={() => setActiveTab('unsold')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'unsold' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-slate-400'}`}>{`Unsold (${unsoldPlayers.length})`}</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode(ViewMode.LIST)} className={`p-2 rounded-md ${viewMode === ViewMode.LIST ? 'bg-blue-600/50' : 'bg-white/5'}`}> <iconify-icon icon="lucide:list" className="text-base" /> </button>
            <button onClick={() => setViewMode(ViewMode.CARD)} className={`p-2 rounded-md ${viewMode === ViewMode.CARD ? 'bg-blue-600/50' : 'bg-white/5'}`}> <iconify-icon icon="lucide:layout-grid" className="text-base" /> </button>
          </div>
        </div>
      </header>
      <main className="flex-1 px-5 py-6 space-y-8">
        {(loading) ? (
          <div className="text-center py-20 text-slate-600 italic">Loading players...</div>
        ) : (
          <>
            {activeTab === 'available' && renderPlayerList(availablePlayers)}
            {activeTab === 'sold' && renderPlayerList(soldPlayers)}
            {activeTab === 'unsold' && renderPlayerList(unsoldPlayers)}
          </>
        )}
      </main>
      <BottomNav tournamentId={tournamentId!} />
      {editingPlayer && (
        <EditPlayerModal 
          player={editingPlayer} 
          onUpdate={handleUpdatePlayer}
          onCancel={handleCancelEdit}
          categories={categories}
          teams={teams.filter(t => t.tournamentId === tournamentId)}
        />
      )}
    </div>
  );
};

export default PlayersPage;
