
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tournament, Team, Category, Player, Bid, PlayerStatus, PlayerProfile,FetchedPlayer } from '../types';

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
  addTournament: (t:Tournament) => Tournament;
  updateTournament: (t: Tournament) => void;
  addTeam: (t: Omit<Team, 'id' | 'remainingPurse' | 'playersCount'>) => void;
  bulkAddTeams: (tournamentId: string, ts: Team[]) => void;
  deleteTeam: (id: string) => void;
  addCategory: (c: Omit<Category, 'id'>) => void;
  bulkAddCategories: (tournamentId: string, cs: (Omit<Category, 'id'> & { id?: string })[]) => void;
  deleteCategory: (id: string) => void;
  addPlayer: (p: Omit<Player, 'id' | 'status'>) => void;
  // Fix: Included status as an optional property in the input type for bulkAddPlayers
  bulkAddPlayers: (tournamentId: string, ps: Player[]) => void;
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
  getTeamsFromSheetAPI: () => Promise<Team[]>;
  getPlayersTeamWiseFromAPI: (teamId : string,tournamentId: string) =>  Promise<Player[]>;
  getTournamentDetailsFromAPI:  (tournamentId:String) => Promise<Tournament[]>;
  getCategoriesDetailsFromAPI: (tournamentId:String) => Promise<Category[]>;
  getPlayersFromSheetAPI: (tournamentId: string) => Promise<Player[]>;
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
    console.log("Updating the localStorage with latest values !");
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

  const addTournament = (t: Tournament) => {
    //console.log("called addTournament with tid -->"+t.id);
    let newTournament:any;
    if(t.id === undefined){
      newTournament = { ...t, id: Date.now().toString() };    
    }else {
      newTournament = t;
    }
    // Check if tournament with t.id already exists, if so, update it and return the updated tournament
    const existing = tournaments.find(tournament => tournament.id === newTournament.id);
    if (existing) {
      console.log("Tournament already exists , so updating it ");
      updateTournament(newTournament);
      return newTournament;
    }
    console.log("Adding a new tournament with id -->"+t.id);
    setTournaments(prev => [...prev, newTournament]);
    return newTournament;
  };

  const updateTournament = (t: Tournament) => {
    //console.log("In update tournament with data -->"+JSON.stringify(t));
    setTournaments(prev => prev.map(item => item.id === t.id ? t : item));
  };

  const addTeam = (t: Omit<Team, 'id' | 'remainingPurse' | 'playersCount'>) => {
    const newTeam: Team = { 
      ...t, 
      id: Math.floor(8000 + Math.random() * 9000).toString(), 
      remainingPurse: t.purse, 
      playersCount: 0 
    };
    addTeamToSheet(newTeam)
    setTeams(prev => [...prev, newTeam]);
  };

  
  const bulkAddTeams = (tournamentId: string, newTeams: Team[]) => {
    setTeams(prev => {
      const otherTournamentTeams = prev.filter(t => t.tournamentId !== tournamentId);
      return [...otherTournamentTeams, ...newTeams];
    });
  };

  const deleteTeam = (id: string) => setTeams(prev => prev.filter(t => t.id !== id));

  const addCategory = (c: Omit<Category, 'id'>) => {
    const newCategory = { ...c, id: Math.floor(9000 + Math.random() * 9000).toString() };
    addCategoryToSheet(newCategory);
    setCategories(prev => [...prev, newCategory]);
  };

   // Function to add/update category details by calling Google Sheet web API
   const addCategoryToSheet = async (category: Category) => {
    if (!updateUrl) {
      console.error("updateUrl is not set.");
      return false;
    }
    try {
      const targetUrl = `${updateUrl}${updateUrl.includes('?') ? '&' : '?'}action=updateCategories`;
    
      const payload = {
        "Category ID": category.id,
        "Category Name": category.name,
        "Base Price": category.basePrice
      };
      console.log("Category ADD URL -->"+targetUrl+" payload -->"+JSON.stringify(payload));
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      console.log("Category added to sheet")

      if (!response.ok) {
        console.warn("Failed to update category in Google Sheet:", response.status, await response.text());
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error in addCategoryToSheet:", error);
      return false;
    }
  };
  // Function to add/update team details by calling Google Sheet web API
  const addTeamToSheet = async (team: Team) => {
    if (!updateUrl) {
      console.error("updateUrl is not set.");
      return false;
    }
    try {
      const targetUrl = `${updateUrl}${updateUrl.includes('?') ? '&' : '?'}action=updateTeams`;
      const payload = {
        "Team ID": team.id,
        "Team Name": team.name,
        "Team Owner": team.owner,
        "Purse": team.purse,
        "Remaining Purse value": team.remainingPurse,
        "tournamentId": team.tournamentId,
        "Players": team.playersCount || 0
      };
      console.log("Team ADD URL -->" + targetUrl + " payload -->" + JSON.stringify(payload));
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      console.log("Team added to sheet")

      if (!response.ok) {
        console.warn("Failed to update team in Google Sheet:", response.status, await response.text());
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in addTeamToSheet:", error);
      return false;
    }
  };

  // Function to add player by calling GOogle SHeet web API
  const addPlayerToSheet = async (player: Player) => {
    if (!updateUrl) {
      console.error("updateUrl is not set.");
      return false;
    }
    try {
      const targetUrl = `${updateUrl}${updateUrl.includes('?') ? '&' : '?'}action=updatePlayers`;
      const payload = {
        "ID": player.id,
        "Full Name": player.name,
        "price": player.soldPrice || 0,
        "teamId": player.soldToTeamId || "",
        "Status": player.status ? player.status.toLowerCase() : "available",
        "Profile": player.profile || "",
        "categoryId": player.categoryId,
        "tournamentId": player.tournamentId
      };
      console.log("Player ADD URL -->" + targetUrl + " payload -->" + JSON.stringify(payload));
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      console.log("Player added to sheet")

      if (!response.ok) {
        console.warn("Failed to update player in Google Sheet:", response.status, await response.text());
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error in addPlayerToSheet:", error);
      return false;
    }
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
    const newPlayer: Player = { ...p, 
      //id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      id:Math.floor(1000 + Math.random() * 9000).toString(),
      status: PlayerStatus.AVAILABLE };
      addPlayerToSheet(newPlayer);
    setPlayers(prev => [...prev, newPlayer]);
  };

  // Fix: Included status as an optional property in the input type for bulkAddPlayers to resolve TypeScript error on line 158
  const bulkAddPlayers = (tournamentId: string, ps: (Player[])) => {
    
    const now = Date.now();
    const newPlayers: Player[] = ps.map((p, idx) => ({
      ...p,
      id: p.id || `${now}-${idx}`,
      
    }));
    console.log("bulkAddAPlayers called for size of newPlayers -->"+newPlayers.length)
    //console.log(`tournamentID passed - ${tournamentId} for players - ${newPlayers}`)    
    
    
    
    setPlayers(prev => {
      //want to add only unique players 
      const existingIds = new Set(prev.map(p => p.id));
      const uniqueNewPlayers = newPlayers.filter(p => !existingIds.has(p.id));
      return [ ...uniqueNewPlayers];
    });
  };

  const deletePlayer = (id: string) => setPlayers(prev => prev.filter(p => p.id !== id));

  //TODO - update the below code to get data from googlesheet webapi
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


  const getPlayersTeamWiseFromAPI = async (teamId : string, tournamentId:string): Promise<Player[]> =>{
  
    const baseUrl = updateUrl || DEFAULT_UPDATE_URL;
    let teamsUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}action=getPlayersTeamWise`;
    teamsUrl += `&teamId=${teamId}`;
    console.log(`Fetching players team wise from: ${teamsUrl}`);

    try { 
      const response = await fetch(teamsUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });      
      if (!response.ok) throw new Error('Failed to fetch players team wise from API for teamId -->'+teamId);
    
      const responseData = await response.json();  
      
      if (responseData) {
        //const responseData = await playerRes.json();
        console.log(`Data for team ${teamId}:`, responseData);
      
        let players: Player[] = [];
        let teamInfo: any = {};

        if (Array.isArray(responseData)) {
          players = responseData;
        } else if (responseData && typeof responseData === 'object') {
          players = responseData.players || responseData.data || responseData.items || [];          
        
          if (players.length === 0 && !responseData.team && Object.keys(responseData).length > 0) {
             const values = Object.values(responseData);
            if (values.every(v => v && typeof v === 'object')) {
               players = values as Player[];
            }
          }
        } //elseIF
        setPlayers(players);
        return players;

      }// if (response.ok) 
    } catch (error: any) {
      console.error("Error while fetching playerDataTeamWise from web api  -->"+error);  
       throw error;
    }
    
  }// getPlayersTeamWiseFromAPI

  const getTeamsFromSheetAPI = async (): Promise<Team[]> => {
    const baseUrl = updateUrl || DEFAULT_UPDATE_URL;
    let teamsUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}action=getTeams`;
    
    console.log(`Fetching teams from: ${teamsUrl}`);
    
    try {
            
      const response = await fetch(teamsUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });
    
    
    
    if (!response.ok) throw new Error('Failed to fetch teams from API');
    
    const responseData = await response.json();
    console.log('Teams API response:', responseData);
    
    // Handle different response formats
    let teams: Team[] = [];
    if (Array.isArray(responseData)) {
      teams = responseData.map((team: any, idx: number) => ({
        id: (team.id || team['Team ID'] || team['Team id'] || team.ID || `team-${idx}`).toString(),
        name: (team.name || team['Team Name'] || team['team name'] || 'Unknown Team').toString(),
        owner: (team.owner || team['Team owner'] || team['Team Owner'] || 'N/A').toString(),
        purse: parseFloat(team.purse || team.Purse || team.purse || '100'),
        remainingPurse : parseFloat(team['Remaining Purse value'] || team['remaining purse value'] || '100'),
        tournamentId:(team.tournamentId || team['tournamentId'] || team['tournamentID'] || '1').toString(),
        playersCount: parseInt(team.Players || team.players || team.playersCount || '6')
      }));
    } else if (responseData && typeof responseData === 'object') {
      // Handle object with teams array
      const teamsArray = responseData.teams || responseData.data || responseData.items || [];
      teams = teamsArray.map((team: any, idx: number) => ({
        id: (team.id || team['Team ID'] || team['Team id'] || team.ID || `team-${idx}`).toString(),
        name: (team.name || team['Team Name'] || team['team name'] || 'Unknown Team').toString(),
        owner: (team.owner || team['Team owner'] || team['Team Owner'] || 'N/A').toString(),
        purse: parseFloat(team.purse || team.Purse || team.purse || '100'),
        remainingPurse : parseFloat(team['Remaining Purse value'] || team['remaining purse value'] || '100'),
        tournamentId:(team.tournamentId|| team['tournamentId']|| team['tournamentID']|| '1').toString(),
        playersCount: parseInt(team.Players || team.players || team.playersCount || '6')
      }));
    }

    if (teams.length === 0) {
      throw new Error('No teams found in API response');
    }
    setTeams(teams);
    return teams;
    } catch (error: any) {
      console.error("Error while fetching teams data from web api  -->"+error);
      // If CORS error, try without proxy or provide better error message
      if (error.message?.includes('CORS') || error.message?.includes('Access-Control')) {
        console.error('CORS Error:', error);        
       // throw new Error('CORS error: Please configure your Google Apps Script to allow CORS requests. See instructions in code comments.');
      }
       throw error;
    }
  };

  const getPlayersFromSheetAPI = async () => {
    if (!updateUrl) {
      throw new Error('updateUrl is not set');
    }
    try {
      const targetUrl = `${updateUrl}${updateUrl.includes('?') ? '&' : '?'}action=getPlayers`;
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch players from API');
      const responseData = await response.json();
      console.log('Players API response:', responseData);

      // Handle different response formats
      let players: Player[] = [];
      if (Array.isArray(responseData)) {
        console.log("In Array.isArray(responseData)")
        players = responseData.map((player: any, idx: number) => {
          console.log("in responseData.map -->"+JSON.stringify(player));  
          //set profile value
          let profile = PlayerProfile.BATSMAN;
          const pStr = player['Profile'].toString().toLowerCase();
          if (pStr.includes('bowl')) profile = PlayerProfile.BOWLER;
          else if (pStr.includes('all') || pStr.includes('ar')) profile = PlayerProfile.ALL_ROUNDER;
          else if (pStr.includes('wk') || pStr.includes('keep')) profile = PlayerProfile.WK_BATSMAN;

          //set status value 
          let status = PlayerStatus.AVAILABLE;
          if (player.status === 'SOLD') status = PlayerStatus.SOLD;
          if (player.status === 'UNSOLD') status = PlayerStatus.UNSOLD;

          let responsePlayer : Player = {  
          id: (player.id || player['ID'] || `player-${idx}`).toString(),
          name: (player.name || player['Full Name'] || player['full name'] || 'Unknown Player').toString(),
          soldPrice: parseFloat(player.price || player.soldPrice || '0'),
          soldToTeamId: (player.teamId || player['Team'] || player['teamId'] || ''),
          status: status,
          profile: profile,
          categoryId: (player.categoryId || player['categoryId'] || ''),
          tournamentId: (player.tournamentId || player['tournamentId'] || '').toString(),
          sheetId: player.sheetId || undefined,
          mobileNumber: player.mobileNumber || '',
          imageUrl: player.imageUrl || '',
          };
          console.log("reponse players -->"+JSON.stringify(responsePlayer))
          return responsePlayer;
        });
      } else if (responseData && typeof responseData === 'object') {
        const playersArray = responseData.players || responseData.data || responseData.items || [];
        players = playersArray.map((player: any, idx: number) => {              
          //set profile value
          let profile = PlayerProfile.BATSMAN;
          const pStr = player['Profile'].toString().toLowerCase();          
          if (pStr.includes('owl')) profile = PlayerProfile.BOWLER;
          else if (pStr.includes('ll') || pStr.includes('ar')) profile = PlayerProfile.ALL_ROUNDER;
          else if (pStr.includes('wk') || pStr.includes('keep')) profile = PlayerProfile.WK_BATSMAN;

          //set status value 
          let status = PlayerStatus.AVAILABLE;
          if (player.status === 'SOLD') status = PlayerStatus.SOLD;
          if (player.status === 'UNSOLD') status = PlayerStatus.UNSOLD;

          let responsePlayer: Player = {
          
          id: (player.id || player['ID'] || `player-${idx}`).toString(),
          name: (player.name || player['Full Name'] || player['full name'] || 'Unknown Player').toString(),
          soldPrice: parseFloat(player.price || player.soldPrice || '0'),
          soldToTeamId: (player.teamId || player['Team'] || player['teamId'] || ''),
          status,
          profile,
          categoryId: (player.categoryId || player['categoryId'] || ''),
          tournamentId:  (player['tournamentId']).toString(),
          sheetId: player.sheetId || undefined,
          mobileNumber: player.mobileNumber || '',
          imageUrl: player.imageUrl || '',
          } //playerResponse
          return responsePlayer;
        });//map
      }

      if (players.length === 0) {
        throw new Error('No players found in API response');
      }
      //setPlayers(players);
      //console.log("final player list -->"+JSON.stringify(players));
      return players;
    } catch (error: any) {
      console.error("Error while fetching players data from web api  -->" + error);
      if (error.message?.includes('CORS') || error.message?.includes('Access-Control')) {
        console.error('CORS Error:', error);        
      }
      throw error;
    }
  };

  const syncPlayerToCloud = async (player: Player, teamIdForSync?: string, finalPrice?: number): Promise<boolean> => {
    const baseUrl = updateUrl || DEFAULT_UPDATE_URL;
    const targetUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}action=auctionPlayer`;
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
   // console.log("Called get Tournament Data to get tournament, teams for Tid -->"+id);
    //console.log("teams -->"+JSON.stringify(teams));
    return {
      tournament: tournaments.find(t => t.id === id),
      teams: teams.filter(t => t.tournamentId === id),
      categories: categories.filter(c => c.tournamentId === id),
      players: players.filter(p => p.tournamentId === id)
    };
  }, [tournaments, teams, categories, players]);

  
const getTournamentDetailsFromAPI = async (tournamentId:String): Promise<Tournament[]> => {

  let currentTid = tournamentId;
  const baseUrl = updateUrl ;
      
  const targetUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}action=getTournaments`;
  //console.log("TargetURL to get tournament details -->"+targetUrl);
  const tournamentResponse =  await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  }); 
  let updatedTournamentMap : Tournament[] = [];    
  if (tournamentResponse.ok) {
    const response = await tournamentResponse.json();
    const tournaments = response.data;
          
    let tData : Tournament ;
    
    if (Array.isArray(tournaments) && tournaments.length > 0) {
      tournaments.map((tournament) =>  {
      const row = tournament;
      tData = {
              name: (row['name'] || row['Name'] || 'New Tournament').toString(),
              venue: (row['place'] || row['Place'] || 'Unknown Venue').toString(),
              auctionDate: (row['auctionDate'] || row['auction Date'] || new Date().toISOString().split('T')[0]).toString(),
              numberOfTeams: parseInt(row['No. of teams'] || row['no. of teams'] || row['numberOfTeams'] || '8'),
              playersPerTeam: parseInt(row['Players per team'] || row['players per team'] || row['playersPerTeam'] || '15'),
              sheetId: (row['tournament ID'] || row['tournament id'] || row['sheetId'] || '').toString(),
              id: (row['Tournament ID'] || row['tournament Id'] || row['tournamentId'] || row['id']).toString()
      };
      updatedTournamentMap.push(tData);
      
      }); //map 
    }// if clause  tournament
  } //if clause response
  return updatedTournamentMap; 
} //getTournamentDetailsFromAPI

const getCategoriesDetailsFromAPI = async (tournamentId: string): Promise<Category[]> => {
  const baseUrl = updateUrl;
  const targetUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}action=getCategories${tournamentId ? `&tournamentId=${tournamentId}` : ''}`;
  const catResponse = await fetch(targetUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  });
  let updatedCatMap: Category[] = [];
  if (catResponse.ok) {
    const response = await catResponse.json();
    const catArr = response.data;
    if (Array.isArray(catArr) && catArr.length > 0) {
      catArr.forEach((row) => {
        const cData: Category = {
          id: (row['Category ID'] || row['categoryID'] || row['category id'] || row['id']).toString(),
          sheetId: (row['sheetId'] || row['Sheet ID'] || row['sheet ID'] || '').toString(),
          tournamentId: tournamentId,
          name: (row['Category Name'] || row['categoryName'] || 'Unknown Category').toString(),
          basePrice : (row['Base Price'] || row['basePrice']|| 0)
        };
        updatedCatMap.push(cData);
      });
    }
  }
  return updatedCatMap;
};

  return (
    <AuctionContext.Provider value={{
      tournaments, teams, categories, players, bids, isSyncing, updateUrl, sheetUrl, setUpdateUrl, setSheetUrl,
      addTournament, updateTournament, addTeam, bulkAddTeams, deleteTeam,
      addCategory, bulkAddCategories, deleteCategory, addPlayer, bulkAddPlayers, deletePlayer,
      placeBid, finalizePlayer, getTournamentData, 
      refreshPlayersFromSheet,
      getTeamsFromSheetAPI,
      getPlayersTeamWiseFromAPI,
      getTournamentDetailsFromAPI,
      getCategoriesDetailsFromAPI,
      getPlayersFromSheetAPI
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
