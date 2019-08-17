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
 * TO_PRINT - specify which object from parseSchedule you want to print (defaults to resultsByTeam)
 */
const config = require('./config'); // TODO: read from command line args

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
        });
        const toPrint = config.TO_PRINT || 'resultsByTeam';
        prettyPrint(parsedRes[toPrint]);
    }
    catch (err) {
        console.error(err);
    }
})();
