const parseSchedule = require('./parser');

/**
 * conifg contains:
 * URL - url of the google sheeet
 * TOURNAMENT - name of the tournament
 * DIVISIONS - ability to cinfigure for multiple divisions in a single sheet
 */
const config = require('./config'); // TODO: read from command line args

function prettyPrint(obj) {
    console.log(JSON.stringify(obj, null, 2));
}

(async function() {
    const { resultsByTeam } = await parseSchedule(config.URL, {
        tournament: config.TOURNAMENT,
        divisions: config.DIVISIONS,
    });

    prettyPrint(resultsByTeam);
})();
