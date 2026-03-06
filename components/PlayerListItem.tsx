
import React from 'react';
import { Player, PlayerStatus, Category, Team } from '../types';
import { useAuction } from '../context/AuctionContext';

interface PlayerListItemProps {
  player: Player;
  onEdit: (player: Player) => void;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({ player, onEdit }) => {
  const { categories, teams, user } = useAuction();
  const category = categories.find(c => c.id === player.categoryId);
  const team = teams.find(t => t.id === player.soldToTeamId);

  return (
    <div key={player.id} className="glass-card rounded-2xl p-4 flex gap-4 items-center group active:scale-[0.98] transition-all">
      <div className="w-14 h-14 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden">
        {player.imageUrl ? (
          <img src={player.imageUrl} className="w-full h-full object-cover" />
        ) : (
          <iconify-icon icon="lucide:user" className="text-2xl text-slate-600" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-base font-bold font-display">{player.name}</h3>
          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase`}>
            {player.profile}
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
      {user?.role === 'admin' && (
        <button onClick={() => onEdit(player)}
          className="bg-blue-600 text-white px-2 py-1 rounded-md text-xs">
          <iconify-icon icon="lucide:pencil" className="text-sm" />
        </button>
      )}
    </div>
  );
};

export default PlayerListItem;
