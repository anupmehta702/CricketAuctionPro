
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tournament, Team, Category, Player, Bid, PlayerStatus, PlayerProfile,FetchedPlayer, User } from '../types';
import { supabase } from '../src/supabaseClient';

declare const XLSX: any;

interface AuctionContextType {
  tournaments: Tournament[];
  teams: Team[];
  categories: Category[];
  players: Player[];
  bids: Bid[];
  user: User | null;
  isSyncing: boolean;
  updateUrl: string;
  sheetUrl: string;
  login: (user: User) => void;
  logout: () => void;
  setUpdateUrl: (url: string) => void;
  setSheetUrl: (url: string) => void;
  addTournament: (t:Tournament) => Promise<Tournament>;
  updateTournament: (t: Tournament) => void;
  addTeam: (t: Omit<Team, 'id' | 'remainingPurse' | 'playersCount'>) => void;
  updateTeam: (team: Team) => Promise<void>;
  bulkAddTeams: (tournamentId: string, ts: Team[]) => void;
  deleteTeam: (id: string) => void;
  addCategory: (c: Omit<Category, 'id'>) => void;
  bulkAddCategories: (tournamentId: string, cs: (Omit<Category, 'id'> & { id?: string })[]) => void;
  deleteCategory: (id: string) => void;
  addPlayer: (p: Omit<Player,'id'>) => void;
  updatePlayer: (player: Player) => void;
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
  //refreshPlayersFromSheet: (tournamentId: string) => Promise<void>;
  getTeamsFromSheetAPI: () => Promise<Team[]>;
  getPlayersTeamWiseFromAPI: (teamId : string,tournamentId: string) =>  Promise<Player[]>;
  getTournamentDetailsFromAPI:  () => Promise<Tournament[]>;
  getCategoriesDetailsFromAPI: (tournamentId:String) => Promise<Category[]>;
  getPlayersFromSheetAPI: () => Promise<Player[]>;
  clearBids: () => void;
  uploadImage: (file: File) => Promise<string>;
  loadDataFromDB: () => Promise<void>;
  flushLocalStorage: () => void;

}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

const DEFAULT_UPDATE_URL = "https://script.google.com/macros/s/AKfycbyMwe8LcW6XsLdl_pKZvcL7o7aQjyAS7KYkvG3rZUJIJL8ATVAUjnTds5BMgtBa4TxkCA/exec";
const DEFAULT_API_UPDATE_URL = "/api" //proxy is configured in vite.config.ts
const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1ksl1ohIMI4hEHI7Lvu6I1oFs_vWEIBhwYVEQQFsZLo0/edit?gid=0#gid=0";

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

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('au_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [updateUrl, setUpdateUrlState] = useState<string>(() => {
    return localStorage.getItem('au_update_url') || DEFAULT_UPDATE_URL;
  });

  const [updateAPIUrl, setUpdateAPIUrlState] = useState<string>(() => {
    return localStorage.getItem('au_api_update_url') || DEFAULT_API_UPDATE_URL;
  });

  const [sheetUrl, setSheetUrlState] = useState<string>(() => {
    return localStorage.getItem('au_sheet_url') || DEFAULT_SHEET_URL;
  });

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    console.log("Updating the localStorage with latest values with tournament -->"+JSON.stringify(tournaments));
    localStorage.setItem('au_tournaments', JSON.stringify(tournaments));
    localStorage.setItem('au_teams', JSON.stringify(teams));
    localStorage.setItem('au_categories', JSON.stringify(categories));
    localStorage.setItem('au_players', JSON.stringify(players));
    localStorage.setItem('au_bids', JSON.stringify(bids));
    if (user) {
      localStorage.setItem('au_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('au_user');
    }
    localStorage.setItem('au_update_url', updateUrl);
    localStorage.setItem('au_sheet_url', sheetUrl);
  }, [tournaments, teams, categories, players, bids, user, updateUrl, sheetUrl]);

  const login = (user: User) => setUser(user);
  const logout = () => setUser(null);

  const setUpdateUrl = (url: string) => setUpdateUrlState(url);
  const setSheetUrl = (url: string) => setSheetUrlState(url);

  const loadDataFromDB = async () => {
    setIsSyncing(true);
    console.log('in load Data from DB !!!!')
    try {      
      let tournamentMap = await getTournamentDetailsFromAPI();
      let currentTid = '';
      if(tournamentMap.length > 0) {
        tournamentMap.map(async (tournament) => {
          const newT = await addTournament(tournament); //adds tournaments as well as updates cache            
          currentTid = newT.id;      
                                  
        });  
      } else {
        console.log("No tournament details found !");
      }      

      const catsToAdd = await getCategoriesDetailsFromAPI(currentTid);
      if (catsToAdd.length > 0) 
        bulkAddCategories(currentTid, catsToAdd);  

      const teamsToAdd = await getTeamsFromSheetAPI();
      if (teamsToAdd.length > 0)
         bulkAddTeams(currentTid, teamsToAdd);


      const playersToAdd = (await getPlayersFromSheetAPI());
      if (playersToAdd.length > 0) {
        bulkAddPlayers(currentTid, playersToAdd);        
      }
      
      alert("Master Sync Complete from DB! Tournament details, Teams, Categories, and Players imported.");
    } catch (err) {
      console.error("Master Sync Error:", err);
      alert("Failed to perform Master Sync. Check URL and connectivity.");
    } finally {
      setIsSyncing(false);
    }
    console.log('end - loadDataFromDB !')
  };


  const addTournament = async (t: Tournament) => {    
    console.log('In add tournament !!')
    /*let newTournament:any;
    if(t.id === undefined){
      newTournament = { ...t, id: Date.now().toString() };    
    }else {
      newTournament = t;
    }*/
    if(t.id && t.id !== '0' ){      
      // Check if tournament with t.id already exists, if so, update it and return the updated tournament
      console.log( 'Tournament already exists with id -->'+t.id)
      const existing = tournaments.find(tournament => tournament.id === t.id);      
      if (existing) {
        console.log(`Tournament - ${t.id} already exists in cache, so updating it`);
        updateTournament(t);        
      }else {
        console.log(`Tournament - ${t.id} not present in cache so adding it `)
        setTournaments(prev => [...prev, t]);  
      }
      return t;
    }    
    //Add tournamnet via API
    const targetUrl = updateAPIUrl+"/tournaments"
    //const targetUrl = 'http://localhost:3001/tournaments';
    const payload = {
        "name" : t.name,
        "organization" : t.name,
        "players_per_team" : t.playersPerTeam,
        "no_of_teams" : t. numberOfTeams,
        "created_at" : t.auctionDate,
        "venue" : t.venue
    }
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    
    if(response.ok){
      const responseData = await response.json();
      console.log("Added new tournament with response -->"+JSON.stringify(responseData));    
      const newTournament = { ...t, id: (responseData.id || responseData.data?.id || t.id).toString() };  
      setTournaments(prev => [...prev, newTournament]);
      return newTournament;  
    } 
    return null; 
    
  };

  const updateTournament = (t: Tournament) => {
    //console.log("In update tournament with data -->"+JSON.stringify(t));
    setTournaments(prev => prev.map(item => item.id === t.id ? t : item));
  };

  const addTeam = async (t: Omit<Team, 'id' | 'remainingPurse' | 'playersCount'>) => {
    const newTeam: Team = { 
      ...t, 
      id: Math.floor(8000 + Math.random() * 9000).toString(), 
      remainingPurse: t.purse, 
      playersCount: 0,
      logo: t.logo || '' 
    };
    console.log('Adding team with id -->'+ JSON.stringify(newTeam) )
    const teamId = await addTeamToSheet(newTeam)
    const teamToAdd: Team = {...newTeam,id:teamId}
    setTeams(prev => [...prev, teamToAdd]);
  };

  const updateTeam = async (updatedTeam: Team) => {
    try {
      const targetUrl = `${updateAPIUrl}/teams/${updatedTeam.id}`;
      const payload = {
        "name": updatedTeam.name,
        "owner": updatedTeam.owner,
        "purse_total": updatedTeam.purse,
        "purse_remaining": updatedTeam.remainingPurse,
        "players_count": updatedTeam.playersCount || 0,
        "logo": updatedTeam.logo,
        "tournament_id": updatedTeam.tournamentId
      };
      
      const response = await fetch(targetUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log(`updated team using --> ${targetUrl} and request body ${JSON.stringify(payload)} ` )
      if (response.ok) {
        setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
      } else {
        console.error('Failed to update team:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating team:', error);
    }
  };
  
  const bulkAddTeams = (tournamentId: string, newTeams: Team[]) => {
    setTeams(prev => {
      const otherTournamentTeams = prev.filter(t => t.tournamentId !== tournamentId);
      const currentTournamentTeams = prev.filter(t => t.tournamentId === tournamentId);

      const teamMap = new Map<string, Team>();
      currentTournamentTeams.forEach(t => teamMap.set(t.id, t));
      newTeams.forEach(t => teamMap.set(t.id, t));

      const mergedTeams = Array.from(teamMap.values());

      return [...otherTournamentTeams, ...mergedTeams];
    });
  };

  const deleteTeam = (id: string) => setTeams(prev => prev.filter(t => t.id !== id));

  const addCategory = async (c: Omit<Category, 'id'>) => {
    const newCategory = { ...c, id: Math.floor(9000 + Math.random() * 9000).toString() };
    const id = await addCategoryToSheet(newCategory);
    const categoryToAdd : Category =  {...newCategory,id:id}
    setCategories(prev => [...prev, categoryToAdd]);
  };

   // Function to add/update category details by calling Google Sheet web API
   const addCategoryToSheet = async (category: Category) => {
    if (!updateUrl) {
      console.error("updateUrl is not set.");
      return false;
    }
    try {
      //const targetUrl = `${updateUrl}${updateUrl.includes('?') ? '&' : '?'}action=updateCategories`;
      const targetUrl = updateAPIUrl + "/categories"
      /*const payload = {
        "Category ID": category.id,
        "Category Name": category.name,
        "Base Price": category.basePrice
      };*/
      const payload = {        
        "name": category.name,
        "base_price": category.basePrice
      };
      console.log("Category ADD URL -->"+targetUrl+" payload -->"+JSON.stringify(payload));
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      console.log("Category added to sheet")
      const responseData = await response.json();
      if (!response.ok) {
        console.warn("Failed to update category in Google Sheet:", response.status);
        return false;
      }
      return responseData.id;
    } catch (error) {
      console.error("Error in addCategoryToSheet:", error);
      return null;
    }
  };
  // Function to add/update team details by calling Google Sheet web API
  const addTeamToSheet = async (team: Team) => {
    if (!updateUrl) {
      console.error("updateUrl is not set.");
      return false;
    }
    try {
      //const targetUrl = `${updateUrl}${updateUrl.includes('?') ? '&' : '?'}action=updateTeams`;
      const targetUrl = updateAPIUrl+"/teams"
      /*const payload = {
        "Team ID": team.id,
        "Team Name": team.name,
        "Team Owner": team.owner,
        "Purse": team.purse,
        "Remaining Purse value": team.remainingPurse,
        "tournamentId": team.tournamentId,
        "Players": team.playersCount || 0,
        logo: team.logo
      };*/
      const payload = {        
        "tournament_id": team.tournamentId,
        "name": team.name,
        "owner": team.owner,
        "purse_total": team.purse,
        "purse_remaining": team.remainingPurse,
        "players_count": team.playersCount || 0,
        logo : team.logo
      }
      console.log("Team ADD URL -->" + targetUrl + " payload -->" + JSON.stringify(payload));
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      const responseData = await response.json();
      console.log(`Team with id - ${responseData.id} added to sheet`)

      if (!response.ok) {
        console.warn("Failed to update team in Supa DB :", response.status);
        return false;
      }
      
      return responseData.id;
    } catch (error) {
      console.error("Error in addTeamToSheet:", error);
      return null;
    }
  };

  // Function to add player by calling GOogle SHeet web API
  const addPlayerToSheet = async (player: Player) => {
    if (!updateUrl) {
      console.error("updateUrl is not set.");
      return false;
    }
    try {
      //const targetUrl = `${updateUrl}${updateUrl.includes('?') ? '&' : '?'}action=updatePlayers`;
      const targetUrl = updateAPIUrl + "/players"
      /*const payload = {
        "ID": player.id,
        "Full Name": player.name,
        "price": player.soldPrice || 0,
        "teamId": player.soldToTeamId || "",
        "Status": player.status ? player.status.toLowerCase() : "available",
        "Profile": player.profile || "",
        "categoryId": Number(player.categoryId),        
        "tournamentId": player.tournamentId,
        "imageUrl": player.imageUrl || "",
        "mobileNumber": player.mobileNumber || ""
      };*/

      const profiles = await getProfilesData();
      //console.log("profiles -->"+JSON.stringify(profiles));
      const profile = profiles.filter((profile: any) =>
         profile.name.toLowerCase() === player.profile.toLowerCase())
      //console.log("Matching profile -->"+JSON.stringify(profile));
      const payload  = [{  
        "name": player.name,
        "price": player.soldPrice || 0,
        "status": player.status ? player.status.toUpperCase() : "AVAILABLE",
        "profile_id": profile.id || "d1ed51f7-66b5-4d73-be3c-3dbb600f31cb",
        "category_id": player.categoryId,        
        "tournament_id": player.tournamentId,
        "image_url": player.imageUrl || "",        
      }];
      console.log("Player ADD URL -->" + targetUrl + " payload -->" + JSON.stringify(payload));
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      const responseData = await response.json();
      //console.log("Player added to sheet with id -->"+responseData.id );
      if (!response.ok) {
        console.warn("Failed to update player in Supa DB:", response.status);
        return null;
      }
      return responseData.id;
    } catch (error) {
      console.error("Error in addPlayerToSheet:", error);
      return null;
    }
  };




  const bulkAddCategories = (tournamentId: string, cs: (Omit<Category, 'id'> & { id?: string })[]) => {
    //console.log("tournamentID in bulkAddCategories --> "+tournamentId);
    const now = Date.now();
    const newCategories: Category[] = cs.map((c, idx) => ({
      ...c,
      id: c.id || `${now}-${idx}`,
      tournamentId: tournamentId
    }));
    

    //console.log(`Adding ${newCategories.length} categories for tournamentId - ${tournamentId} in local storage` );
    //setCategories(newCategories);
     setCategories(prev => {
       const otherTournamentCategories = prev.filter(c => c.tournamentId !== tournamentId);
       return [...otherTournamentCategories, ...newCategories];
     });
  };

  const deleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));

  const addPlayer = async (p: Omit<Player,'id'>) => {
    const newPlayer: Player = { ...p, 
      //id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      id:Math.floor(1000 + Math.random() * 9000).toString(),
      status: PlayerStatus.AVAILABLE,
      soldToTeamId: p.soldToTeamId || '',
      soldPrice: p.soldPrice || 0
    };
    console.log(`player to add -> ${JSON.stringify(newPlayer)}`);
    const playerId = await addPlayerToSheet(newPlayer);
    const playerToAdd : Player = {...newPlayer,id:playerId}
    setPlayers(prev => [...prev, playerToAdd]);
  };

  const updatePlayer = async (updatedPlayer: Player) => {
    //const response = await addPlayerToSheet(updatedPlayer);

    const profiles: any[] = await getProfilesData();
    const selectedProfile = profiles.filter(p => p.name.toLowerCase() === updatedPlayer.profile.toLowerCase())
    let profile_id ="";
    if(selectedProfile){
        profile_id = selectedProfile[0].id;
        console.log(`profile id for player -->${profile_id}`)
    }
    try{
      const targetUrl = `${updateAPIUrl}/players/${updatedPlayer.id}`;
    const payload  ={  
      "name": updatedPlayer.name,
      "price": updatedPlayer.soldPrice || 0,
      "status": updatedPlayer.status ? updatedPlayer.status.toUpperCase() : "AVAILABLE",      
      "category_id": updatedPlayer.categoryId,        
      "tournament_id": updatedPlayer.tournamentId,
      "image_url": updatedPlayer.imageUrl || "", 
      "team_id" : updatedPlayer.soldToTeamId       
    };
      
      const response = await fetch(targetUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log(`updated player using --> ${targetUrl} and request body ${JSON.stringify(payload)} ` )
    if (response){
      setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
    }else {
      console.log("Updating player failed !");
    }
    }catch (error) {
      console.error('Error updating player :', error);
    }
    
    
  };

  // Fix: Included status as an optional property in the input type for bulkAddPlayers to resolve TypeScript error on line 158
  const bulkAddPlayers = (tournamentId: string, ps: (Player[])) => {
    
    const now = Date.now();
    const newPlayers: Player[] = ps.map((p, idx) => ({
      ...p,
      id: p.id || `${now}-${idx}`,
      soldToTeamId: p.soldToTeamId,
      soldPrice: p.soldPrice,
      status: p.status
      
    }));
    console.log(`bulkAddAPlayers called for  ${newPlayers.length} players for tournamentId - ${tournamentId}`);
    //console.log("newPLayers Data  -->"+JSON.stringify(newPlayers));
    //console.log(`tournamentID passed - ${tournamentId} for players - ${newPlayers}`)    
    
    setPlayers((prevPlayers) => {
      if(!prevPlayers || prevPlayers.length === 0){
        console.log("No previous player stored in cache, hence adding all the players from API")
        return newPlayers;
      }
      const playerMap = new Map(prevPlayers.map(p => [p.id, p]));
    
      newPlayers.forEach((newPlayer) => {
        playerMap.set(newPlayer.id, newPlayer); // overwrite if exists, add if not
      });
    
      return Array.from(playerMap.values());
    });
    
    /*setPlayers(prev => {
      //want to add only unique players 
      if(prev){
        const existingIds = new Set(prev.map(p => p.id));
        console.log("Existing ids -->"+JSON.stringify(existingIds)+"size of existing Ids -->"+existingIds.size);
        if(!existingIds || existingIds.size === 0){
          console.log('No existing players found, hence adding new ones !')
          return newPlayers;
        }
        
        const uniqueNewPlayers = newPlayers.filter(p => !existingIds.has(p.id));
        console.log(`In SetPlayers for ${uniqueNewPlayers.length} players !`)
        
        return [ ...uniqueNewPlayers];
      }else {
        console.log('no previous players found in cache, hence adding new ones !')
        return newPlayers;
      }
      
    });*/
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

  const getProfilesData = async () : Promise<any>  => {
    const targetUrl = updateAPIUrl+"/profiles";
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
    });
    if (!response.ok) throw new Error('Failed to fetch profiles from API');
    const responseData = await response.json();
    return responseData;

  };

  const getPlayersTeamWiseFromAPI = async (teamId : string, tournamentId:string): Promise<Player[]> => {
  
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
        //setPlayers(players); // this unecessarily corrupts localstorage (au_players) by storing only players per team
        return players;

      }// if (response.ok) 
    } catch (error: any) {
      console.error("Error while fetching playerDataTeamWise from web api  -->"+error);  
       throw error;
    }
    
  }// getPlayersTeamWiseFromAPI

  const getTeamsFromSheetAPI = async (): Promise<Team[]> => {
    const baseAPIUrl = updateAPIUrl;
    let teamsUrl = baseAPIUrl + "/teams";
    //const baseUrl = updateUrl || DEFAULT_UPDATE_URL;
    //let teamsUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}action=getTeams`;
    
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
        id: ( team['id'] || team.id || team['Team ID'] || team['Team id'] || team.ID || `team-${idx}`).toString(),
        name: (team.name || team['Team Name'] || team['team name'] || 'Unknown Team').toString(),
        owner: (team.owner || team['Team owner'] || team['Team Owner'] || 'N/A').toString(),
        purse: parseFloat( team['purse_total'] || team.purse || team.Purse || team.purse || '100'),
        remainingPurse : parseFloat( team['purse_remaining'] || team['Remaining Purse value'] || team['remaining purse value'] || '100'),
        tournamentId:(team['tournament_id']|| team.tournamentId || team['tournamentId'] || team['tournamentID'] || '1').toString(),
        playersCount: parseInt(team['players_count'] || team.Players || team.players || team.playersCount || '0'),
        logo: (team.logo || team['logo'] || '')
      }));
    } else if (responseData && typeof responseData === 'object') {
      // Handle object with teams array
      const teamsArray = responseData.teams || responseData.data || responseData.items || [];
      teams = teamsArray.map((team: any, idx: number) => ({
        id: ( team['id'] || team.id || team['Team ID'] || team['Team id'] || team.ID || `team-${idx}`).toString(),
        name: (team.name || team['Team Name'] || team['team name'] || 'Unknown Team').toString(),
        owner: (team.owner || team['Team owner'] || team['Team Owner'] || 'N/A').toString(),
        purse: parseFloat( team['purse_total'] || team.purse || team.Purse || team.purse || '100'),
        remainingPurse : parseFloat( team['purse_remaining'] || team['Remaining Purse value'] || team['remaining purse value'] || '100'),
        tournamentId:(team['tournament_id']|| team.tournamentId || team['tournamentId'] || team['tournamentID'] || '1').toString(),
        playersCount: parseInt(team['players_count'] || team.Players || team.players || team.playersCount || '0'),
        logo: (team.logo || team['logo'] || '')
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
      setIsSyncing(true);
      
      const targetUrl = updateAPIUrl + "/players";
      //const targetUrl = `${updateUrl}${updateUrl.includes('?') ? '&' : '?'}action=getPlayers`;
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch players from API');
      const responseData = await response.json();
      //console.log('Players API response:', responseData);

      // Handle different response formats
      let players: Player[] = [];
      if (Array.isArray(responseData)) {
        //console.log("In Array.isArray(responseData)")
        players = responseData.map((player: any, idx: number) => {
          return getResponsePlayer(player,idx);
        });
      } else if (responseData && typeof responseData === 'object') {
        const playersArray = responseData.players || responseData.data || responseData.items || [];
        players = playersArray.map((player: any, idx: number) => {              
          return getResponsePlayer(player,idx);
        });//map
      }

      if (players.length === 0) {
        throw new Error('No players found in API response');
      }
      //setPlayers(players);
      //console.log("final player list from API -->"+JSON.stringify(players));
      return players;
    } catch (error: any) {
      console.error("Error while fetching players data from web api  -->" + error);
      if (error.message?.includes('CORS') || error.message?.includes('Access-Control')) {
        console.error('CORS Error:', error);        
      }
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const getResponsePlayer = (player : any, idx :any) => {
    //set profile value
    let profile = PlayerProfile.BATSMAN;
    let pStr = '';
    if(player['cricket_profiles']){
      pStr = player['cricket_profiles']['name'];
      //console.log('cricketProfile -->'+pStr);
      //const pStr = player['Profile'].toString().toLowerCase();
      if (pStr.includes('bowl')) profile = PlayerProfile.BOWLER;
      else if (pStr.includes('all') || pStr.includes('ar')) profile = PlayerProfile.ALL_ROUNDER;
      else if (pStr.includes('wk') || pStr.includes('keep')) profile = PlayerProfile.WK_BATSMAN;
  
    }
    
    //set status value 
    let status = PlayerStatus.AVAILABLE;
    if (player.status.toLowerCase() === 'sold') status = PlayerStatus.SOLD;
    if (player.status.toLowerCase() === 'unsold') status = PlayerStatus.UNSOLD;

    // set teamId 
    let matchedTeamId = '';
    let soldPrice = 0;
    //const matchedTeam = teams.find((t: any) => t.name === (player.team || player['Team']));    
    //if (matchedTeam) matchedTeamId = matchedTeam
    if (player['team_players'] && player['team_players'].length > 0) {
      const team_player = player['team_players'][0];
      if (team_player && team_player['team_id']) {
        matchedTeamId = team_player['team_id'];
        soldPrice = team_player['price'];        
      }
    }

    //set categoryId
    let playerCategoryId = '';
    //const playerCategory = categories.find((cat:any) => cat.name === player['Category'])
    //playerCategoryId = playerCategory.id;
    if(player['categories']){
      playerCategoryId = player['categories']['id']      
    }
    
    let responsePlayer : Player = {  
    id: (player.id || player['ID'] || `player-${idx}`).toString(),
    name: (player.name || player['Full Name'] || player['full name'] || 'Unknown Player').toString(),
    soldPrice: parseFloat(soldPrice || player.price || player.soldPrice || '0'),
    soldToTeamId: matchedTeamId,
    status: status,
    profile: profile,
    categoryId: ( playerCategoryId || player.categoryId || player['categoryId'] || ''),
    tournamentId: (player['tournament_id'] || player.tournamentId || player['tournamentId'] || '').toString(),
    sheetId: player.sheetId || undefined,
    mobileNumber: player.mobileNumber || '',
    imageUrl: (player['image_url']|| player.imageUrl || player['imageUrl'] ||  ''),
    };    
    return responsePlayer;
  }


  const syncPlayerToCloud = async (player: Player, teamIdForSync?: string, finalPrice?: number): Promise<boolean> => {
    //const baseUrl = updateUrl || DEFAULT_UPDATE_URL;
    //const targetUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}action=auctionPlayer`;
    const targetUrl = updateAPIUrl + "/auction"
    setIsSyncing(true);
    try {
      const cleanId = isNaN(Number(player.id)) ? player.id : Number(player.id);
      const cleanTeamId = (teamIdForSync !== undefined && !isNaN(Number(teamIdForSync))) ? Number(teamIdForSync) : (teamIdForSync || "");
      let bidText = '';
      bids.map((currentBid) => {
        //Anup M
        const selectedTeam = teams.filter((currentTeam) => currentTeam.id === currentBid.teamId);

        bidText = bidText + "Team - "+selectedTeam[0].name+" bid for amount - "+currentBid.amount+" Cr."  
      });
      console.log("Bid logs -->"+bidText);
  
      /*const payload = {
        "id": cleanId,
        "price": finalPrice || 0,
        "teamId": cleanTeamId,
        "status": player.status.toLowerCase(),
        "bid": bidText
      };*/
      const payload = {
        "playerId": player.id,
        "price": finalPrice || 0,
        "teamId": teamIdForSync,
        "bid": bidText
      };

      console.log(`Cloud Sync: Sending POST to ${targetUrl}`, payload);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
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

  //TODO change the name to auction player
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

  
const getTournamentDetailsFromAPI = async (): Promise<Tournament[]> => {
  const targetUrl = updateAPIUrl+"/tournaments";  
  //const baseUrl = updateUrl ;
  //const targetUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}action=getTournaments`;
  const tournamentResponse =  await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  });   

  console.log('fetching tournaments from  -->'+targetUrl);

  let updatedTournamentMap : Tournament[] = [];    
  if (tournamentResponse.ok) {
    const response = await tournamentResponse.json();
    //const tournaments = response.data;
    const tournaments = response;
    let tData : Tournament ;
    
    if (Array.isArray(tournaments) && tournaments.length > 0) {
      tournaments.map((tournament) =>  {
      const row = tournament;
      tData = {
              name: (row['name'] || row['Name'] || 'New Tournament').toString(),
              venue: (row['place'] || row['Place'] || 'Unknown Venue').toString(),
              auctionDate: (row['auctionDate'] || row['auction Date'] ||row['created_at'] || new Date().toISOString().split('T')[0]).toString(),
              numberOfTeams: parseInt(row['No. of teams'] || row['no. of teams'] || row['numberOfTeams'] ||row['no_of_teams'] || '8'),
              playersPerTeam: parseInt(row['Players per team'] || row['players per team'] || row['playersPerTeam'] || row['players_per_team']|| '15'),
              sheetId: (row['tournament ID'] || row['tournament id'] || row['sheetId'] || row['id'] || '').toString(),
              id: (row['Tournament ID'] || row['tournament Id'] || row['tournamentId'] || row['id'] || '').toString()
      };
      console.log(`printing tdata after conversion --> ${JSON.stringify(tData)}`)
      updatedTournamentMap.push(tData);
      
      }); //map 
    }// if clause  tournament
  } //if clause response
  return updatedTournamentMap; 
} //getTournamentDetailsFromAPI

const getCategoriesDetailsFromAPI = async (tournamentId: string): Promise<Category[]> => {
  
  const baseAPIUrl = updateAPIUrl;
  const targetUrl = baseAPIUrl+"/categories";
  
  //const baseUrl = updateUrl;
  //const targetUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}action=getCategories${tournamentId ? `&tournamentId=${tournamentId}` : ''}`;

  console.log('fetching Categories from -->'+targetUrl);

  const catResponse = await fetch(targetUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  });
  let updatedCatMap: Category[] = [];
  if (catResponse.ok) {
    const response = await catResponse.json();
    //const catArr = response.data;
    const catArr = response;
    if (Array.isArray(catArr) && catArr.length > 0) {
      catArr.forEach((row) => {
        const cData: Category = {
          id: (row['id'] || row['Category ID'] || row['categoryID'] || row['category id'] ).toString(),
          sheetId: (row['sheetId'] || row['Sheet ID'] || row['sheet ID'] || '').toString(),
          tournamentId: (tournamentId || row['torunamentId'] || ''),
          name: ( row['name']|| row['Category Name'] || row['categoryName'] || 'Unknown Category').toString(),
          basePrice : (row['base_price']|| row['Base Price'] || row['basePrice']|| 0)
        };

        //console.log(`Adding category --> ${JSON.stringify(cData)}`)

        updatedCatMap.push(cData);
      });
    }
  }
  //setCategories(updatedCatMap);
  return updatedCatMap;
};
  const clearBids = () => {
    setBids([]);
  };
  const uploadImage = async (file: File) : Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('You must be logged in to upload an image.');
      console.error('Upload failed: User not authenticated.');
      return null;
    }
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `players/${fileName}`;

    const { data, error } = await supabase.storage
      .from('player-images')
      .upload(filePath, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('player-images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const flushLocalStorage = () => {
    //localStorage.clear();
    setTournaments([]);
    setTeams([]);
    setCategories([]);
    setPlayers([]);
    setBids([]);
    //setUser(null);
    setUpdateUrlState(DEFAULT_API_UPDATE_URL);
    setSheetUrlState(DEFAULT_SHEET_URL);
  };


  return (
    <AuctionContext.Provider value={{
      tournaments, teams, categories, players, bids, user, isSyncing, updateUrl, sheetUrl, setUpdateUrl, setSheetUrl, login, logout, 
      addTournament, updateTournament, addTeam, bulkAddTeams, deleteTeam,
      addCategory, bulkAddCategories, deleteCategory, addPlayer, updatePlayer, bulkAddPlayers, deletePlayer,
      placeBid, finalizePlayer, getTournamentData,
      updateTeam,
      getTeamsFromSheetAPI,
      getPlayersTeamWiseFromAPI,
      getTournamentDetailsFromAPI,
      getCategoriesDetailsFromAPI,
      getPlayersFromSheetAPI,
      clearBids,
      uploadImage,
      loadDataFromDB,
      flushLocalStorage
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
