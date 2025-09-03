import"./dataManager-CtWei30S.js";new Date().toISOString().slice(0,10);window.showMatchStatistics=function(){if(matches.length===0){alert("📊 Keine Spiele vorhanden für Statistiken");return}const e={totalMatches:matches.length,aekWins:matches.filter(a=>(a.goalsa||0)>(a.goalsb||0)).length,realWins:matches.filter(a=>(a.goalsb||0)>(a.goalsa||0)).length,draws:matches.filter(a=>(a.goalsa||0)===(a.goalsb||0)).length,totalGoals:matches.reduce((a,t)=>a+(t.goalsa||0)+(t.goalsb||0),0),highestScore:Math.max(...matches.map(a=>Math.max(a.goalsa||0,a.goalsb||0))),averageGoals:0};e.averageGoals=(e.totalGoals/e.totalMatches).toFixed(1);const s=`🏆 Match-Statistiken:

Gesamt: ${e.totalMatches} Spiele
AEK Siege: ${e.aekWins}
Real Siege: ${e.realWins}
Unentschieden: ${e.draws}

Tore gesamt: ${e.totalGoals}
Ø Tore/Spiel: ${e.averageGoals}
Höchstes Ergebnis: ${e.highestScore} Tore`;alert(s)};
