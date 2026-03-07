require('dotenv').config({ path: '../.env' });
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3001;

// Supabase initialization
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});
//----------------------------PLAYER APIs ------------------------------------------------------
//API to get players
app.get("/players", async (req, res) => {
  const { data, error } = await supabase
    .from("players")
    .select("*, categories(id,name,base_price), cricket_profiles(id,name)");

  if (error) {
    console.error('Error fetching players:', error);
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data || { success: true });
});

//Add Player
app.post("/players", async (req, res) => {
  const { data, error } = await supabase
    .from("players")
    .insert(req.body);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data || { success: true });
});

//Update PLayer
app.put("/players/:id", async (req, res) => {
  console.log("Request body for update player -->"+JSON.stringify(req.body));
  const { data, error } = await supabase
    .from("players")
    .update(req.body)
    .eq("id", req.params.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data || { success: true });
  
});

//Delete Player
app.delete("/players/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("players")
    .delete()
    .eq("id", req.params.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data || { success: true });
});

//Auction player
app.post("/auction", async (req, res) => {

  const { playerId, teamId, price } = req.body;

  // add player to team
  await supabase.from("team_players").insert({
    team_id: teamId,
    player_id: playerId,
    price: price
  });

  // update player status
  await supabase.from("players")
    .update({ status: "SOLD", price:price })
    .eq("id", playerId);

  // reduce purse
  const { data: team } = await supabase
    .from("teams")
    .select("purse_remaining")
    .eq("id", teamId)
    .single();

  await supabase
    .from("teams")
    .update({
      purse_remaining: team.purse_remaining - price
    })
    .eq("id", teamId);

  res.json({ success: true });
});

//------------------------------------------------------------------------------------

//-------------------------------TEAMS APIs -----------------------------------------
// API to get all teams
app.get('/teams', async (req, res) => {
  const { data, error } = await supabase.from('teams')
  .select('*, team_players(*, players(*))');

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data || []);
});

// API to create a new team
app.post('/teams', async (req, res) => {
  const { data, error } = await supabase.from('teams').insert(req.body);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data || { success: true });
});

// API to update a team
app.put('/teams/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('teams')
    .update(req.body)
    .eq('id', req.params.id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data || { success: true });
});

// API to delete a team
app.delete('/teams/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('teams')
    .delete()
    .eq('id', req.params.id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data || { success: true });
});

//-------------------------------CATEGORIES APIs -------------------------------------
// API to get all categories
app.get('/categories', async (req, res) => {
  const { data, error } = await supabase.from('categories')
  .select('*,players(*)');
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data || { success: true });
});

// API to create a new category
app.post('/categories', async (req, res) => {
  const { data, error } = await supabase.from('categories').insert(req.body);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data || { success: true });
});

// API to update a category
app.put('/categories/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .update(req.body)
    .eq('id', req.params.id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data || { success: true });
});

// API to delete a category
app.delete('/categories/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', req.params.id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data || { success: true });
});

//-------------------------------TOURNAMENT APIs -------------------------------------
// API to get all tournaments
app.get('/tournaments', async (req, res) => {
  const { data, error } = await supabase.from('tournaments').select('*');
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data || { success: true });
});

// API to create a new tournament
app.post('/tournaments', async (req, res) => {
  const { data, error } = await supabase.from('tournaments').insert(req.body);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data || { success: true });
});

// API to update a tournament
app.put('/tournaments/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('tournaments')
    .update(req.body)
    .eq('id', req.params.id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data || { success: true });
});

// API to delete a tournament
app.delete('/tournaments/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', req.params.id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data || { success: true });
});


if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

module.exports = app; // Export for testing
