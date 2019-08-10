To run: `node parser.js`
You'll need to `npm intall` when you first clone the repo

You'll aslo need a config.js file. Example:

```
module.exports = {
    URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTr1Y097yyn2EVatC1PwUzlX9GWxNZ8n7wEEhn4XbDRQkJwcUyuOy1_wO4JOuJqXKfV8b7wESEdLgrM/pubhtml#',
    TOURNAMENT: 'UKU Regionals (South) 2019',
    DAYS_TO_DATES: {
        'saturday': '2019-08-03',
        'sunday': '2019-08-04',
    },
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

If there's only one division you can do:
```
module.exports = {
    URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTtSsjpYD-QECw5YU75P66i-Fcx6UQwHJAJy92tJn_ZUIdMxjZWoyOgjUsVTgAZSp8scfsxdQ62FISb/pubhtml',
    TOURNAMENT: 'Caledonia\’s Call 2019',
    DAYS_TO_DATES: {
        'saturday': '2019-05-18',
        'sunday': '2019-05-19',
    },
    DIVISION: 'Mixed',
    SEED_TAB_IDX: 0,
    POOL_RES_TAB_IDX: 3,
    BRACKET_RES_TAB_IDX: 4,
};
```

`bracketTabIdx` or `BRACKET_RES_TAB_IDX` can be `null`, a number e.g. `4`, or an array of numbers e.g. `[4, 5]`
