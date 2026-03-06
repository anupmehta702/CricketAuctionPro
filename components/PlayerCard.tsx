
import React from 'react';
import { Player, PlayerStatus, Category, Team } from '../types';
import { useAuction } from '../context/AuctionContext';

interface PlayerCardProps {
  player: Player;
  onEdit: (player: Player) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onEdit }) => {
  const { categories, teams, user } = useAuction();
  const category = categories.find(c => c.id === player.categoryId);
  const team = teams.find(t => t.id === player.soldToTeamId);

  const getStatusInfo = () => {
    switch (player.status) {
      case PlayerStatus.SOLD:
        return { text: 'SOLD', className: 'bg-green-500/20 text-green-400' };
      case PlayerStatus.UNSOLD:
        return { text: 'UNSOLD', className: 'bg-red-500/20 text-red-400' };
      default:
        return { text: 'AVAILABLE', className: 'bg-blue-500/20 text-blue-400' };
    }
  };
  const statusInfo = getStatusInfo();

  return (
    <div key={player.id} className="glass-card rounded-2xl p-3 flex flex-col group transition-all">
      <div className="aspect-[4/3] rounded-lg bg-slate-800 border border-white/10 relative overflow-hidden">
        {player.imageUrl ? (
          <img src={player.imageUrl} className="w-full h-full object-cover" alt={player.name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <iconify-icon icon="lucide:user" className="text-4xl text-slate-600" />
          </div>
        )}
        <div className={`absolute capitalize top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.className}`}>
          {statusInfo.text}
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => onEdit(player)}
            className="absolute top-2 right-2 bg-slate-900/50 backdrop-blur-sm text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <iconify-icon icon="lucide:pencil" className="text-sm" />
          </button>
        )}
      </div>
      <div className="pt-3">
        <p className="text-[10px] uppercase font-bold text-emerald-400">{player.profile.replace('_', ' ')}</p>
        <h3 className="text-base font-bold font-display leading-tight mt-1">{player.name}</h3>
      </div>
      <div className="border-t border-white/10 pt-3 mt-3">
        <p className="text-[10px] text-slate-500 uppercase font-bold">Category</p>
        <p className="text-sm font-semibold text-slate-300">{category?.name || 'Uncategorized'}</p>
      </div>
      <div className="border-t border-white/10 pt-3 mt-auto">
        {player.soldToTeamId ? (
          <>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
              {player.status === PlayerStatus.RETAINED ? `Retained by ${team?.name || ''}` : `Sold To: ${team?.name || 'N/A'}`}
            </p>
            <p className="text-lg font-bold text-yellow-500">₹{player.soldPrice?.toFixed(2)} Cr</p>
          </>
        ) : (
          <>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Base Price</p>
            <p className="text-lg font-bold text-yellow-500">{category?.basePrice || 'N/A'} Cr</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
