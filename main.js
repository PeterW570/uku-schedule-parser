const parseSchedule = require('./parser');

// TODO: read from command line args
const URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSeI5t8hinpGgXfpzn1YD8JDA29crugWz2g_CxvZJ69xVcuvcwhMqe55-Ownr6Cm_GkMNJ0jRYlz1mp/pubhtml#';
parseSchedule(URL, {
    tournament: 'UKU Regionals (North) 2019',
});
