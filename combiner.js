const fs = require('fs');
const path = require('path');

const ALIASES = {
    'Open': {
        'BAF': 'BAF Open',
        'Birmingham Ultimate': 'Birmingham Ultimate 1',
        'Clapham': 'Clapham Ultimate',
        'Curve 1': 'Curve Open',
        'Devon 1': 'Devon Ultimate',
        'Flump': 'Flump Open',
        'Flump 1': 'Flump Open',
        'Flump Open 1': 'Flump Open',
        'GB U20 Men': 'GB U20 Open',
        'Horsham Ultimate': 'Horsham Ultimate Open',
        'Oxford Open': 'Oxford Opens',
        'Purple Cobras': 'Purple Cobras Open',
        'Rebel Ultimate': 'Rebel Ultimate 1',
        'The Brown': 'The Brown Open 1',
        'The Brown Open': 'The Brown Open 1',
        'Yopen': 'YOpen',
    },
    'Women\'s': {
        'Brixton x Chaos': 'Chaos x Brixton',
        'Cambridge Women\'s': 'Cambridge Women',
        'Chaos & Brixton': 'Chaos x Brixton',
        'Scram 1': 'SCRAM 1',
        'Scram 2': 'SCRAM 2',
        'SMOG Women': 'SMOG Women 1',
    },
    'Mixed': {
        'Black Sheep': 'Black Sheep Mixed 1',
        'Black Sheep 1': 'Black Sheep Mixed 1',
        'Black Sheep 2': 'Black Sheep Mixed 2',
        'Brixton': 'Brixton Mixed',
        'Cambridge 1': 'Cambridge Ultimate 1',
        'Cambridge 2': 'Cambridge Ultimate 2',
        'Curve': 'Curve Mixed',
        'Geometrically Frustrated Magnets': 'Geometrically Frustrated Magnets 1',
        'GU Mixed 1': 'Guildford Ultimate 1',
        'GU Mixed 2': 'Guildford Ultimate 2',
        'Horsham': 'Horsham Ultimate',
        'LED': 'LED Mixed',
        'LLLeeds Mixed  1': 'LLLeeds Mixed 1',
        'LLLeeeds Mixed 2': 'LLLeeds Mixed 2',
        'Meridian': 'Meridian Ultimate',
        'Meridian ': 'Meridian Ultimate',
        'Purple Cobras': 'Purple Cobras Mixed',
        'Reading 1': 'Reading Mixed 1',
        'Reading 2': 'Reading Mixed 2',
        'Sneeekys': 'Sneeekys 1',
        'St Albans': 'St Albans Mixed',
        'Thundering Herd': 'Thundering Herd 1',
    }
};

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

const combinedData = combineTournamentSchedules('./parsed_schedules');
prettyPrint(combinedData);
