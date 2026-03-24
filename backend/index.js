const cors = require('cors');

require('dotenv').config({ path: '../.env' });
const express = require('express');
const { createClient } = require('@supabase/supabase-js');


const app = express();
//app.use(cors({ origin: '*' }));
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//   res.header('Access-Control-Allow-Headers', 'Content-Type');
//   res.header('Access-Control-Allow-Credentials', 'true');
//   console.log('Hello , setting extra headers !!')
//   if ('OPTIONS' == req.method) {
//     res.sendStatus(200);
//   } else {
//     next();
//   }
// });
app.use(express.json());
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
    .select("*, categories(id,name,base_price), cricket_profiles(id,name),team_players(id,team_id,price)");

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
    .insert(req.body)
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data && data.length > 0 ? data[0] : { success: true });
});

//Update PLayer
app.put("/players/:id", async (req, res) => {
  const {name,category_id,image_url,price,team_id} = req.body;
  console.log(`Request body for update player [${req.params.id}] -->`+JSON.stringify(req.body));
  const { data, error } = await supabase
    .from("players")
    .update({name:name,category_id:category_id,image_url:image_url,price:price})
    .eq("id", req.params.id);
  
  const {data: existing_team_player, existing_error} = await supabase
  .from("team_players")
  .select("*")
  .eq("player_id",req.params.id);
  //.single();
  
  console.log(`Existing team player --> ${JSON.stringify(existing_team_player)}`)

  if(existing_team_player){
    const existing_team_id = existing_team_player[0].team_id;
    const existing_sold_price = existing_team_player[0].price;
    console.log(`existing details of player before updating , team_id - ${existing_team_id} , soldPrice - ${existing_sold_price}`)

    if(existing_team_id != team_id) {
      console.log(`existing team id - ${existing_team_id} is different from current team_id - ${team_id}` )
      //if previous and current team is different, then afjust the purse for previous team 
      const { data: team_data, error: team_error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", existing_team_id)
        .single();
      // updating existing team's purse
      await supabase
        .from("teams")
        .update({
          purse_remaining: team_data.purse_remaining + existing_sold_price,
          players_count: team_data.players_count - 1
        })
        .eq("id", existing_team_id);        
    }
    
  }

  //get current team's information
  const { data: team, error: team_error } = await supabase
    .from("teams")
    .select("*")
    .eq("id",team_id)
    .single();
  console.log(`Existing team details --> ${JSON.stringify(team)}`);
  //console.log(`Existing team detail purse_remaining - ${team.purse_remaining} players_count - ${team.players_count}`)

  // updating current team purse
  await supabase
  .from("teams")
  .update({purse_remaining: team.purse_remaining - price,
     players_count: team.players_count + 1})
  .eq("id",team_id);        


  //update team_players
  if(existing_team_player){
    //updating team_players
    const { team_player_id, t_p_error } = await supabase
      .from("team_players")
      .update({ team_id: team_id, price: price })
      .select("id")
      .eq("team_id", team_id)
      .eq("player_id", req.params.id);

    if (t_p_error) {
      console.log("error while updating player -->" + JSON.stringify(t_p_error));
      return res.status(500).json({ error: t_p_error.message });
    }
  }else {
    console.log('No details present in team_players, hence inserting in team_players')
    // add player to team
    await supabase.from("team_players").insert({
    team_id: team_id,
    player_id: req.params.id,
    price: price,
    bid: 'Done via update by admin'
  });
  }
   
  


  if (error) {
    console.log("error while updating player -->"+JSON.stringify(error));
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
  console.log(`request body for auction API -> ${JSON.stringify(req.body)}`)
  const { playerId, teamId, price, bid } = req.body;

  // add player to team
  await supabase.from("team_players").insert({
    team_id: teamId,
    player_id: playerId,
    price: price,
    bid: bid
  });

  // update player status
  await supabase.from("players")
    .update({ status: "SOLD", price:price })
    .eq("id", playerId);

  // reduce purse
  const { data: team } = await supabase
    .from("teams")
    .select("players_count,purse_remaining")
    .eq("id", teamId)
    .single();
  console.log(`Existing players_count --> ${team.players_count} , purse_remaining --> ${team.purse_remaining} `)

  await supabase
    .from("teams")
    .update({
      purse_remaining: team.purse_remaining - price,
      players_count: team.players_count + 1
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
  const { data, error } = await supabase.from('teams').insert(req.body).select();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data && data.length > 0 ? data[0] : { success: true });
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
  const { data, error } = await supabase.from('categories').insert(req.body).select();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data && data.length > 0 ? data[0] : { success: true });
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
  const { data, error } = await supabase.from('tournaments').insert(req.body).select();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data && data.length > 0 ? data[0] : { success: true });
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
  res.status(200).json(_data || { success: true });
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
//----------------------------------------------------------------------------------
app.get("/profiles", async (req, res) => {
  const { data, error } = await supabase
    .from("cricket_profiles")
    .select("*");

  if (error) {
    console.error('Error fetching players:', error);
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