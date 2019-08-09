const fs = require('fs');
const path = require('path');

function combineTournamentScheedules(scheduleFolder) {
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
                let teamData = teamsByDivision[division].find(teamData => teamData.team === team);
                if (teamData) {
                    teamData.games.push(...data[division][team]);
                }
                else {
                    teamData = {
                        team,
                        games: data[division][team]
                    };
                    teamsByDivision[division].push(teamData);
                }
            });
        });
    });

    return teamsByDivision;
}

function prettyPrint(obj) {
    console.log(JSON.stringify(obj, null, 2));
}

const combinedData = combineTournamentScheedules('./parsed_schedules');
prettyPrint(combinedData);
