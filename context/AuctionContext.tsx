
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tournament, Team, Category, Player, Bid, PlayerStatus } from '../types';

interface AuctionContextType {
  tournaments: Tournament[];
  teams: Team[];
  categories: Category[];
  players: Player[];
  bids: Bid[];
  addTournament: (t: Omit<Tournament, 'id'>) => Tournament;
  updateTournament: (t: Tournament) => void;
  addTeam: (t: Omit<Team, 'id' | 'remainingPurse' | 'playersCount'>) => void;
  deleteTeam: (id: string) => void;
  addCategory: (c: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  addPlayer: (p: Omit<Player, 'id' | 'status'>) => void;
  bulkAddPlayers: (ps: Omit<Player, 'id' | 'status'>[]) => void;
  deletePlayer: (id: string) => void;
  placeBid: (bid: Omit<Bid, 'id' | 'timestamp'>) => string | null;
  finalizePlayer: (playerId: string, status: PlayerStatus, teamId?: string, amount?: number) => void;
  getTournamentData: (id: string) => { 
    tournament?: Tournament;
    teams: Team[];
    categories: Category[];
    players: Player[];
  };
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const saved = localStorage.getItem('au_tournaments');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('au_teams');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('au_categories');
    return saved ? JSON.parse(saved) : [];
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('au_players');
    return saved ? JSON.parse(saved) : [];
  });

  const [bids, setBids] = useState<Bid[]>(() => {
    const saved = localStorage.getItem('au_bids');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('au_tournaments', JSON.stringify(tournaments));
    localStorage.setItem('au_teams', JSON.stringify(teams));
    localStorage.setItem('au_categories', JSON.stringify(categories));
    localStorage.setItem('au_players', JSON.stringify(players));
    localStorage.setItem('au_bids', JSON.stringify(bids));
  }, [tournaments, teams, categories, players, bids]);

  const addTournament = (t: Omit<Tournament, 'id'>) => {
    const newTournament = { ...t, id: Date.now().toString() };
    setTournaments(prev => [...prev, newTournament]);
    return newTournament;
  };

  const updateTournament = (t: Tournament) => {
    setTournaments(prev => prev.map(item => item.id === t.id ? t : item));
  };

  const addTeam = (t: Omit<Team, 'id' | 'remainingPurse' | 'playersCount'>) => {
    const newTeam: Team = { 
      ...t, 
      id: Date.now().toString(), 
      remainingPurse: t.purse, 
      playersCount: 0 
    };
    setTeams(prev => [...prev, newTeam]);
  };

  const deleteTeam = (id: string) => setTeams(prev => prev.filter(t => t.id !== id));

  const addCategory = (c: Omit<Category, 'id'>) => {
    const newCategory = { ...c, id: Date.now().toString() };
    setCategories(prev => [...prev, newCategory]);
  };

  const deleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));

  const addPlayer = (p: Omit<Player, 'id' | 'status'>) => {
    const newPlayer: Player = { ...p, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, status: PlayerStatus.AVAILABLE };
    setPlayers(prev => [...prev, newPlayer]);
  };

  const bulkAddPlayers = (ps: Omit<Player, 'id' | 'status'>[]) => {
    const now = Date.now();
    const newPlayers: Player[] = ps.map((p, idx) => ({
      ...p,
      id: `${now}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      status: PlayerStatus.AVAILABLE
    }));
    setPlayers(prev => [...prev, ...newPlayers]);
  };

  const deletePlayer = (id: string) => setPlayers(prev => prev.filter(p => p.id !== id));

  const placeBid = (bidData: Omit<Bid, 'id' | 'timestamp'>): string | null => {
    const team = teams.find(t => t.id === bidData.teamId);
    const tournament = tournaments.find(t => t.id === bidData.tournamentId);
    
    if (!team) return "Team not found";
    if (!tournament) return "Tournament not found";
    if (bidData.amount > team.remainingPurse) return "Insufficient purse";
    if (team.playersCount >= tournament.playersPerTeam) return "Team squad full";

    const lastBid = bids.filter(b => b.playerId === bidData.playerId).sort((a, b) => b.amount - a.amount)[0];
    if (lastBid && bidData.amount <= lastBid.amount) return "Bid must be higher than current bid";

    const newBid: Bid = {
      ...bidData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    setBids(prev => [...prev, newBid]);
    return null;
  };

  const finalizePlayer = (playerId: string, status: PlayerStatus, teamId?: string, amount?: number) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return { ...p, status, soldToTeamId: teamId, soldPrice: amount };
      }
      return p;
    }));

    if (status === PlayerStatus.SOLD && teamId && amount !== undefined) {
      setTeams(prev => prev.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            remainingPurse: t.remainingPurse - amount,
            playersCount: t.playersCount + 1
          };
        }
        return t;
      }));
    }
  };

  const getTournamentData = useCallback((id: string) => {
    return {
      tournament: tournaments.find(t => t.id === id),
      teams: teams.filter(t => t.tournamentId === id),
      categories: categories.filter(c => c.tournamentId === id),
      players: players.filter(p => p.tournamentId === id),
    };
  }, [tournaments, teams, categories, players]);

  return (
    <AuctionContext.Provider value={{
      tournaments, teams, categories, players, bids,
      addTournament, updateTournament, addTeam, deleteTeam, addCategory, deleteCategory, addPlayer, bulkAddPlayers, deletePlayer,
      placeBid, finalizePlayer, getTournamentData
    }}>
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) throw new Error("useAuction must be used within an AuctionProvider");
  return context;
};
