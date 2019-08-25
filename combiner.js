const fs = require('fs');
const path = require('path');

const ALIASES = JSON.parse(fs.readFileSync('./team-aliases.json', 'utf8').replace(/\\"/g, `'`));

function combineTournamentSchedules(scheduleFolder) {
    const teamsByDivision = {
        'Open': [],
        'Women\'s': [],
        'Mixed': []
    };

    const folderPath = path.join(__dirname, scheduleFolder);
    fs.readdirSync(folderPath).forEach(schedulePath => {
        let data = require(`${folderPath}/${schedulePath}`);
        Object.keys(data).forEach(division => {
            Object.keys(data[division]).forEach(team => {
                const alias = ALIASES[division][team] || team;
                let teamData = teamsByDivision[division].find(teamData => teamData.team === alias);
                if (teamData) {
                    teamData.games.push(...data[division][team]);
                }
                else {
                    teamData = {
                        team: alias,
                        games: data[division][team]
                    };
                    teamsByDivision[division].push(teamData);
                }
            });
        });
    });

    for (division in teamsByDivision) {
        for (teamData of teamsByDivision[division]) {
            teamData.games = teamData.games.sort((a, b) => {
                return a.timestamp < b.timestamp ? -1 : 1;
            });
        }
        teamsByDivision[division] = teamsByDivision[division].sort((a, b) => {
            return a.team < b.team ? -1 : 1;
        });
    }

    return teamsByDivision;
}

function prettyPrint(obj) {
    console.log(JSON.stringify(obj, null, 2));
}

const combinedData = combineTournamentSchedules('./parsed_schedules/grouped_by_team');
prettyPrint(combinedData);
