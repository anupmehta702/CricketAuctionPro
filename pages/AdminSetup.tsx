import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { PlayerProfile, PlayerStatus } from '../types';

declare const XLSX: any;

enum Step {
  TOURNAMENT = 1,
  TEAMS = 2,
  CATEGORIES = 3,
  PLAYERS = 4
}

const AdminSetup: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId?: string }>();
  const navigate = useNavigate();
  const { 
    addTournament, updateTournament, getTournamentData, updateUrl, setUpdateUrl
    ,sheetUrl, setSheetUrl,addTeam, bulkAddTeams, deleteTeam, addCategory
    ,bulkAddCategories, deleteCategory, addPlayer, bulkAddPlayers, deletePlayer
    ,getTeamsFromSheetAPI,
    getTournamentDetailsFromAPI , 
    getCategoriesDetailsFromAPI,
    getPlayersFromSheetAPI
  } = useAuction();

  const [activeStep, setActiveStep] = useState<Step>(Step.TOURNAMENT);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const data = getTournamentData(tournamentId || '');

  const [tournamentForm, setTournamentForm] = useState({id:'0',
    name: '', venue: '', auctionDate: '', numberOfTeams: 8, playersPerTeam: 15
  });
  const [teamForm, setTeamForm] = useState({ name: '', owner: '', purse: 100 });
  const [categoryForm, setCategoryForm] = useState({ name: '', basePrice: 2 });
  const [playerForm, setPlayerForm] = useState({
    name: '', mobileNumber: '', categoryId: '', profile: PlayerProfile.BATSMAN, imageUrl: ''
  });

  useEffect(() => {
    if (data.tournament) {
      setTournamentForm({
        id: data.tournament.id,
        name: data.tournament.name,
        venue: data.tournament.venue,
        auctionDate: data.tournament.auctionDate,
        numberOfTeams: data.tournament.numberOfTeams,
        playersPerTeam: data.tournament.playersPerTeam
      });
    }
  }, [data.tournament]);

  const handleTournamentSubmit = (e: React.FormEvent) => {
    //console.log("in Handle Tournament submit -->"+tournamentId)
    e.preventDefault();
    if (tournamentId) {
      updateTournament({ ...tournamentForm, id: tournamentId });
      setActiveStep(Step.TEAMS);
    } else {
      const newT = addTournament(tournamentForm);
      navigate(`/admin/${newT.id}`);
      setActiveStep(Step.TEAMS);
    }
  };

  const getExportUrl = (url: string) => {
    try {
      const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (idMatch && idMatch[1]) {
        return `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=xlsx`;
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  const syncMasterFromGoogleSheet = async () => {
    setIsSyncing(true);
    const EXPORT_URL = getExportUrl(sheetUrl);

    try {
      const response = await fetch(EXPORT_URL);
      if (!response.ok) throw new Error('Failed to fetch Google Sheet. Ensure it is public.');
      
      const arrayBuffer = await response.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      
      // 1. TOURNAMENT DETAILS
      let tournamentMap = await getTournamentDetailsFromAPI(tournamentId);
      let currentTid = tournamentId;
      if(tournamentMap.length > 0) {
        tournamentMap.map((tournament) => {
          const newT = addTournament(tournament);            
          currentTid = newT.id;
          if(!tournamentId){
            navigate(`/admin/${newT.id}`);
          }                        
        });  
      } else {
        console.log("No tournament details found !");
      }      

      if (!currentTid) {
        alert("Tournament details not found in sheet.");
        setIsSyncing(false);
        return;
      }

      const now = Date.now();

      // 2. CATEGORIES
      const categoryMap = new Map<string, string>(); // name -> spreadsheetId
      const catsToAdd = await getCategoriesDetailsFromAPI(tournamentId);
      if (catsToAdd.length > 0) 
        bulkAddCategories(currentTid, catsToAdd);  

      //3.Teams 
      const teamsToAdd = await getTeamsFromSheetAPI();
      if (teamsToAdd.length > 0)
         bulkAddTeams(currentTid, teamsToAdd);
      
      // 4. PLAYERS (Sheet1)      
      const playersToAdd = (await getPlayersFromSheetAPI(currentTid));
      //.filter(p => p.name !== 'Unknown Player');
      if (playersToAdd.length > 0) {
        bulkAddPlayers(currentTid, playersToAdd);        
      }
      
      /*const pSheet = wb.SheetNames.find((name: string) => name.toLowerCase() === 'sheet1');
      if (pSheet) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[pSheet]);
        //rows should get valiue from
        const playersToAdd = rows.map((row: any, idx: number) => {
          const catNameFromSheet = (row['Category'] || row['category'] || '').toString().toLowerCase().trim();
          const categoryId = categoryMap.get(catNameFromSheet) || '';
          
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
            tournamentId: currentTid!,
            sheetId: sheetPlayerId,
            name: (row['Full Name'] || row['full name'] || 'Unknown Player').toString(),
            soldToTeamId: (row['Team'] || row['team']),
            soldPrice: Number(row['price'] || 0),
            mobileNumber: '',
            categoryId,
            profile,
            imageUrl: '',
            status
          };
        }).filter(p => p.name !== 'Unknown Player');

        if (playersToAdd.length > 0) bulkAddPlayers(currentTid, playersToAdd);        
      }*/

      alert("Master Sync Complete! Tournament details, Teams, Categories, and Players imported.");
    } catch (err) {
      console.error("Master Sync Error:", err);
      alert("Failed to perform Master Sync. Check URL and connectivity.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-white font-['Satoshi'] overflow-hidden">
      <header className="shrink-0 pt-14 pb-0 px-5 flex flex-col gap-4 bg-[#020617] border-b border-white/5 z-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <iconify-icon icon="lucide:settings" className="text-blue-500 text-lg" />
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase font-display">Admin Setup</span>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="text-xs text-blue-500 font-bold hover:underline"
          >
            Dashboard
          </button>
        </div>

        <nav className="flex gap-6 overflow-x-auto no-scrollbar pt-1">
          <button onClick={() => setActiveStep(Step.TOURNAMENT)} className={`text-sm font-bold whitespace-nowrap border-b-2 pb-3 transition-colors ${activeStep === Step.TOURNAMENT ? 'border-blue-500 text-white' : 'border-transparent text-slate-500'}`}>Tournament</button>
          <button onClick={() => tournamentId && setActiveStep(Step.TEAMS)} className={`text-sm font-bold whitespace-nowrap border-b-2 pb-3 transition-colors ${activeStep === Step.TEAMS ? 'border-blue-500 text-white' : 'border-transparent text-slate-500'}`}>Teams</button>
          <button onClick={() => tournamentId && setActiveStep(Step.CATEGORIES)} className={`text-sm font-bold whitespace-nowrap border-b-2 pb-3 transition-colors ${activeStep === Step.CATEGORIES ? 'border-blue-500 text-white' : 'border-transparent text-slate-500'}`}>Categories</button>
          <button onClick={() => tournamentId && setActiveStep(Step.PLAYERS)} className={`text-sm font-bold whitespace-nowrap border-b-2 pb-3 transition-colors ${activeStep === Step.PLAYERS ? 'border-blue-500 text-white' : 'border-transparent text-slate-500'}`}>Players</button>
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-8 flex flex-col gap-8 no-scrollbar">
        {activeStep === Step.TOURNAMENT && (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold font-display tracking-tight">Setup Tournament</h1>
              <p className="text-sm text-slate-400">Import everything from Google Sheets or enter manually</p>
            </div>

            <div className="glass-card rounded-2xl p-6 border-l-4 border-l-green-500 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <iconify-icon icon="lucide:layers" className="text-green-500 text-xl" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Master Cloud Sync</h3>
              </div>
              <p className="text-[11px] text-slate-400">Pulls Tournament, Teams, Categories, and Players from specified sheets.</p>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Read URL (Export)</label>
                <input 
                  type="text" 
                  value={sheetUrl} 
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="Paste Google Sheet URL"
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-blue-300 focus:outline-none focus:border-blue-500"
                />
                
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1 mt-2">Update URL (Apps Script)</label>
                <input 
                  type="text" 
                  value={updateUrl} 
                  onChange={(e) => setUpdateUrl(e.target.value)}
                  placeholder="Paste Google Apps Script Web App URL"
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-amber-300 focus:outline-none focus:border-blue-500"
                />
                
                <button 
                  onClick={syncMasterFromGoogleSheet}
                  disabled={isSyncing}
                  className={`w-full py-3 mt-2 rounded-xl bg-green-600 hover:bg-green-500 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isSyncing ? 'opacity-50' : ''}`}
                >
                  <iconify-icon icon={isSyncing ? "lucide:refresh-cw" : "lucide:cloud-download"} className={isSyncing ? "animate-spin" : ""} />
                  {isSyncing ? "Syncing..." : "Run Master Sync"}
                </button>
              </div>
            </div>

            <form id="tournament-form" onSubmit={handleTournamentSubmit} className="flex flex-col gap-6 pb-24">
              <div className="glass-card rounded-2xl p-6 space-y-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Tournament Name</label>
                  <input type="text" value={tournamentForm.name} onChange={e => setTournamentForm({...tournamentForm, name: e.target.value})} placeholder="e.g. Premier League 2024" className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-blue-500" required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Venue</label>
                  <input type="text" value={tournamentForm.venue} onChange={e => setTournamentForm({...tournamentForm, venue: e.target.value})} placeholder="e.g. Wankhede Stadium" className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-blue-500" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card rounded-2xl p-6 flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Players / Team</label>
                  <input type="number" value={tournamentForm.playersPerTeam} onChange={e => setTournamentForm({...tournamentForm, playersPerTeam: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-xl p-4 text-base font-bold text-white focus:outline-none" />
                </div>
                <div className="glass-card rounded-2xl p-6 flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">No. of Teams</label>
                  <input type="number" value={tournamentForm.numberOfTeams} onChange={e => setTournamentForm({...tournamentForm, numberOfTeams: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-xl p-4 text-base font-bold text-white focus:outline-none" />
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6 flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <iconify-icon icon="lucide:calendar" className="text-blue-500 text-sm" /> Auction Date
                </label>
                <input type="date" value={tournamentForm.auctionDate} onChange={e => setTournamentForm({...tournamentForm, auctionDate: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm w-full text-white cursor-pointer focus:outline-none" />
              </div>
            </form>
          </>
        )}

        {activeStep === Step.TEAMS && tournamentId && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold font-display uppercase tracking-widest text-slate-400">Add New Team</h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold uppercase">Step 2/4</span>
              </div>
            </div>
            <form onSubmit={e => { e.preventDefault(); addTeam({ ...teamForm, tournamentId }); setTeamForm({ name: '', owner: '', purse: 100 }); }} className="glass-card p-5 rounded-3xl flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Team Name</label>
                <input type="text" required value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} placeholder="e.g. Mumbai Titans" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 text-white" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Owner</label>
                <input type="text" required value={teamForm.owner} onChange={e => setTeamForm({...teamForm, owner: e.target.value})} placeholder="e.g. Mukesh Ambani" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 text-white" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Purse (₹ Cr)</label>
                <input type="number" required value={teamForm.purse} onChange={e => setTeamForm({...teamForm, purse: parseFloat(e.target.value)})} placeholder="80.00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 text-white" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">Register Team</button>
            </form>
            <div className="flex flex-col gap-3 pb-24">
              {data.teams.map(team => (
                <div key={team.id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-500 font-bold italic text-lg">{team.name.substring(0,2).toUpperCase()}</div>
                    <div>
                      <h3 className="font-bold text-sm">
                        <span className="text-blue-400 mr-2 text-[10px]">#{team.id}</span>
                        {team.name}
                      </h3>
                      <p className="text-[10px] text-slate-400">Owner: {team.owner}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right"><p className="text-[10px] text-slate-500 uppercase font-bold">Purse</p><p className="text-xs font-bold text-[#D4AF37]">₹{team.purse} Cr</p></div>
                    <button onClick={() => deleteTeam(team.id)} className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-red-500 transition-all"><iconify-icon icon="lucide:trash-2" className="text-lg" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeStep === Step.CATEGORIES && tournamentId && (
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-2xl font-bold font-display">Player Categories</h2>
            </div>
            <form onSubmit={e => { e.preventDefault(); addCategory({ ...categoryForm, tournamentId }); setCategoryForm({ name: '', basePrice: 2 }); }} className="glass-card rounded-2xl p-5 border border-white/5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-500 mb-4 flex items-center gap-2">Add New Category</h3>
              <div className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Category Name</label>
                  <input type="text" required value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} placeholder="e.g. Marquee" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Base Price (₹ Cr)</label>
                  <input type="number" step="0.1" required value={categoryForm.basePrice} onChange={e => setCategoryForm({...categoryForm, basePrice: parseFloat(e.target.value)})} placeholder="2.00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-blue-500" />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold font-display mt-2 shadow-lg shadow-blue-600/20">CREATE CATEGORY</button>
              </div>
            </form>
            <div className="space-y-3 pb-24">
              {data.categories.map(cat => (
                <div key={cat.id} className="glass-card rounded-xl p-4 flex items-center justify-between border border-white/5">
                  <div>
                    <p className="font-bold font-display text-lg">
                      <span className="text-blue-400 mr-2 text-xs">#{cat.id}</span>
                      {cat.name}
                    </p>
                    <p className="text-xs text-yellow-500 font-bold">Base: ₹{cat.basePrice} Cr</p>
                  </div>
                  <button onClick={() => deleteCategory(cat.id)} className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500"><iconify-icon icon="lucide:trash-2" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeStep === Step.PLAYERS && tournamentId && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div><h2 className="text-2xl font-bold font-display">Player Roster</h2><p className="text-xs text-slate-400 mt-1">Manage all participants</p></div>
            </div>
            <div className="glass-card rounded-3xl p-6 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2"><iconify-icon icon="lucide:user-plus" className="text-blue-500" /> Add New Player</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Full Name</label>
                  <input type="text" required value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} placeholder="e.g. Virat Kohli" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Profile</label>
                    <select value={playerForm.profile} onChange={e => setPlayerForm({...playerForm, profile: e.target.value as PlayerProfile})} className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none">
                      {Object.values(PlayerProfile).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Category</label>
                    <select required value={playerForm.categoryId} onChange={e => setPlayerForm({...playerForm, categoryId: e.target.value})} className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none">
                      <option value="">Select Category</option>
                      {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => { if(!playerForm.name || !playerForm.categoryId) return alert("Fill all fields"); addPlayer({ ...playerForm, tournamentId }); setPlayerForm({ ...playerForm, name: '', mobileNumber: '' }); }} className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold font-display text-base transition-all active:scale-[0.98]">Add Player to List</button>
              </div>
            </div>
            <div className="space-y-3 pb-24">
              {data.players.map(p => (
                <div key={p.id} className="glass-card rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500"><iconify-icon icon="lucide:user" /></div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        <span className="text-blue-400 mr-2 font-display">#{p.id}</span>
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{p.profile} • {data.categories.find(c => c.id === p.categoryId)?.name}</p>
                    </div>
                  </div>
                  <button onClick={() => deletePlayer(p.id)} className="w-8 h-8 rounded-lg bg-white/5 text-slate-400 hover:text-red-400"><iconify-icon icon="lucide:trash-2" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 p-5 pb-[34px] z-50">
        <div className="flex flex-col gap-4">
          {activeStep === Step.TOURNAMENT ? (
            <button type="submit" form="tournament-form" className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold font-display py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-sm">
              REGISTER & CONTINUE <iconify-icon icon="lucide:arrow-right" />
            </button>
          ) : activeStep === Step.PLAYERS ? (
            <button onClick={() => navigate(`/selection/${tournamentId}`)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold font-display py-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-sm shadow-lg">
              FINISH SETUP & START <iconify-icon icon="lucide:check-circle" />
            </button>
          ) : (
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveStep(activeStep - 1)} className="text-slate-400 flex items-center gap-2 font-bold text-sm uppercase">
                <iconify-icon icon="lucide:chevron-left" /> Back
              </button>
              <button onClick={() => setActiveStep(activeStep + 1)} className="bg-blue-600 px-8 py-2.5 rounded-full text-white font-bold text-sm flex items-center gap-2 shadow-lg uppercase tracking-wider">
                Next <iconify-icon icon="lucide:chevron-right" />
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default AdminSetup;
