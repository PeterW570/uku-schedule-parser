const fs = require("fs");
const path = require("path");

const parseSchedule = require("./parser");
const teamToClub = require("./team-to-club");
const teamAliases = JSON.parse(
  fs
    .readFileSync(path.join(__dirname, "./team-aliases.json"), "utf8")
    .replace(/\\"/g, `'`)
);

/**
 * conifg contains:
 * URL - url of the google sheeet
 * TOURNAMENT - name of the tournament
 * DIVISIONS - ability to configure for multiple divisions in a single sheet
 * DAYS_TO_DATES - object with the name of the day as the key and 'YYYY-MM-DD' as the value
 * DIVISION - if you don't specify DIVISIONS you can say which division it is
 * SEED_TAB_IDX - (0 based) index, default = 0
 * POOL_RES_TAB_IDX - (0 based) index of the pool result tab, default = 3
 * BRACKET_RES_TAB_IDX - can be null, a (0 based) index, or an array of (0 based) indices, default = 4
 * TO_PRINT - specify which object from parseSchedule you want to print (defaults to resultsByTeam)
 */
const config = require("./config"); // TODO: read from command line args

function prettyPrint(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

(async function() {
  try {
    const parsedRes = await parseSchedule(config.URL, {
      tournament: config.TOURNAMENT,
      divisions: config.DIVISIONS,
      division: config.DIVISION,
      daysToDatesMap: config.DAYS_TO_DATES,
      seedTabIdx: config.SEED_TAB_IDX,
      poolResTabIdx: config.POOL_RES_TAB_IDX,
      bracketResTabIdx: config.BRACKET_RES_TAB_IDX,
      processPoolSeed: config.PROCESS_POOL_SEED,
      processBracketSeed: config.PROCESS_BRACKET_SEED
    });
    const toPrint = config.TO_PRINT || "resultsByTeam";

    if (toPrint === "databaseTables") {
      const days = Object.values(config.DAYS_TO_DATES);
      const databaseTables = {
        tournaments: [
          {
            _id: 1,
            name: config.TOURNAMENT,
            field_type: config.TOURNAMENT_FIELD_TYPE || "grass",
            club_types: config.TOURNAMENT_CLUB_TYPES || "club"
          }
        ],
        tournament_events: [],
        clubs: [],
        teams: [],
        games: [],
        game_scores: [],
        tournament_placings: []
      };
      const clubNameToId = {};
      const teamNameToId = {};

      for (let division in parsedRes.allGames) {
        const newEventId = databaseTables.tournament_events.length + 1;
        databaseTables.tournament_events.push({
          _id: newEventId,
          _tournament_id: 1,
          division: { Open: "O", "Men's": "M", Mixed: "X", "Women's": "W" }[
            division
          ],
          start_day: days[0],
          end_day: days[days.length - 1],
          location: config.TOURNAMENT_LOCATION
        });

        parsedRes.allGames[division].forEach(({ timestamp, pool, teams }) => {
          const newGameId = databaseTables.games.length + 1;
          databaseTables.games.push({
            _id: newGameId,
            _tournament_event_id: newEventId,
            start_time: timestamp,
            round: pool ? "pool" : "bracket"
          });

          teams.forEach(({ team, score, seed }) => {
            const teamName = teamAliases[division][team] || team;
            const clubName = teamToClub(teamName);
            let clubId = clubNameToId[clubName];
            if (!clubId) {
              clubId = databaseTables.clubs.length + 1;
              databaseTables.clubs.push({
                _id: clubId,
                name: clubName,
                club_type: config.TOURNAMENT_CLUB_TYPES || "club"
              });
              clubNameToId[clubName] = clubId;
            }

            let teamId = teamNameToId[teamName];
            if (!teamId) {
              teamId = databaseTables.teams.length + 1;
              databaseTables.teams.push({
                _id: teamId,
                _club_id: clubId,
                name: teamName,
                division: {
                  Open: "O",
                  "Men's": "M",
                  Mixed: "X",
                  "Women's": "W"
                }[division]
              });
              teamNameToId[teamName] = teamId;
            }

            const newGameScoreId = databaseTables.game_scores.length + 1;
            if (pool) {
              let seedMatch = parsedRes.initialSeedings[division].find(
                ({ poolSeed }) => poolSeed === seed
              );
              seed = seedMatch.seed;
            }
            databaseTables.game_scores.push({
              _id: newGameScoreId,
              _game_id: newGameId,
              _team_id: teamId,
              score,
              seed: Number(seed)
            });
          });
        });

        (parsedRes.finalPlacings[division] || []).forEach(({ team, seed }) => {
          const newPlacingId = databaseTables.tournament_placings.length + 1;
          const teamName = teamAliases[division][team] || team;
          const initialSeedEntry = parsedRes.initialSeedings[division].find(
            ({ team: t }) => t === team
          );
          if (!initialSeedEntry) {
            console.error(
              `Couldn't find intial seed for team: ${teamName} in division: ${division}`
            );
          }

          databaseTables.tournament_placings.push({
            _id: newPlacingId,
            _tournament_event_id: newEventId,
            _team_id: teamNameToId[teamName],
            final_placement: Number(seed),
            initial_seed: initialSeedEntry && Number(initialSeedEntry.seed)
          });
        });
      }

      prettyPrint(databaseTables);
    } else {
      prettyPrint(parsedRes[toPrint]);
    }
  } catch (err) {
    console.error(err);
  }
})();
