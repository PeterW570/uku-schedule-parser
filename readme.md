To run: `node parser.js`
You'll need to `npm intall` when you first clone the repo

You'll aslo need a config.js file. Example:

```
module.exports = {
    URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTr1Y097yyn2EVatC1PwUzlX9GWxNZ8n7wEEhn4XbDRQkJwcUyuOy1_wO4JOuJqXKfV8b7wESEdLgrM/pubhtml#',
    TOURNAMENT: 'UKU Regionals (South) 2019',
    DIVISIONS: {
        'Open': {
            pools: ['E', 'F', 'G', 'H', 'J'],
            processSeed: initial => Number(initial.slice(-1)),
            bracketTabIdx: 6,
        },
        'Mixed': {
            pools: ['C', 'D'],
            processSeed: initial => Number(initial.slice(-1)),
            bracketTabIdx: 5,
        },
        'Women\'s': {
            pools: ['A'],
            processSeed: initial => Number(initial.slice(-1)),
            bracketTabIdx: null,
        }
    },
};
```
