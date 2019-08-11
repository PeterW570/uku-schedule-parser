const axios = require('axios');
const cheerio = require('cheerio');

const SEED_TAB_IDX = 0;
const POOL_RES_TAB_IDX = 3;
const BRACKET_TAB_IDX = 4;

async function getHTML(url) {
    const { data: html } = await axios.get(url);
    return html;
}

function groupByTeam(games) {
    const resultsByTeam = {};

    games.forEach(game => {
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
            timestamp: game.timestamp,
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
            timestamp: game.timestamp,
        });
    });

    return resultsByTeam;
}

async function parseSchedule(url, {
    tournament,
    seedTabIdx,
    poolResTabIdx,
    bracketResTabIdx,
    divisions,
    division,
    daysToDatesMap,
} = {}) {
    const html = await getHTML(url);
    const $ = cheerio.load(html);

    // TODO: option to not set net score on 1-0 results (default to doing this)

    let initialSeedings, poolResults, bracketResults, allGames, resultsByTeam = {};
    if (divisions) {
        initialSeedings = {};
        poolResults = {};
        bracketResults = {};
        allGames = {};

        const allSeedings = parseInitialSeedings($, { tabIdx: seedTabIdx });
        const allPoolResults = parsePoolResults($, { tabIdx: poolResTabIdx });
        Object.keys(divisions).forEach(division => {
            const {
                pools,
                processSeed = (seed) => seed,
                bracketTabIdx
            } = divisions[division];
            initialSeedings[division] = allSeedings
                .filter(team => pools.some(pool => team.poolSeed.startsWith(pool)))
                .map(team => ({
                    ...team,
                    seed: processSeed(team.seed),
                }));

            poolResults[division] = allPoolResults
                .filter(game => pools.includes(game.pool));

            if (Array.isArray(bracketTabIdx)) {
                bracketResults[division] = bracketTabIdx.reduce((res, tabIdx) => res.concat(parseBracketResults($, { tabIdx })), []);
            }
            else {
                bracketResults[division] = parseBracketResults($, { tabIdx: bracketTabIdx });
            }

            allGames[division] = [
                ...poolResults[division],
                ...bracketResults[division],
            ].map(game => {
                return {
                    ...game,
                    tournament,
                    timestamp: `${daysToDatesMap[game.day.toLowerCase()]}T${game.time}:00.000Z`,
                };
            })
            .sort((a, b) => a.timestamp < b.timestamp ? -1 : a.timestamp === b.timestamp ? 0 : 1);

            resultsByTeam[division] = groupByTeam(allGames[division]);
        });
    }
    else {
        initialSeedings = parseInitialSeedings($, { tabIdx: seedTabIdx });
        poolResults = parsePoolResults($, { tabIdx: poolResTabIdx });
        if (Array.isArray(bracketResTabIdx)) {
            bracketResults = bracketResTabIdx.reduce((res, tabIdx) => res.concat(parseBracketResults($, { tabIdx })), []);
        }
        else {
            bracketResults = parseBracketResults($, { tabIdx: bracketResTabIdx });
        }

        allGames = [
            ...poolResults,
            ...bracketResults,
        ].map(game => {
            return {
                ...game,
                tournament,
                timestamp: `${daysToDatesMap[game.day.toLowerCase()]}T${game.time}:00.000Z`,
            };
        })
        .sort((a, b) => a.timestamp < b.timestamp ? -1 : a.timestamp === b.timestamp ? 0 : 1);

        resultsByTeam = groupByTeam(allGames);

        if (division) {
            initialSeedings = { [division]: initialSeedings };
            poolResults = { [division]: poolResults };
            bracketResults = { [division]: bracketResults };
            allGames = { [division]: allGames };
            resultsByTeam = { [division]: resultsByTeam };
        }
    }

    return {
        allGames,
        resultsByTeam,
        initialSeedings,
        poolResults,
        bracketResults,
    };
}

function parseInitialSeedings($, { tabIdx = SEED_TAB_IDX } = {}) {
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
                        parsing.seed = text;
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

function parsePoolResults($, { tabIdx = POOL_RES_TAB_IDX } = {}) {
    const cells = $('table').eq(tabIdx).find('td');
    const results = [];
    let parseIdx = null;
    cells.each((idx, c) => {
        const text = $(c).text();
        if (text || parseIdx === 2) {
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
                        if (text.toLowerCase() === 'carried over') {
                            parseIdx = null;
                            results.pop();
                        }
                        else {
                            const metaMatch = text.match(/(\w+), (\d\d:\d\d) - (\w+ \d)/);
                            lastResult.day = metaMatch[1];
                            lastResult.time = metaMatch[2];
                            lastResult.pitch = metaMatch[3];
                        }
                }
                if (parseIdx === 5)
                    parseIdx = null;
                else if (parseIdx !== null)
                    parseIdx++;
            }
            else {
                const seedsMatch = text.match(/^(([\w\u0370-\u03FF]+)\d+)v([\w\u0370-\u03FF]+\d+)$/); // Regex matches word, greek & coptic chars
                if (seedsMatch) {
                    parseIdx = 0;
                    results.push({
                        teams: [{
                            seed: seedsMatch[1]
                        }, {
                            seed: seedsMatch[3]
                        }],
                        pool: seedsMatch[2],
                    });
                }
            }
        }
    });
    return results;
}

function parseBracketResults($, { tabIdx = BRACKET_TAB_IDX } = {}) {
    if (tabIdx === null)
        return [];

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

    const hardMerges = [];

    rows.each((rowIdx, r) => {
        const cells = $(r).find('td');
        cells.each((cellIdx, c) => {
            const text = $(c).text();
            const colspan = $(c).attr('colspan');
            const rowspan = $(c).attr('rowspan');
            const colIdx = hardMerges
                .filter(spec => spec.rowStartIdx <= rowIdx && spec.rowEndIdx > rowIdx)
                .reduce((acc, mergeSpec) => {
                if (mergeSpec.colIdx > acc) {
                    return acc;
                }
                else if (rowIdx === mergeSpec.rowStartIdx) {
                    return acc + mergeSpec.colspan - 1;
                }
                else {
                    return acc + mergeSpec.colspan;
                }
            }, cellIdx);
            if (colspan && rowspan) {
                hardMerges.push({
                    rowStartIdx: rowIdx,
                    rowEndIdx: rowIdx + Number(rowspan),
                    colIdx,
                    colspan: Number(colspan),
                });
            }
            if (foundTeam !== false) {
                if (text && !isNaN(parseInt(text))) {
                    foundUnmatched.push({
                        team: foundTeam,
                        seed: foundSeed,
                        score: Number(text),
                        rowIdx,
                        colStartIdx: colIdx - 2,
                        colEndIdx: colIdx,
                    });
                }
                reset();
            }
            else if (foundSeed !== false) {
                if (text && !['→', '├'].includes(text)) {
                    foundTeam = text;
                }
                else {
                    reset();
                }
            }
            else if (text) {
                const metaMatch = text.match(/(Pitch \d+), (\w+) (\d\d:\d\d)/i);
                if (metaMatch) {
                    foundMeta.push({
                        row: rowIdx,
                        col: colIdx,
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
                && (meta.col + 1) >= el.colStartIdx && meta.col <= el.colEndIdx;
        });
        const teamBelowIdx = foundUnmatched.findIndex(el => {
            return meta.row - el.rowIdx === -1
                && (meta.col + 1) >= el.colStartIdx && meta.col <= el.colEndIdx;
        });
        if (teamAboveIdx > -1 && teamBelowIdx > -1) {
            const teamAbove = foundUnmatched[teamAboveIdx];
            const teamBelow = foundUnmatched[teamBelowIdx];
            bracketResults.push({
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
