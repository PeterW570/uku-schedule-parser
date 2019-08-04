const parseSchedule = require('./parser');

function prettyPrint(obj) {
    console.log(JSON.stringify(obj, null, 2));
}

// TODO: read from command line args
const URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSeI5t8hinpGgXfpzn1YD8JDA29crugWz2g_CxvZJ69xVcuvcwhMqe55-Ownr6Cm_GkMNJ0jRYlz1mp/pubhtml#';
(async function() {
    const { resultsByTeam } = await parseSchedule(URL, {
        tournament: 'UKU Regionals (North) 2019',
    });

    prettyPrint(resultsByTeam);
})();
