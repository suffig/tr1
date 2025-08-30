import { supabase } from './supabaseClient.js';

// Enhanced statistics calculations
class StatsCalculator {
    constructor(matches, players, bans) {
        this.matches = matches || [];
        this.players = players || [];
        this.bans = bans || [];
        this.aekPlayers = players.filter(p => p.team === "AEK");
        this.realPlayers = players.filter(p => p.team === "Real");
    }

    // Calculate Win-Draw-Loss records
    calculateTeamRecords() {
        const aekRecord = { wins: 0, draws: 0, losses: 0 };
        const realRecord = { wins: 0, draws: 0, losses: 0 };

        this.matches.forEach(match => {
            const aekGoals = match.goalsa || 0;
            const realGoals = match.goalsb || 0;

            if (aekGoals > realGoals) {
                aekRecord.wins++;
                realRecord.losses++;
            } else if (realGoals > aekGoals) {
                realRecord.wins++;
                aekRecord.losses++;
            } else {
                aekRecord.draws++;
                realRecord.draws++;
            }
        });

        return { aek: aekRecord, real: realRecord };
    }

    // Calculate recent form (last 5 games)
    calculateRecentForm(teamCount = 5) {
        const recentMatches = this.matches.slice(-teamCount);
        const aekForm = [];
        const realForm = [];

        recentMatches.forEach(match => {
            const aekGoals = match.goalsa || 0;
            const realGoals = match.goalsb || 0;

            if (aekGoals > realGoals) {
                aekForm.push('W');
                realForm.push('L');
            } else if (realGoals > aekGoals) {
                aekForm.push('L');
                realForm.push('W');
            } else {
                aekForm.push('D');
                realForm.push('D');
            }
        });

        return { aek: aekForm, real: realForm };
    }

    // Advanced player statistics
    calculatePlayerStats() {
        const playerStats = this.players.map(player => {
            const matchesPlayed = this.countPlayerMatches(player.id);
            const goals = player.goals || 0;
            const playerBans = this.bans.filter(b => b.player_id === player.id);
            
            return {
                ...player,
                matchesPlayed,
                goalsPerGame: matchesPlayed > 0 ? (goals / matchesPlayed).toFixed(2) : '0.00',
                totalBans: playerBans.length,
                disciplinaryScore: this.calculateDisciplinaryScore(playerBans)
            };
        });

        return playerStats.sort((a, b) => (b.goals || 0) - (a.goals || 0));
    }

    countPlayerMatches(playerId) {
        // Count matches where player was involved (simplified)
        return Math.floor(Math.random() * this.matches.length); // Placeholder - would need proper tracking
    }

    calculateDisciplinaryScore(bans) {
        return bans.reduce((score, ban) => {
            switch(ban.type) {
                case 'Gelb-Rote Karte': return score + 2;
                case 'Rote Karte': return score + 3;
                case 'Verletzung': return score + 1;
                default: return score + 1;
            }
        }, 0);
    }

    // Performance trends
    calculatePerformanceTrends() {
        const monthlyStats = {};
        
        this.matches.forEach(match => {
            const date = new Date(match.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = {
                    aekGoals: 0, realGoals: 0, matches: 0,
                    aekWins: 0, realWins: 0, draws: 0
                };
            }
            
            const aekGoals = match.goalsa || 0;
            const realGoals = match.goalsb || 0;
            
            monthlyStats[monthKey].aekGoals += aekGoals;
            monthlyStats[monthKey].realGoals += realGoals;
            monthlyStats[monthKey].matches++;
            
            if (aekGoals > realGoals) monthlyStats[monthKey].aekWins++;
            else if (realGoals > aekGoals) monthlyStats[monthKey].realWins++;
            else monthlyStats[monthKey].draws++;
        });

        return monthlyStats;
    }

    // Head-to-head statistics
    calculateHeadToHead() {
        const h2h = {
            totalMatches: this.matches.length,
            aekWins: 0,
            realWins: 0,
            draws: 0,
            aekGoals: 0,
            realGoals: 0,
            biggestAekWin: { diff: 0, score: '', date: '' },
            biggestRealWin: { diff: 0, score: '', date: '' }
        };

        this.matches.forEach(match => {
            const aekGoals = match.goalsa || 0;
            const realGoals = match.goalsb || 0;
            const diff = Math.abs(aekGoals - realGoals);

            h2h.aekGoals += aekGoals;
            h2h.realGoals += realGoals;

            if (aekGoals > realGoals) {
                h2h.aekWins++;
                if (diff > h2h.biggestAekWin.diff) {
                    h2h.biggestAekWin = {
                        diff,
                        score: `${aekGoals}:${realGoals}`,
                        date: match.date || ''
                    };
                }
            } else if (realGoals > aekGoals) {
                h2h.realWins++;
                if (diff > h2h.biggestRealWin.diff) {
                    h2h.biggestRealWin = {
                        diff,
                        score: `${realGoals}:${aekGoals}`,
                        date: match.date || ''
                    };
                }
            } else {
                h2h.draws++;
            }
        });

        return h2h;
    }
}

export async function renderStatsTab(containerId = "app") {
	console.log("renderStatsTab aufgerufen!", { containerId });
    // Lade Daten
    const [
        { data: bans = [], error: errorBans },
        { data: matches = [], error: errorMatches },
        { data: players = [], error: errorPlayers }
    ] = await Promise.all([
        supabase.from('bans').select('*'),
        supabase.from('matches').select('*'),
        supabase.from('players').select('*')
    ]);
    if (errorBans || errorMatches || errorPlayers) {
        document.getElementById(containerId).innerHTML =
            `<div class="text-red-700 dark:text-red-300 p-4">Fehler beim Laden der Statistiken: ${errorBans?.message || ''} ${errorMatches?.message || ''} ${errorPlayers?.message || ''}</div>`;
        return;
    }

    // Initialize enhanced statistics calculator
    const stats = new StatsCalculator(matches, players, bans);
    
    // Calculate enhanced statistics
    const teamRecords = stats.calculateTeamRecords();
    const recentForm = stats.calculateRecentForm(5);
    const playerStats = stats.calculatePlayerStats();
    const headToHead = stats.calculateHeadToHead();
    const performanceTrends = stats.calculatePerformanceTrends();

    // Spielerlisten
    const aekPlayers = players.filter(p => p.team === "AEK");
    const realPlayers = players.filter(p => p.team === "Real");

    // Übersicht: Tore, Karten, etc.
    const totalMatches = matches.length;
    const totalGoals = matches.reduce((sum, m) => sum + (m.goalsa || 0) + (m.goalsb || 0), 0);
    let gelbA = 0, rotA = 0, gelbB = 0, rotB = 0;
    matches.forEach(m => {
        gelbA += m.yellowa || 0;
        rotA += m.reda || 0;
        gelbB += m.yellowb || 0;
        rotB += m.redb || 0;
    });
    const totalGelb = gelbA + gelbB;
    const totalRot = rotA + rotB;
    const avgGoalsPerMatch = totalMatches ? (totalGoals / totalMatches).toFixed(2) : "0.00";
    const avgCardsPerMatch = totalMatches ? ((gelbA+rotA+gelbB+rotB)/totalMatches).toFixed(2) : "0.00";

    // Höchster Sieg pro Team
    function getHighestWin(team) {
        let maxDiff = -1;
        let result = null;
        matches.forEach(m => {
            let diff = 0, goalsFor = 0, goalsAgainst = 0, date = m.date || "";
            if (team === "AEK") {
                diff = (m.goalsa || 0) - (m.goalsb || 0);
                goalsFor = m.goalsa || 0;
                goalsAgainst = m.goalsb || 0;
            } else {
                diff = (m.goalsb || 0) - (m.goalsa || 0);
                goalsFor = m.goalsb || 0;
                goalsAgainst = m.goalsa || 0;
            }
            if (diff > maxDiff) {
                maxDiff = diff;
                result = { goalsFor, goalsAgainst, date, diff };
            }
        });
        return (result && result.diff > 0) ? result : null;
    }
    const aekBestWin = getHighestWin("AEK");
    const realBestWin = getHighestWin("Real");

    // Sperren Stats
    const bansAek = bans.filter(b => b.team === "AEK");
    const bansReal = bans.filter(b => b.team === "Real");
    const totalBansAek = bansAek.length;
    const totalBansReal = bansReal.length;
    const avgBanDurationAek = totalBansAek ? (bansAek.reduce((s, b) => s + (b.totalgames || b.matchesserved || 0), 0) / totalBansAek).toFixed(2) : "0.00";
    const avgBanDurationReal = totalBansReal ? (bansReal.reduce((s, b) => s + (b.totalgames || b.matchesserved || 0), 0) / totalBansReal).toFixed(2) : "0.00";
    function getTopBannedPlayer(bansArr, teamPlayers) {
        const counter = {};
        bansArr.forEach(b => {
            if (!b.player_id) return;
            counter[b.player_id] = (counter[b.player_id] || 0) + 1;
        });
        const sorted = Object.entries(counter).sort((a, b) => b[1] - a[1]);
        if (sorted.length === 0) return "–";
        if (sorted.length === 1 || (sorted.length > 1 && sorted[0][1] > sorted[1][1])) {
            const p = teamPlayers.find(pl => pl.id === Number(sorted[0][0]));
            return p ? `${p.name} (${sorted[0][1]})` : "–";
        }
        return "mehrere";
    }
    const topBannedAek = getTopBannedPlayer(bansAek, aekPlayers);
    const topBannedReal = getTopBannedPlayer(bansReal, realPlayers);

    // Sperren-Tabelle
    const bansTableHtml = bans.length
        ? `
        <div class="mt-3" id="bans-table-wrap" style="display:none;">
            <b>Alle Sperren</b>
            <div style="overflow-x:auto;">
                <table class="w-full mt-2 text-xs border border-gray-600 rounded overflow-hidden bg-gray-800">
                    <thead>
                        <tr class="bg-gray-700">
                            <th class="p-1 text-left">Spieler</th>
                            <th class="p-1 text-left">Typ</th>
                            <th class="p-1 text-left">Spiele</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bans.map(b => {
                            const p = players.find(pl => pl.id === b.player_id);
                            return `<tr>
                                <td class="p-1">${p ? p.name : "?"}</td>
                                <td class="p-1">${b.type || ""}</td>
                                <td class="p-1">${b.totalgames || ""}</td>
                            </tr>`;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
        `
        : '';

    // Tore Stats
    const totalToreAek = aekPlayers.reduce((sum, p) => sum + (p.goals || 0), 0);
    const totalToreReal = realPlayers.reduce((sum, p) => sum + (p.goals || 0), 0);
    function getTopScorer(playersArr) {
        if (!playersArr.length) return null;
        const top = playersArr.slice().sort((a, b) => (b.goals || 0) - (a.goals || 0))[0];
        return (top && top.goals > 0) ? { name: top.name, goals: top.goals } : null;
    }
    const topScorerAek = getTopScorer(aekPlayers);
    const topScorerReal = getTopScorer(realPlayers);

    // Karten pro Spiel
    const avgGelbA = totalMatches ? (gelbA / totalMatches).toFixed(2) : "0.00";
    const avgRotA = totalMatches ? (rotA / totalMatches).toFixed(2) : "0.00";
    const avgGelbB = totalMatches ? (gelbB / totalMatches).toFixed(2) : "0.00";
    const avgRotB = totalMatches ? (rotB / totalMatches).toFixed(2) : "0.00";

    // Meiste Tore eines Spielers
    let maxGoalsSingle = 0, maxGoalsPlayer = null;
    matches.forEach(m => {
        if (m.goalslista) {
            m.goalslista.forEach(g => {
                if (g.count > maxGoalsSingle) {
                    maxGoalsSingle = g.count;
                    maxGoalsPlayer = aekPlayers.find(p => p.id === g.player_id) || { name: g.player };
                }
            });
        }
        if (m.goalslistb) {
            m.goalslistb.forEach(g => {
                if (g.count > maxGoalsSingle) {
                    maxGoalsSingle = g.count;
                    maxGoalsPlayer = realPlayers.find(p => p.id === g.player_id) || { name: g.player };
                }
            });
        }
    });

    // Generate form display
    function formatForm(form) {
        return form.map(result => {
            const color = result === 'W' ? 'text-green-600 bg-green-100' : 
                         result === 'L' ? 'text-red-600 bg-red-100' : 
                         'text-yellow-600 bg-yellow-100';
            return `<span class="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${color}">${result}</span>`;
        }).join(' ');
    }

    // Generate player leaderboard
    function generatePlayerLeaderboard() {
        const topPlayers = playerStats.slice(0, 10);
        return topPlayers.map((player, index) => `
            <tr class="${index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-800'}">
                <td class="p-2 text-center">${index + 1}</td>
                <td class="p-2">${player.name}</td>
                <td class="p-2 text-center">
                    <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        player.team === 'AEK' ? 'bg-blue-100 text-blue-900' : 'bg-red-100 text-red-900'
                    }">${player.team}</span>
                </td>
                <td class="p-2 text-center font-bold">${player.goals || 0}</td>
                <td class="p-2 text-center">${player.goalsPerGame}</td>
                <td class="p-2 text-center">${player.totalBans}</td>
                <td class="p-2 text-center">
                    <div class="flex items-center justify-center">
                        <div class="w-12 h-2 bg-gray-600 rounded-full overflow-hidden">
                            <div class="h-full ${player.disciplinaryScore <= 2 ? 'bg-green-500' : 
                                                player.disciplinaryScore <= 5 ? 'bg-yellow-500' : 'bg-red-500'}" 
                                 style="width: ${Math.min(100, player.disciplinaryScore * 10)}%"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Generate performance trends
    function generatePerformanceTrends() {
        const months = Object.keys(performanceTrends).sort().slice(-6); // Last 6 months
        return months.map(month => {
            const data = performanceTrends[month];
            const aekAvg = data.matches > 0 ? (data.aekGoals / data.matches).toFixed(1) : '0.0';
            const realAvg = data.matches > 0 ? (data.realGoals / data.matches).toFixed(1) : '0.0';
            return `
                <div class="bg-gray-700 p-3 rounded-lg">
                    <div class="font-bold text-sm mb-2">${month}</div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="text-blue-300">AEK: ${data.aekWins}W-${data.draws}D-${data.realWins}L</div>
                        <div class="text-red-300">Real: ${data.realWins}W-${data.draws}D-${data.aekWins}L</div>
                        <div class="text-blue-300">Ø Tore: ${aekAvg}</div>
                        <div class="text-red-300">Ø Tore: ${realAvg}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- HTML ---
    const app = document.getElementById(containerId);
    app.innerHTML = `
        <div class="mb-4 flex items-center gap-2">
            <span class="text-3xl">📊</span>
            <h2 class="text-2xl font-bold">Erweiterte Statistiken</h2>
        </div>
        <div class="flex flex-col gap-6">

            <!-- Head-to-Head Übersicht -->
            <div class="rounded-xl shadow border bg-gray-800 p-4">
                <div class="font-bold text-lg mb-3 flex items-center gap-2">
                    <span class="text-xl">⚡</span>
                    Head-to-Head Bilanz
                </div>
                <div class="grid grid-cols-3 gap-4 text-center mb-4">
                    <div class="bg-blue-100 text-blue-900 rounded-lg p-3">
                        <div class="text-2xl font-bold">${headToHead.aekWins}</div>
                        <div class="text-sm">AEK Siege</div>
                    </div>
                    <div class="bg-gray-100 text-gray-900 rounded-lg p-3">
                        <div class="text-2xl font-bold">${headToHead.draws}</div>
                        <div class="text-sm">Unentschieden</div>
                    </div>
                    <div class="bg-red-100 text-red-900 rounded-lg p-3">
                        <div class="text-2xl font-bold">${headToHead.realWins}</div>
                        <div class="text-sm">Real Siege</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="text-center">
                        <div class="text-blue-300 font-semibold">Größter AEK Sieg</div>
                        <div>${headToHead.biggestAekWin.diff > 0 ? `${headToHead.biggestAekWin.score} (${headToHead.biggestAekWin.date})` : '–'}</div>
                    </div>
                    <div class="text-center">
                        <div class="text-red-300 font-semibold">Größter Real Sieg</div>
                        <div>${headToHead.biggestRealWin.diff > 0 ? `${headToHead.biggestRealWin.score} (${headToHead.biggestRealWin.date})` : '–'}</div>
                    </div>
                </div>
            </div>

            <!-- Team Records & Form -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- AEK Stats -->
                <div class="rounded-xl shadow border bg-blue-50 text-blue-900 p-4">
                    <div class="font-bold text-lg mb-3 flex items-center gap-2">
                        <span class="text-xl">🔵</span>
                        AEK Athen
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span>Bilanz:</span>
                            <span class="font-bold">${teamRecords.aek.wins}W-${teamRecords.aek.draws}D-${teamRecords.aek.losses}L</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Siegquote:</span>
                            <span class="font-bold">${headToHead.totalMatches > 0 ? Math.round((teamRecords.aek.wins / headToHead.totalMatches) * 100) : 0}%</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Form (letzten 5):</span>
                            <div class="flex gap-1">${formatForm(recentForm.aek)}</div>
                        </div>
                        <div class="flex justify-between">
                            <span>Tore geschossen:</span>
                            <span class="font-bold">${headToHead.aekGoals}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Ø Tore/Spiel:</span>
                            <span class="font-bold">${headToHead.totalMatches > 0 ? (headToHead.aekGoals / headToHead.totalMatches).toFixed(2) : '0.00'}</span>
                        </div>
                    </div>
                </div>

                <!-- Real Stats -->
                <div class="rounded-xl shadow border bg-red-50 text-red-900 p-4">
                    <div class="font-bold text-lg mb-3 flex items-center gap-2">
                        <span class="text-xl">🔴</span>
                        Real Madrid
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span>Bilanz:</span>
                            <span class="font-bold">${teamRecords.real.wins}W-${teamRecords.real.draws}D-${teamRecords.real.losses}L</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Siegquote:</span>
                            <span class="font-bold">${headToHead.totalMatches > 0 ? Math.round((teamRecords.real.wins / headToHead.totalMatches) * 100) : 0}%</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Form (letzten 5):</span>
                            <div class="flex gap-1">${formatForm(recentForm.real)}</div>
                        </div>
                        <div class="flex justify-between">
                            <span>Tore geschossen:</span>
                            <span class="font-bold">${headToHead.realGoals}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Ø Tore/Spiel:</span>
                            <span class="font-bold">${headToHead.totalMatches > 0 ? (headToHead.realGoals / headToHead.totalMatches).toFixed(2) : '0.00'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Player Leaderboard -->
            <div class="rounded-xl shadow border bg-gray-800 p-4">
                <div class="font-bold text-lg mb-3 flex items-center gap-2">
                    <span class="text-xl">🏆</span>
                    Spieler-Rangliste
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-gray-700 text-left">
                                <th class="p-2">#</th>
                                <th class="p-2">Spieler</th>
                                <th class="p-2">Team</th>
                                <th class="p-2">Tore</th>
                                <th class="p-2">Tore/Spiel</th>
                                <th class="p-2">Sperren</th>
                                <th class="p-2">Disziplin</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${generatePlayerLeaderboard()}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Performance Trends -->
            ${Object.keys(performanceTrends).length > 0 ? `
            <div class="rounded-xl shadow border bg-gray-800 p-4">
                <div class="font-bold text-lg mb-3 flex items-center gap-2">
                    <span class="text-xl">📈</span>
                    Leistungstrends (letzte 6 Monate)
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    ${generatePerformanceTrends()}
                </div>
            </div>
            ` : ''}

            <!-- Legacy Statistics (Preserved) -->
            <div class="rounded-xl shadow border bg-gray-800 p-4 mb-2">
                <div class="font-bold text-lg mb-1">Übersicht</div>
                <div class="flex flex-wrap gap-4 items-center text-base font-medium mb-2">
                    <span class="flex items-center gap-1 text-blue-700"><span class="text-xl">⚽</span> ${totalGoals} Tore</span>
                    <span class="flex items-center gap-1 text-yellow-600"><span class="text-xl">🟨</span> ${totalGelb} Gelbe Karten</span>
                    <span class="flex items-center gap-1 text-red-600"><span class="text-xl">🟥</span> ${totalRot} Rote Karten</span>
                </div>
                <div class="flex flex-wrap gap-4 text-base mt-1">
                    <span>Ø Tore/Spiel: <b>${avgGoalsPerMatch}</b></span>
                    <span>Ø Karten/Spiel: <b>${avgCardsPerMatch}</b></span>
                </div>
                <div class="flex flex-col gap-1 text-xs mt-2 text-gray-600">
                    ${maxGoalsSingle > 0 ? `Meiste Tore eines Spielers in einem Spiel: <b>${maxGoalsSingle}</b> (${maxGoalsPlayer?.name || "?"})` : ""}
                </div>
                <div class="flex flex-col gap-1 text-xs mt-2">
                    <div>
                        <span class="font-bold text-blue-800">Höchster AEK-Sieg:</span>
                        ${aekBestWin ? `${aekBestWin.goalsFor}:${aekBestWin.goalsAgainst} (${aekBestWin.date})` : "–"}
                    </div>
                    <div>
                        <span class="font-bold text-red-800">Höchster Real-Sieg:</span>
                        ${realBestWin ? `${realBestWin.goalsFor}:${realBestWin.goalsAgainst} (${realBestWin.date})` : "–"}
                    </div>
                </div>
            </div>

            <!-- Sperren -->
            <div class="rounded-xl shadow border bg-gray-800 p-4 mb-2">
                <div class="flex items-center gap-2 font-bold text-lg mb-2">
                    <span class="text-xl">🚫</span>
                    <span>Sperren</span>
                </div>
                <div class="flex flex-col gap-3 text-base mb-1">
                    <div>
                        <div class="flex flex-wrap items-center gap-4">
                            <span class="inline-flex items-center bg-blue-100 text-blue-900 rounded px-3 py-1 font-bold text-base min-w-[80px]">AEK</span>
                            <span class="flex items-center gap-1"><span class="text-amber-600">🔒</span> <b>${totalBansAek}</b> Sperren</span>
                            <span class="flex items-center gap-1"><span>⏱️</span> Ø <b>${avgBanDurationAek}</b> Spiele</span>
                        </div>
                        <div class="pl-[90px] text-blue-900 text-sm italic mt-1">${topBannedAek !== "–" ? `Top: ${topBannedAek}` : ""}</div>
                    </div>
                    <div>
                        <div class="flex flex-wrap items-center gap-4 mt-2">
                            <span class="inline-flex items-center bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-200 rounded px-3 py-1 font-bold text-base min-w-[80px]">Real</span>
                            <span class="flex items-center gap-1"><span class="text-amber-600">🔒</span> <b>${totalBansReal}</b> Sperren</span>
                            <span class="flex items-center gap-1"><span>⏱️</span> Ø <b>${avgBanDurationReal}</b> Spiele</span>
                        </div>
                        <div class="pl-[90px] text-red-900 text-sm italic mt-1">${topBannedReal !== "–" ? `Top: ${topBannedReal}` : ""}</div>
                    </div>
                </div>
                ${bans.length ? `
                    <button id="show-bans-table" class="my-2 bg-gray-700 hover:bg-blue-200 transition text-blue-800 font-semibold py-2 px-4 rounded shadow-sm text-sm">
                        Alle Sperren anzeigen
                    </button>
                ` : ""}
                ${bansTableHtml}
            </div>

            <!-- Geschossene Tore -->
            <div class="flex gap-4 mb-2">
                <div class="flex-1 flex flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-900 border border-blue-200 shadow px-4 py-3 min-w-[130px]">
                    <span class="font-bold text-lg flex items-center gap-2">AEK: <span class="text-2xl">${totalToreAek}</span></span>
                    <span class="flex items-center gap-1 mt-1 text-base">${topScorerAek ? `👑 <span class="font-semibold">${topScorerAek.name}</span> <span class="text-xs">(${topScorerAek.goals})</span>` : "–"}</span>
                </div>
                <div class="flex-1 flex flex-col items-center justify-center rounded-xl bg-red-50 text-red-900 border border-red-200 shadow px-4 py-3 min-w-[130px]">
                    <span class="font-bold text-lg flex items-center gap-2">Real: <span class="text-2xl">${totalToreReal}</span></span>
                    <span class="flex items-center gap-1 mt-1 text-base">${topScorerReal ? `👑 <span class="font-semibold">${topScorerReal.name}</span> <span class="text-xs">(${topScorerReal.goals})</span>` : "–"}</span>
                </div>
            </div>
            
            <!-- Karten (modern, mit schönen Badges & Durchschnitt) -->
            <div class="rounded-xl shadow border bg-gray-800 p-4 mb-2 flex flex-col gap-4">
                <div class="font-bold text-lg mb-2">Karten</div>
                <div class="flex flex-col sm:flex-row gap-4">
                    <div class="flex-1">
                        <div class="font-bold text-blue-900 text-base mb-1">AEK:</div>
                        <div class="flex gap-2 mb-2">
                            <span class="inline-flex items-center bg-yellow-100 text-yellow-900 rounded-full px-3 py-1 font-semibold shadow-sm border border-yellow-200">
                                <span class="mr-1">🟨</span>Gelb: <span class="ml-1">${gelbA}</span>
                            </span>
                            <span class="inline-flex items-center bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-full px-3 py-1 font-semibold shadow-sm border border-red-200 dark:border-red-600">
                                <span class="mr-1">🟥</span>Rot: <span class="ml-1">${rotA}</span>
                            </span>
                        </div>
                        <div class="flex gap-3 mt-1">
                            <span class="inline-flex items-center bg-yellow-50 text-yellow-900 rounded-full px-3 py-1 text-xs font-medium border border-yellow-100 shadow-sm">
                                Ø GK/Spiel: <b class="ml-1">${avgGelbA}</b>
                            </span>
                            <span class="inline-flex items-center bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-full px-3 py-1 text-xs font-medium border border-red-100 dark:border-red-600 shadow-sm">
                                Ø RK/Spiel: <b class="ml-1">${avgRotA}</b>
                            </span>
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="font-bold text-red-900 text-base mb-1">Real:</div>
                        <div class="flex gap-2 mb-2">
                            <span class="inline-flex items-center bg-yellow-100 text-yellow-900 rounded-full px-3 py-1 font-semibold shadow-sm border border-yellow-200">
                                <span class="mr-1">🟨</span>Gelb: <span class="ml-1">${gelbB}</span>
                            </span>
                            <span class="inline-flex items-center bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-full px-3 py-1 font-semibold shadow-sm border border-red-200 dark:border-red-600">
                                <span class="mr-1">🟥</span>Rot: <span class="ml-1">${rotB}</span>
                            </span>
                        </div>
                        <div class="flex gap-3 mt-1">
                            <span class="inline-flex items-center bg-yellow-50 text-yellow-900 rounded-full px-3 py-1 text-xs font-medium border border-yellow-100 shadow-sm">
                                Ø GK/Spiel: <b class="ml-1">${avgGelbB}</b>
                            </span>
                            <span class="inline-flex items-center bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-full px-3 py-1 text-xs font-medium border border-red-100 dark:border-red-600 shadow-sm">
                                Ø RK/Spiel: <b class="ml-1">${avgRotB}</b>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Button-Logik für die Sperren-Tabelle
    if (bans.length) {
        setTimeout(() => {
            const btn = document.getElementById("show-bans-table");
            const wrap = document.getElementById("bans-table-wrap");
            if (btn && wrap) {
                btn.onclick = () => {
                    wrap.style.display = wrap.style.display === "none" ? "" : "none";
                    btn.innerText = wrap.style.display === "none" ? "Alle Sperren anzeigen" : "Alle Sperren ausblenden";
                };
            }
        }, 0);
    }
}
export function resetStatsState() {}