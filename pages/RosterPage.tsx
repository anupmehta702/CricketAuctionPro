
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { PlayerStatus, PlayerProfile, Team } from '../types';
import BottomNav from '../components/BottomNav';
import teamsImages from '../src/assets/teams/index.js';
import playersImages from '../src/assets/players/index.js';

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
  const { getTournamentData, players, categories, user, updateTeam } = useAuction();
  const data = getTournamentData(tournamentId || '');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(data.teams[0]?.id || null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (!selectedTeamId && data.teams.length > 0) {
      setSelectedTeamId(data.teams[0].id);
    }
  }, [data.teams, selectedTeamId]);

  if (!data.tournament) return <div className="p-10 text-center">Tournament not found</div>;

  const activeTeam = data.teams.find(t => t.id === selectedTeamId) || data.teams[0];
  const teamRoster = players.filter(p => p.tournamentId === tournamentId && p.status === PlayerStatus.SOLD && p.soldToTeamId === activeTeam?.id);

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
  };

  const handleCancelEdit = () => {
    setEditingTeam(null);
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
          {user?.role === 'admin' && (
              <button onClick={() => handleEditTeam(activeTeam)} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs">Edit Team</button>
          )}
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

        <div className="space-y-4">
          {teamRoster.length === 0 ? (
            <div className="text-center py-20 text-slate-600 italic">No players in this squad yet.</div>
          ) : (
            teamRoster.map(p => (
              <div key={p.id} className="glass-card rounded-2xl p-4 flex gap-4 items-center group active:scale-[0.98] transition-all">
                <div className="w-14 h-14 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden">
                  {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <iconify-icon icon="lucide:user" className="text-2xl text-slate-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-base font-bold font-display">{p.name}</h3>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${getRoleColor(p.profile)}`}>
                      {getRoleAbbr(p.profile)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{categories.find(c => c.id === p.categoryId)?.name || 'Capped'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Bought For</p>
                  <p className="text-lg font-bold text-yellow-500">₹{p.soldPrice?.toFixed(2)} Cr</p>
                </div>
              </div>
            ))
          )}
        </div>
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
