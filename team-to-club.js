const overrides = {
    'Thundering Him': 'Thundering Herd',
    'Bristol Red': 'Bristol',
    'Bristol White': 'Bristol',
    'Cambridge Women': 'Cambridge Ultimate',
    'Lady Lemmings': 'Leamington Lemmings',
    'Reading Aces': 'Reading',
    'Reading Diamonds': 'Reading',
    'Thundering Her': 'Thundering Herd',
    'Dreadnought Development Mixed': 'Dreadnought',
    'Lurve Mixed': 'Curve',
    'MIST': 'SMOG',
    'MUC-chester': 'MUC',
    'SMOKE': 'SMOG',
};

// NOTE: need to alias team names before passing in
module.exports = function (teamName) {
    let clubName = teamName;

    if (clubName in overrides) {
        return overrides[clubName];
    }

    let checkedAllEndings = false;
    const toRemove = [
        /(\s+\d+)$/,
        /(\s+[A|B])$/,
        /(\s+Open)$/i,
        /(\s+Men(?:'s)?)$/i,
        /(\s+Women(?:'s)?)$/i,
        /(\s+Mixed)$/i,
    ];

    while (!checkedAllEndings) {
        let foundMatch = false;
        for (regex of toRemove) {
            if (clubName.match(regex)) {
                foundMatch = true;
                clubName = clubName.replace(regex, '');
            }
        }
        checkedAllEndings = !foundMatch;
    }

    return clubName;
};
