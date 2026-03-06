
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { PlayerStatus, PlayerProfile, Team, Player } from '../types';
import BottomNav from '../components/BottomNav';
import PlayerCard from '../components/PlayerCard';
import PlayerListItem from '../components/PlayerListItem';

// Define an enum for view modes
enum ViewMode {
  CARD = 'CARD',
  LIST = 'LIST'
}

interface EditTeamModalProps {
  team: Team;
  onUpdate: (updatedData: any) => void;
  onCancel: () => void;
}

const EditTeamModal: React.FC<EditTeamModalProps> = ({ team, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({ ...team });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Team</h2>
        {team.logo && (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-slate-600">
              <img src={team.logo} alt={`${team.name} logo`} className="w-full h-full object-cover" />
            </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Team Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-700 rounded-md p-2" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Team Owner</label>
            <input type="text" name="owner" value={formData.owner} onChange={handleChange} className="w-full bg-slate-700 rounded-md p-2" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Purse</label>
            <input type="number" name="purse" value={formData.purse} onChange={handleChange} className="w-full bg-slate-700 rounded-md p-2" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Remaining Purse</label>
            <input type="number" name="remainingPurse" value={formData.remainingPurse} onChange={handleChange} className="w-full bg-slate-700 rounded-md p-2" />
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-slate-600">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-blue-600">Update</button>
          </div>
        </form>
      </div>
    </div>
  );
};


const RosterPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { getTournamentData, players, categories, user, updateTeam, updatePlayer } = useAuction();
  const data = getTournamentData(tournamentId || '');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(data.teams[0]?.id || null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CARD); // Default to card view
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);


  useEffect(() => {
    if (!selectedTeamId && data.teams.length > 0) {
      setSelectedTeamId(data.teams[0].id);
    }
  }, [data.teams, selectedTeamId]);

  if (!data.tournament) return <div className="p-10 text-center">Tournament not found</div>;

  const activeTeam = data.teams.find(t => t.id === selectedTeamId) || data.teams[0];
  const teamRoster = players.filter(p => p.tournamentId === tournamentId && (p.status === PlayerStatus.SOLD || p.status === PlayerStatus.RETAINED) && p.soldToTeamId === activeTeam?.id);

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
  };

  const handleCancelEdit = () => {
    setEditingTeam(null);
    setEditingPlayer(null);
  };

  const handleUpdateTeam = async (updatedData: Team) => {
    const numericData = {
      ...updatedData,
      purse: parseFloat(String(updatedData.purse)),
      remainingPurse: parseFloat(String(updatedData.remainingPurse))
    }
    await updateTeam(numericData);
    setEditingTeam(null);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
  };

  const handleUpdatePlayer = async (updatedData: Player) => {
    const playerStatus = updatedData.soldToTeamId ? PlayerStatus.SOLD : PlayerStatus.AVAILABLE;
    await updatePlayer({ ...updatedData, status: playerStatus });
    setEditingPlayer(null);
  };

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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
              {activeTeam.logo && <img src={activeTeam.logo} className="w-full h-full object-cover" />}
            </div>
            <div>
              <h1 className="text-xl font-bold font-display">{activeTeam?.name || 'Rosters'}</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Squad Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode(ViewMode.LIST)} className={`p-2 rounded-md ${viewMode === ViewMode.LIST ? 'bg-blue-600/50' : 'bg-white/5'}`}> <iconify-icon icon="lucide:list" className="text-base" /> </button>
            <button onClick={() => setViewMode(ViewMode.CARD)} className={`p-2 rounded-md ${viewMode === ViewMode.CARD ? 'bg-blue-600/50' : 'bg-white/5'}`}> <iconify-icon icon="lucide:layout-grid" className="text-base" /> </button>
          </div>
        </div>

        {activeTeam && (
          <div className="glass-card rounded-2xl p-4 shadow-xl">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Spent</p>
                <p className="text-xl font-bold font-display text-white">₹{(activeTeam.purse - activeTeam.remainingPurse).toFixed(2)} <span className="text-xs font-normal opacity-60">Cr</span></p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] text-yellow-500 uppercase font-bold">Remaining</p>
                <p className="text-xl font-bold font-display text-yellow-500">₹{activeTeam.remainingPurse.toFixed(2)} <span className="text-xs font-normal opacity-60">Cr</span></p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Squad Slots</span>
                <span className="text-xs font-bold">{activeTeam.playersCount} <span className="text-slate-500">/ {data.tournament.playersPerTeam}</span></span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${(activeTeam.playersCount / data.tournament.playersPerTeam) * 100}%` }} />
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 px-5 py-6">
        <div className="flex gap-2 overflow-x-auto pb-6 -mx-5 px-5 no-scrollbar">
          {data.teams.map(t => (
            <button 
              key={t.id}
              onClick={() => setSelectedTeamId(t.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedTeamId === t.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 border border-white/10 text-slate-400'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {teamRoster.length === 0 ? (
          <div className="text-center py-20 text-slate-600 italic w-full">No players in this squad yet.</div>
        ) : (
          renderPlayerList(teamRoster)
        )}
      </main>

      <BottomNav tournamentId={tournamentId!} />

      {editingTeam && (
        <EditTeamModal 
          team={editingTeam} 
          onUpdate={handleUpdateTeam}
          onCancel={handleCancelEdit}
        />
      )}

    </div>
  );
};

export default RosterPage;
