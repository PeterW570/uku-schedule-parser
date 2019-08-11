const parseSchedule = require('./parser');

/**
 * conifg contains:
 * URL - url of the google sheeet
 * TOURNAMENT - name of the tournament
 * DIVISIONS - ability to configure for multiple divisions in a single sheet
 * DAYS_TO_DATES - object with the name of the day as the key and 'YYYY-MM-DD' as the value
 * DIVISION - if you don't specify DIVISIONS you can say which division it is
 * SEED_TAB_IDX - (0 based) index
 * POOL_RES_TAB_IDX - (0 based) index of the pool result tab
 * BRACKET_RES_TAB_IDX - can be null, a (0 based) index, or an array of (0 based) indices
 * TODO: specify what you want to print out
 */
const config = require('./config'); // TODO: read from command line args

function prettyPrint(obj) {
    console.log(JSON.stringify(obj, null, 2));
}

(async function() {
    const { resultsByTeam } = await parseSchedule(config.URL, {
        tournament: config.TOURNAMENT,
        divisions: config.DIVISIONS,
        division: config.DIVISION,
        daysToDatesMap: config.DAYS_TO_DATES,
        seedTabIdx: config.SEED_TAB_IDX,
        poolResTabIdx: config.POOL_RES_TAB_IDX,
        bracketResTabIdx: config.BRACKET_RES_TAB_IDX,
    });

    prettyPrint(resultsByTeam);
})();
