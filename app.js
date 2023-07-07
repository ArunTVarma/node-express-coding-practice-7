const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, (request, response) => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};

initializeDBAndServer();

//API 1 Returns a list of all the players in the player table

// function to convert output to required format
const playersListInReqFormat = (eachPlayer) => {
  return {
    playerId: eachPlayer.player_id,
    playerName: eachPlayer.player_name,
  };
};

app.get("/players/", async (request, response) => {
  try {
    const getPlayersListQuery = `
        select * from player_details;`;
    const getPlayersListQueryResponse = await db.all(getPlayersListQuery);
    response.send(
      getPlayersListQueryResponse.map((eachPlayer) =>
        playersListInReqFormat(eachPlayer)
      )
    );
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
});

//API 2 Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const getPlayerQuery = `
        select * from player_details
        where player_id	=${playerId};`;
    const getPlayerQueryResponse = await db.get(getPlayerQuery);
    response.send(playersListInReqFormat(getPlayerQueryResponse));
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
});

//API 3 Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", (request, response) => {
  try {
    const { playerId } = request.params;
    const { playerName } = request.body;
    const updatePlayerDetails = `
        update player_details
        set 
            player_name='${playerName}'
        where player_id=${playerId};`;
    const updatePlayerDetailsResponse = db.run(updatePlayerDetails);
    response.send("Player Details Updated");
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
});

// API Returns the match details of all matches
app.get("/matches/", async (request, response) => {
  try {
    const allMatchesDetailsQuery = `
        select * from match_details;`;
    const allMatchesResponse = await db.all(allMatchesDetailsQuery);
    response.send(allMatchesResponse);
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
});

//API 4 Returns the match details of a specific match

const matchDetailsInReqFormat = (eachMatch) => {
  return {
    matchId: eachMatch.match_id,
    match: eachMatch.match,
    year: eachMatch.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  try {
    const { matchId } = request.params;
    const matchDetailsQuery = `
        select * from match_details
        where match_id = ${matchId};`;
    const matchDetailsQueryResponse = await db.get(matchDetailsQuery);
    response.send(matchDetailsInReqFormat(matchDetailsQueryResponse));
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
});

//API 5 Returns a list of all the matches of a player

const playerMatchReqFormat = (eachItem) => {
  return {
    matchId: eachItem.match_id,
    match: eachItem.match,
    year: eachItem.year,
  };
};

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    select * from player_match_score
    natural join match_details
    where player_id=${playerId};`;
  const dbresponsePlayerMatch = await db.all(getPlayerMatchQuery);
  response.send(
    dbresponsePlayerMatch.map((eachItem) => playerMatchReqFormat(eachItem))
  );
});

//API 6 Returns a list of players of a specific match

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const playersSpecificMatchQuery = `
    select player_details.player_id as playerId,
        player_details.player_name as playerName from player_match_score
    natural join player_details
    where match_id=${matchId};`;
  const responseFromDB = await db.all(playersSpecificMatchQuery);
  response.send(responseFromDB);
});

//API 7 Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;
  const playerStatsDBResponse = await db.get(getPlayerScored);
  response.send(playerStatsDBResponse);
});

module.exports = app;
