const axios = require('axios');
const cheerio = require('cheerio');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const POOL_RES_TAB_IDX = 3;
const BRACKET_TAB_IDX = 3;

async function getHTML(url) {
    const { data: html } = await axios.get(url);
    return html;
}

function prettyPrint(obj) {
    console.log(JSON.stringify(obj, null, 2));
}

async function parseSchedule(url, {
    tournament,
    poolResTabIdx,
    bracketResTabIdx,
} = {}) {
    const html = await getHTML(url);
    const $ = cheerio.load(html);

    // TODO: save division in game data
    // TODO: link pools to divisions
    // TODO: pass in tabs for division brackets
    // TODO: convert day & time into ISO string format
    // TODO: option to not set net score on 1-0 results (default to doing this)

    const initialSeedings = parseInitialSeedings($); // TODO: ability to pass functions to parse seeds according to division, ability to filter to specific division
    const poolResults = parsePoolResults($, { tabIdx: poolResTabIdx, tournament }); // TODO: convert pool seeds to overall seeds, ability to filter to specific division
    const bracketResults = parseBracketResults($, { tabIdx: bracketResTabIdx, tournament });
    // const mixedBracketResults = parseBracketResults($, 4);
    // const openBracketResults = parseBracketResults($, 5);

    const allGames = [
        ...poolResults,
        ...bracketResults,
    ].sort((a, b) => {
        if (a.day === b.day) {
            return a.time < b.time ? -1 : a.time === b.time ? 0 : 1;
        }
        else {
            return DAYS.findIndex(day => day === a.day.toLowerCase()) - DAYS.findIndex(day => day === b.day.toLowerCase());
        }
    })

    const resultsByTeam = {}; // TODO: make distinction between divisions
    allGames.forEach(game => {
        if (!(game.teams[0].team in resultsByTeam)) {
            resultsByTeam[game.teams[0].team] = [];
        }
        if (!(game.teams[1].team in resultsByTeam)) {
            resultsByTeam[game.teams[1].team] = [];
        }

        resultsByTeam[game.teams[0].team].push({
            against: game.teams[1].team,
            scoreFor: game.teams[0].score,
            scoreAgainst: game.teams[1].score,
            netScore: game.teams[0].netScore,
            tournament: game.tournament,
            pitch: game.pitch,
            day: game.day,
            time: game.time,
        });

        resultsByTeam[game.teams[1].team].push({
            against: game.teams[0].team,
            scoreFor: game.teams[1].score,
            scoreAgainst: game.teams[0].score,
            netScore: game.teams[1].netScore,
            tournament: game.tournament,
            pitch: game.pitch,
            day: game.day,
            time: game.time,
        });
    });

    prettyPrint(resultsByTeam);

    return {
        allGames,
        resultsByTeam,
        initialSeedings,
        poolResults,
    };
}

function parseInitialSeedings($, tabIdx = 0) {
    const cells = $('table').eq(tabIdx).find('td');
    const seedings = [];

    let parseIdx = null;
    cells.each((idx, c) => {
        const text = $(c).text();
        if (text) {
            if (parseIdx !== null) {
                const parsing = seedings[seedings.length - 1];
                switch (parseIdx) {
                    case 0:
                        parsing.seed = Number(text);
                        parseIdx++;
                        break;
                    case 1:
                        parsing.team = text;
                        parseIdx = null;
                        break;
                }
            }
            else {
                const seedsMatch = text.match(/^[A-Z]+\d+$/); // TODO: handle two letters or greek?
                if (seedsMatch) {
                    parseIdx = 0;
                    seedings.push({
                        poolSeed: seedsMatch[0]
                    });
                }
            }
        }
    });

    return seedings;
}

function parsePoolResults($, { tabIdx = POOL_RES_TAB_IDX, tournament } = {}) {
    const cells = $('table').eq(tabIdx).find('td');
    const results = [];
    let parseIdx = null;
    cells.each((idx, c) => {
        const text = $(c).text();
        if (text) {
            if (parseIdx !== null) {
                const lastResult = results[results.length - 1];
                switch (parseIdx) {
                    case 0:
                        lastResult.teams[0].team = text;
                        break;
                    case 1:
                        if (!isNaN(parseInt(text))) {
                            lastResult.teams[0].score = Number(text);
                        }
                        else {
                            parseIdx = null;
                            results.pop();
                        }
                        break;
                    case 3:
                        if (!isNaN(parseInt(text))) {
                            lastResult.teams[1].score = Number(text);
                            lastResult.teams[0].netScore = lastResult.teams[0].score - lastResult.teams[1].score;
                            lastResult.teams[1].netScore = lastResult.teams[1].score - lastResult.teams[0].score;
                        }
                        else {
                            parseIdx = null;
                            results.pop();
                        }
                        break;
                    case 4:
                        lastResult.teams[1].team = text;
                        break;
                    case 5:
                        const metaMatch = text.match(/(\w+), (\d\d:\d\d) - (\w+ \d)/);
                        lastResult.day = metaMatch[1];
                        lastResult.time = metaMatch[2];
                        lastResult.pitch = metaMatch[3];
                }
                if (parseIdx === 5)
                    parseIdx = null;
                else
                    parseIdx++;
            }
            else {
                const seedsMatch = text.match(/^(\w+\d+)v(\w+\d+)$/); // TODO: handle greek letters?
                if (seedsMatch) {
                    parseIdx = 0;
                    results.push({
                        teams: [{
                            seed: seedsMatch[1]
                        }, {
                            seed: seedsMatch[2]
                        }],
                        tournament,
                    });
                }
            }
        }
    });
    return results;
}

function parseBracketResults($, { tabIdx = BRACKET_TAB_IDX, tournament } = {}) {
    const rows = $('table').eq(tabIdx).find('tr');
    const bracketResults = [];

    let foundSeed = false;
    let foundTeam = false;
    let foundUnmatched = [];
    const foundMeta = [];

    function reset() {
        foundSeed = false;
        foundTeam = false;
    }

    rows.each((rowIdx, r) => {
        const cells = $(r).find('td');
        cells.each((cellIdx, c) => {
            const text = $(c).text();
            if (foundTeam !== false) {
                if (text && !isNaN(parseInt(text))) {
                    foundUnmatched.push({
                        team: foundTeam,
                        seed: foundSeed,
                        score: Number(text),
                        rowIdx,
                        colStartIdx: cellIdx - 2,
                        colEndIdx: cellIdx,
                    });
                }
                reset();
            }
            else if (foundSeed !== false) {
                if (text && !['→'].includes(text)) {
                    foundTeam = text;
                }
                else {
                    reset();
                }
            }
            else if (text) {
                const metaMatch = text.match(/(Pitch \d+), (\w+) (\d\d:\d\d)/);
                if (metaMatch) {
                    foundMeta.push({
                        row: rowIdx,
                        col: cellIdx,
                        pitch: metaMatch[1],
                        day: metaMatch[2],
                        time: metaMatch[3]
                    });
                }
                else if (!isNaN(parseInt(text))) {
                    foundSeed = text;
                }
            }
        });
    });

    foundMeta.forEach(meta => {
        const teamAboveIdx = foundUnmatched.findIndex(el => {
            return meta.row - el.rowIdx === 1
                && meta.col >= el.colStartIdx && meta.col <= el.colEndIdx;
        });
        const teamBelowIdx = foundUnmatched.findIndex(el => {
            return meta.row - el.rowIdx === -1
                && meta.col >= el.colStartIdx && meta.col <= el.colEndIdx;
        });
        if (teamAboveIdx > -1 && teamBelowIdx > -1) {
            const teamAbove = foundUnmatched[teamAboveIdx];
            const teamBelow = foundUnmatched[teamBelowIdx];
            bracketResults.push({
                tournament,
                pitch: meta.pitch,
                day: meta.day,
                time: meta.time,
                teams:[
                    {
                        team: teamAbove.team,
                        seed: teamAbove.seed,
                        score: teamAbove.score,
                        netScore: teamAbove.score - teamBelow.score
                    },
                    {
                        team: teamBelow.team,
                        seed: teamBelow.seed,
                        score: teamBelow.score,
                        netScore: teamBelow.score - teamAbove.score
                    }
                ]
            });
            foundUnmatched = [
                ...foundUnmatched.slice(0, teamAboveIdx),
                ...foundUnmatched.slice(teamAboveIdx + 1, teamBelowIdx),
                ...foundUnmatched.slice(teamBelowIdx + 1),
            ];
        }
    });

    return bracketResults;
}

module.exports = parseSchedule;
