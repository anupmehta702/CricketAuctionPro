
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tournament, Team, Category, Player, Bid, PlayerStatus, PlayerProfile } from '../types';

declare const XLSX: any;

interface AuctionContextType {
  tournaments: Tournament[];
  teams: Team[];
  categories: Category[];
  players: Player[];
  bids: Bid[];
  isSyncing: boolean;
  updateUrl: string;
  sheetUrl: string;
  setUpdateUrl: (url: string) => void;
  setSheetUrl: (url: string) => void;
  addTournament: (t: Omit<Tournament, 'id'>) => Tournament;
  updateTournament: (t: Tournament) => void;
  addTeam: (t: Omit<Team, 'id' | 'remainingPurse' | 'playersCount'>) => void;
  bulkAddTeams: (tournamentId: string, ts: (Omit<Team, 'id' | 'remainingPurse' | 'playersCount'> & { id?: string })[]) => void;
  deleteTeam: (id: string) => void;
  addCategory: (c: Omit<Category, 'id'>) => void;
  bulkAddCategories: (tournamentId: string, cs: (Omit<Category, 'id'> & { id?: string })[]) => void;
  deleteCategory: (id: string) => void;
  addPlayer: (p: Omit<Player, 'id' | 'status'>) => void;
  // Fix: Included status as an optional property in the input type for bulkAddPlayers
  bulkAddPlayers: (tournamentId: string, ps: (Omit<Player, 'id' | 'status'> & { id?: string, status?: PlayerStatus })[]) => void;
  deletePlayer: (id: string) => void;
  placeBid: (bid: Omit<Bid, 'id' | 'timestamp'>) => string | null;
  finalizePlayer: (playerId: string, status: PlayerStatus, teamId?: string, amount?: number) => Promise<boolean>;
  getTournamentData: (id: string) => { 
    tournament?: Tournament;
    teams: Team[];
    categories: Category[];
    players: Player[];
  };
  refreshPlayersFromSheet: (tournamentId: string) => Promise<void>;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

const DEFAULT_UPDATE_URL = "https://script.google.com/macros/s/AKfycbzo2OJydwjr8AKr5HwL5yvbitEMDfCuJFUaS2rWy6T0Kq4ObxF23tcDO-oB2ztOXRUl/exec";
const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1ksl1ohIMI4hEHI7Lvu6I1oFs_vWEIBhwYVEQQFsZLo0/edit?gid=1278278349#gid=1278278349";

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

  const [updateUrl, setUpdateUrlState] = useState<string>(() => {
    return localStorage.getItem('au_update_url') || DEFAULT_UPDATE_URL;
  });

  const [sheetUrl, setSheetUrlState] = useState<string>(() => {
    return localStorage.getItem('au_sheet_url') || DEFAULT_SHEET_URL;
  });

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('au_tournaments', JSON.stringify(tournaments));
    localStorage.setItem('au_teams', JSON.stringify(teams));
    localStorage.setItem('au_categories', JSON.stringify(categories));
    localStorage.setItem('au_players', JSON.stringify(players));
    localStorage.setItem('au_bids', JSON.stringify(bids));
    localStorage.setItem('au_update_url', updateUrl);
    localStorage.setItem('au_sheet_url', sheetUrl);
  }, [tournaments, teams, categories, players, bids, updateUrl, sheetUrl]);

  const setUpdateUrl = (url: string) => setUpdateUrlState(url);
  const setSheetUrl = (url: string) => setSheetUrlState(url);

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

  const bulkAddTeams = (tournamentId: string, ts: (Omit<Team, 'id' | 'remainingPurse' | 'playersCount'> & { id?: string })[]) => {
    const now = Date.now();
    const newTeams: Team[] = ts.map((t, idx) => ({
      ...t,
      id: t.id || `${now}-${idx}`,
      remainingPurse: t.purse,
      playersCount: 0
    }));
    setTeams(prev => {
      const otherTournamentTeams = prev.filter(t => t.tournamentId !== tournamentId);
      return [...otherTournamentTeams, ...newTeams];
    });
  };

  const deleteTeam = (id: string) => setTeams(prev => prev.filter(t => t.id !== id));

  const addCategory = (c: Omit<Category, 'id'>) => {
    const newCategory = { ...c, id: Date.now().toString() };
    setCategories(prev => [...prev, newCategory]);
  };

  const bulkAddCategories = (tournamentId: string, cs: (Omit<Category, 'id'> & { id?: string })[]) => {
    const now = Date.now();
    const newCategories: Category[] = cs.map((c, idx) => ({
      ...c,
      id: c.id || `${now}-${idx}`
    }));
    setCategories(prev => {
      const otherTournamentCategories = prev.filter(c => c.tournamentId !== tournamentId);
      return [...otherTournamentCategories, ...newCategories];
    });
  };

  const deleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));

  const addPlayer = (p: Omit<Player, 'id' | 'status'>) => {
    const newPlayer: Player = { ...p, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, status: PlayerStatus.AVAILABLE };
    setPlayers(prev => [...prev, newPlayer]);
  };

  // Fix: Included status as an optional property in the input type for bulkAddPlayers to resolve TypeScript error on line 158
  const bulkAddPlayers = (tournamentId: string, ps: (Omit<Player, 'id' | 'status'> & { id?: string, status?: PlayerStatus })[]) => {
    const now = Date.now();
    const newPlayers: Player[] = ps.map((p, idx) => ({
      ...p,
      id: p.id || `${now}-${idx}`,
      status: p.status || PlayerStatus.AVAILABLE
    }));
    setPlayers(prev => {
      const otherTournamentPlayers = prev.filter(p => p.tournamentId !== tournamentId);
      return [...otherTournamentPlayers, ...newPlayers];
    });
  };

  const deletePlayer = (id: string) => setPlayers(prev => prev.filter(p => p.id !== id));

  const refreshPlayersFromSheet = async (tournamentId: string) => {
    setIsSyncing(true);
    try {
      const idMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      const exportUrl = idMatch ? `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=xlsx` : sheetUrl;
      
      const response = await fetch(exportUrl);
      if (!response.ok) throw new Error('Failed to fetch sheet');
      
      const arrayBuffer = await response.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      
      const pSheet = wb.SheetNames.find((name: string) => name.toLowerCase() === 'sheet1');
      const cSheet = wb.SheetNames.find((name: string) => name.toLowerCase() === 'categories');

      if (!pSheet) throw new Error('Sheet1 not found');

      const categoryMap = new Map<string, string>();
      if (cSheet) {
        const cRows = XLSX.utils.sheet_to_json(wb.Sheets[cSheet]);
        cRows.forEach((row: any) => {
          const name = (row['Category Name'] || row['Category name'] || '').toString().toLowerCase().trim();
          const id = (row['Category ID'] || row['category id'] || row['ID'] || '').toString();
          if (name && id) categoryMap.set(name, id);
        });
      }

      const rows = XLSX.utils.sheet_to_json(wb.Sheets[pSheet]);
      const now = Date.now();
      const playersFromSheet = rows.map((row: any, idx: number) => {
        const catName = (row['Category'] || row['category'] || '').toString().toLowerCase().trim();
        const categoryId = categoryMap.get(catName) || '';
        
        let profile = PlayerProfile.BATSMAN;
        const pStr = (row['Profile'] || row['profile'] || '').toString().toLowerCase();
        if (pStr.includes('bowl')) profile = PlayerProfile.BOWLER;
        else if (pStr.includes('all') || pStr.includes('ar')) profile = PlayerProfile.ALL_ROUNDER;
        else if (pStr.includes('wk') || pStr.includes('keep')) profile = PlayerProfile.WK_BATSMAN;

        const sheetPlayerId = (row['id'] || row['ID'] || '').toString();
        const sheetStatusRaw = (row['status'] || row['Status'] || 'AVAILABLE').toString().toUpperCase();
        let status = PlayerStatus.AVAILABLE;
        if (sheetStatusRaw === 'SOLD') status = PlayerStatus.SOLD;
        if (sheetStatusRaw === 'UNSOLD') status = PlayerStatus.UNSOLD;

        return {
          id: sheetPlayerId || `player-${now}-${idx}`,
          tournamentId: tournamentId,
          sheetId: sheetPlayerId,
          name: (row['Full Name'] || row['full name'] || 'Unknown Player').toString(),
          mobileNumber: '',
          categoryId,
          profile,
          imageUrl: '',
          status
        };
      }).filter(p => p.name !== 'Unknown Player');

      bulkAddPlayers(tournamentId, playersFromSheet);
      console.log("Players refreshed from sheet successfully.");
    } catch (err) {
      console.error("Error refreshing players:", err);
    } finally {
      setIsSyncing(false);
    }
  };

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

  const syncPlayerToCloud = async (player: Player, teamIdForSync?: string, finalPrice?: number): Promise<boolean> => {
    const targetUrl = updateUrl || DEFAULT_UPDATE_URL;
    setIsSyncing(true);
    try {
      const cleanId = isNaN(Number(player.id)) ? player.id : Number(player.id);
      const cleanTeamId = (teamIdForSync !== undefined && !isNaN(Number(teamIdForSync))) ? Number(teamIdForSync) : (teamIdForSync || "");

      const payload = {
        "id": cleanId,
        "price": finalPrice || 0,
        "teamId": cleanTeamId,
        "status": player.status.toLowerCase()
      };

      console.log(`Cloud Sync: Sending POST to ${targetUrl}`, payload);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      console.log(`Cloud Sync Status: ${response.status}`);
      
      if (response.ok || response.status === 200) {
        console.log("Cloud Sync Success: Google Sheet updated.");
        return true;
      } else {
        console.warn(`Cloud Sync Warning: Received status ${response.status}`);
        return false;
      }
    } catch (err) {
      console.error("Cloud Sync Error:", err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const finalizePlayer = async (playerId: string, status: PlayerStatus, teamId?: string, amount?: number): Promise<boolean> => {
    const player = players.find(p => p.id === playerId);
    if (!player) return false;

    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, status, soldToTeamId: teamId, soldPrice: amount } : p
    ));

    if (status === PlayerStatus.SOLD && teamId && amount !== undefined) {
      setTeams(prev => prev.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            remainingPurse: parseFloat((t.remainingPurse - amount).toFixed(2)),
            playersCount: t.playersCount + 1
          };
        }
        return t;
      }));
    }

    return await syncPlayerToCloud({ ...player, status }, teamId, amount);
  };

  const getTournamentData = useCallback((id: string) => {
    return {
      tournament: tournaments.find(t => t.id === id),
      teams: teams.filter(t => t.tournamentId === id),
      categories: categories.filter(c => c.tournamentId === id),
      players: players.filter(p => p.tournamentId === id)
    };
  }, [tournaments, teams, categories, players]);

  return (
    <AuctionContext.Provider value={{
      tournaments, teams, categories, players, bids, isSyncing, updateUrl, sheetUrl, setUpdateUrl, setSheetUrl,
      addTournament, updateTournament, addTeam, bulkAddTeams, deleteTeam,
      addCategory, bulkAddCategories, deleteCategory, addPlayer, bulkAddPlayers, deletePlayer,
      placeBid, finalizePlayer, getTournamentData, refreshPlayersFromSheet
    }}>
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (context === undefined) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
};
