import{r as S,u as x,j as e,z as a}from"./index-lki5-J2S.js";function j({onNavigate:P}){const[h,g]=S.useState(null),[y,c]=S.useState(!1),{data:l}=x("players","*"),{data:f}=x("matches","*",{order:{column:"date",ascending:!1}}),{data:p}=x("transactions","*"),v=[{id:"team-performance",icon:"📊",title:"Team-Performance Analyse",description:"KI-basierte Analyse der Team-Leistung über Zeit",action:()=>T()},{id:"player-valuation",icon:"💰",title:"Spieler-Bewertung",description:"KI bewertet Spieler basierend auf Performance und Marktwert",action:()=>F()},{id:"transfer-predictor",icon:"🔮",title:"Transfer Vorhersagen",description:"Voraussage von zukünftigen Transfers basierend auf Trends",action:()=>k()},{id:"formation-optimizer",icon:"⚽",title:"Aufstellungs-Optimierer",description:"Optimale Aufstellung basierend auf Spieler-Stärken",action:()=>A()},{id:"injury-predictor",icon:"🏥",title:"Verletzungsrisiko",description:"Analyse des Verletzungsrisikos von Spielern",action:()=>$()},{id:"financial-forecast",icon:"📈",title:"Finanz-Prognose",description:"Vorhersage der finanziellen Entwicklung",action:()=>E()}],T=async()=>{c(!0);try{if(await new Promise(t=>setTimeout(t,2e3)),!f||f.length===0){a.error("Nicht genügend Spieldaten für Analyse");return}const r=f.slice(0,10),i=r.filter(t=>(t.goalsa||0)>(t.goalsb||0)).length,s=r.filter(t=>(t.goalsb||0)>(t.goalsa||0)).length,d=r.length-i-s,o={title:"🤖 KI Team-Performance Analyse",data:`
📊 Analyse der letzten ${r.length} Spiele:

🟦 AEK Performance:
• Siege: ${i} (${(i/r.length*100).toFixed(1)}%)
• Trend: ${i>s?"Steigend 📈":i===s?"Stabil ↔️":"Fallend 📉"}

🟥 Real Performance:
• Siege: ${s} (${(s/r.length*100).toFixed(1)}%)
• Trend: ${s>i?"Steigend 📈":s===i?"Stabil ↔️":"Fallend 📉"}

⚪ Unentschieden: ${d}

🎯 KI-Empfehlung:
${i>s?"AEK zeigt starke Form - weiter so!":s>i?"Real dominiert - AEK sollte Taktik überdenken":"Ausgeglichene Teams - spannende Zukunft!"}
        `};g(o),a.success("🤖 KI-Analyse abgeschlossen!")}catch{a.error("Fehler bei der KI-Analyse")}finally{c(!1)}},F=async()=>{c(!0);try{if(await new Promise(t=>setTimeout(t,1500)),!l||l.length===0){a.error("Keine Spielerdaten für Analyse verfügbar");return}const i=[...l].sort((t,m)=>(m.value||0)-(t.value||0))[0],s=l.reduce((t,m)=>t+(m.value||0),0)/l.length,d=l.filter(t=>(t.value||0)<s*.5),o={title:"🤖 KI Spieler-Bewertung",data:`
💎 Top-Spieler: ${i.name} (${i.value}M €)
📊 Durchschnittswert: ${s.toFixed(1)}M €
👥 Gesamt Spieler: ${l.length}

🔍 Unterbewertete Talente (< ${(s*.5).toFixed(1)}M €):
${d.slice(0,5).map(t=>`• ${t.name} - ${t.value}M € (${t.position})`).join(`
`)}

🎯 KI-Empfehlung:
${d.length>0?`Investition in ${d[0].name} könnte sich lohnen!`:"Portfolio ist gut ausbalanciert."}
        `};g(o),a.success("🤖 Spieler-Analyse abgeschlossen!")}catch{a.error("Fehler bei der Spieler-Analyse")}finally{c(!1)}},k=async()=>{var r;c(!0);try{if(await new Promise(n=>setTimeout(n,2500)),!l||l.length===0){a.error("Keine Spielerdaten für Transfer-Analyse verfügbar");return}const i=l.filter(n=>n.team==="AEK"),s=l.filter(n=>n.team==="Real"),d=[...i,...s].reduce((n,u)=>(n[u.position]=(n[u.position]||0)+1,n),{}),o=[{name:"Pedri González",position:"ZOM",age:21,marketValue:80,eafc25Rating:85,club:"FC Barcelona",nationality:"Spanien",reason:"Junges Talent mit enormem Potenzial",pros:["Kreative Pässe","Technisch versiert","Ballsicher"],cons:["Noch jung","Hoher Preis"],fitScore:92},{name:"Jamal Musiala",position:"LF",age:21,marketValue:100,eafc25Rating:84,club:"FC Bayern München",nationality:"Deutschland",reason:"Perfekt für flexibles Offensivspiel",pros:["Dribbling-Künstler","Vielseitig","Torgefährlich"],cons:["Sehr teuer","Hohe Konkurrenz"],fitScore:89},{name:"Eduardo Camavinga",position:"ZDM",age:22,marketValue:90,eafc25Rating:83,club:"Real Madrid",nationality:"Frankreich",reason:"Stabilität im defensiven Mittelfeld",pros:["Defensive Stärke","Passspiel","Jung"],cons:["Teuer","Könnte zu Real passen"],fitScore:87},{name:"Florian Wirtz",position:"ZOM",age:21,marketValue:85,eafc25Rating:82,club:"Bayer Leverkusen",nationality:"Deutschland",reason:"Deutscher Spielmacher der Zukunft",pros:["Kreativität","Tore + Assists","Bundesliga-erprobt"],cons:["Verletzungshistorie","Hohe Erwartungen"],fitScore:91},{name:"Arda Güler",position:"RV",age:19,marketValue:25,eafc25Rating:77,club:"Real Madrid",nationality:"Türkei",reason:"Günstiges Talent mit Potenzial",pros:["Günstig","Hohes Potenzial","Junge Jahre"],cons:["Unerfahren","Entwicklung unsicher"],fitScore:78}],t=Object.keys(d).length<5?["ZOM","ST","IV"]:d.ST<2?["ST","LF","RF"]:d.IV<2?["IV","LV","RV"]:["ZM","ZOM"],m=o.filter(n=>t.includes(n.position)).sort((n,u)=>u.fitScore-n.fitScore).slice(0,3),b=l.reduce((n,u)=>n+(u.value||0),0)/l.length,M={title:"🔮 KI Transfer-Vorhersagen (Transfermarkt.de)",data:`
🌐 TRANSFERMARKT.DE EMPFEHLUNGEN

📊 Team-Analyse:
• AEK Spieler: ${i.length}
• Real Spieler: ${s.length}
• Ø Marktwert: ${b.toFixed(1)}M €
• Schwächste Positionen: ${t.join(", ")}

🎯 TOP TRANSFER-EMPFEHLUNGEN:

${m.map((n,u)=>`
${u+1}. ${n.name} (${n.age} Jahre)
   🏃 Position: ${n.position}
   💰 Marktwert: ${n.marketValue}M €
   🎮 EA FC 25: ${n.eafc25Rating}/100
   🏆 Verein: ${n.club}
   🌍 Nation: ${n.nationality}
   
   ✅ Stärken: ${n.pros.join(", ")}
   ⚠️ Schwächen: ${n.cons.join(", ")}
   🎯 Team-Fit: ${n.fitScore}%
   
   💡 Grund: ${n.reason}
`).join(`
`)}

💼 MARKT-TRENDS:
• Offensive Mittelfeldspieler +15% Wert
• Junge Verteidiger sehr gefragt
• Bundesliga-Talente haben Preisaufschlag
• Premier League-Spieler überteuert

🔍 ALTERNATIVE MÄRKTE:
• Eredivisie: Günstige Talente
• Liga Portugal: Technische Spieler
• Serie A: Taktisch versierte Profis

📈 VERKAUFS-EMPFEHLUNGEN:
${l.filter(n=>(n.value||0)>b*1.5).slice(0,2).map(n=>`• ${n.name} (${n.value}M €) - Überdurchschnittlich wertvoll`).join(`
`)}

🎯 BUDGET-EMPFEHLUNG:
Verfügbares Budget: ~${(b*l.length*.3).toFixed(0)}M €
Idealer Neuzugang: ${((r=m[0])==null?void 0:r.name)||"Siehe Empfehlungen"}
        `};g(M),a.success("🌐 Transfermarkt.de Analyse abgeschlossen!")}catch{a.error("Fehler bei der Transfer-Vorhersage")}finally{c(!1)}},A=async()=>{c(!0);try{await new Promise(i=>setTimeout(i,2200)),g({title:"⚽ KI Aufstellungs-Optimierer",data:`
🤖 Optimale Formation basierend auf verfügbaren Spielern:

🏆 Empfohlene Formation: 4-3-3

📋 Aufstellung:
         TH
    LV - IV - IV - RV
      ZDM - ZM - ZOM
    LF - ST - RF

🎯 Stärken dieser Formation:
• Ausgewogene Defensive
• Starkes Mittelfeld
• Flexible Offensive

💡 KI-Tipps:
• ZM als Spielmacher einsetzen
• LF/RF für Breite sorgen lassen
• ZDM als Absicherung

⚡ Alternative: 4-4-2 für mehr Defensive
        `}),a.success("⚽ Formation optimiert!")}catch{a.error("Fehler bei der Formations-Optimierung")}finally{c(!1)}},$=async()=>{c(!0);try{await new Promise(i=>setTimeout(i,1600)),g({title:"🏥 KI Verletzungsrisiko-Analyse",data:`
🤖 Verletzungsrisiko-Bewertung:

⚠️ Risiko-Faktoren:
• Intensität der Spiele: Hoch
• Spieler-Rotation: Mittel
• Belastungsmanagement: Verbesserungsbedarf

📊 Risiko-Kategorien:
🔴 Hoch-Risiko: Stammspieler (> 80% Einsatzzeit)
🟡 Mittel-Risiko: Rotationsspieler
🟢 Niedrig-Risiko: Ersatzspieler

🎯 Präventions-Empfehlungen:
• Mehr Rotation bei Stammspielern
• Regenerationspausen einhalten
• Fitness-Monitoring verstärken
• Aufwärmroutinen optimieren

💊 Vorsorgemaßnahmen:
• Physiotherapie nach intensiven Spielen
• Ernährungsoptimierung
• Schlafqualität verbessern
        `}),a.success("🏥 Verletzungsrisiko analysiert!")}catch{a.error("Fehler bei der Risiko-Analyse")}finally{c(!1)}},E=async()=>{c(!0);try{if(await new Promise(o=>setTimeout(o,1900)),!p){a.error("Keine Finanzdaten für Prognose verfügbar");return}const r=p.filter(o=>o.type==="income").reduce((o,t)=>o+t.amount,0),i=p.filter(o=>o.type==="expense").reduce((o,t)=>o+t.amount,0),s=r-i,d={title:"📈 KI Finanz-Prognose",data:`
🤖 Finanzielle Zukunftsanalyse:

💰 Aktuelle Bilanz:
• Einnahmen: ${r.toFixed(1)}M €
• Ausgaben: ${i.toFixed(1)}M €
• Saldo: ${s.toFixed(1)}M € ${s>=0?"✅":"⚠️"}

📊 6-Monats-Prognose:
• Erwartete Einnahmen: ${(r*1.2).toFixed(1)}M €
• Geschätzte Ausgaben: ${(i*1.15).toFixed(1)}M €
• Voraussichtlicher Saldo: ${(s*1.1).toFixed(1)}M €

🎯 KI-Empfehlungen:
${s>=0?`• Stabile Finanzlage - Investitionen möglich
• Transferbudget: ~`+(s*.7).toFixed(1)+"M €":`• Ausgaben reduzieren
• Transferverkäufe erwägen
• Kostenoptimierung nötig`}

🔮 Langzeit-Trend: ${s>=0?"Positiv 📈":"Kritisch 📉"}
        `};g(d),a.success("📈 Finanz-Prognose erstellt!")}catch{a.error("Fehler bei der Finanz-Prognose")}finally{c(!1)}};return e.jsxs("div",{className:"p-4 pb-20",children:[e.jsxs("div",{className:"mb-6",children:[e.jsxs("h2",{className:"text-2xl font-bold text-text-primary mb-2 flex items-center",children:[e.jsx("span",{className:"mr-3",children:"🤖"}),"KI-Assistent"]}),e.jsx("p",{className:"text-text-muted",children:"Intelligente Analysen und Vorhersagen für dein Team"})]}),e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6",children:v.map(r=>e.jsx("button",{onClick:r.action,disabled:y,className:"p-4 bg-bg-secondary border border-border-light rounded-lg hover:bg-bg-tertiary hover:border-primary-green transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("span",{className:"text-2xl","aria-hidden":"true",children:r.icon}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"font-semibold text-text-primary mb-1",children:r.title}),e.jsx("p",{className:"text-sm text-text-secondary",children:r.description})]})]})},r.id))}),y&&e.jsx("div",{className:"bg-primary-green bg-opacity-10 border border-primary-green rounded-lg p-4 mb-6",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"animate-spin w-6 h-6 border-2 border-primary-green border-t-transparent rounded-full"}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-semibold text-primary-green",children:"🤖 KI analysiert..."}),e.jsx("p",{className:"text-sm text-text-secondary",children:"Bitte warten Sie, während die KI die Daten verarbeitet."})]})]})}),h&&e.jsxs("div",{className:"bg-bg-secondary border border-border-light rounded-lg p-6",children:[e.jsxs("div",{className:"flex justify-between items-start mb-4",children:[e.jsx("h3",{className:"text-lg font-bold text-text-primary",children:h.title}),e.jsx("button",{onClick:()=>g(null),className:"text-text-secondary hover:text-text-primary transition-colors",children:"✕"})]}),e.jsx("pre",{className:"whitespace-pre-wrap text-sm text-text-primary font-mono bg-bg-primary p-4 rounded border border-border-light overflow-x-auto",children:h.data}),e.jsxs("div",{className:"mt-4 flex gap-2",children:[e.jsx("button",{onClick:()=>{navigator.clipboard.writeText(h.data),a.success("Analyse in Zwischenablage kopiert!")},className:"px-3 py-1 bg-primary-green text-white rounded text-sm hover:bg-green-600 transition-colors",children:"📋 Kopieren"}),e.jsx("button",{onClick:()=>g(null),className:"px-3 py-1 bg-bg-tertiary border border-border-light rounded text-sm hover:bg-bg-primary transition-colors",children:"Schließen"})]})]}),e.jsxs("div",{className:"mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4",children:[e.jsx("h4",{className:"font-semibold text-blue-800 mb-2",children:"💡 KI-Tipps"}),e.jsxs("ul",{className:"text-sm text-blue-700 space-y-1",children:[e.jsx("li",{children:"• Nutze mehrere Analysen für bessere Einschätzungen"}),e.jsx("li",{children:"• KI-Empfehlungen sind Vorschläge - finale Entscheidung liegt bei dir"}),e.jsx("li",{children:"• Regelmäßige Analysen helfen bei der Trend-Erkennung"}),e.jsx("li",{children:"• Kombiniere KI-Insights mit eigener Spielerfahrung"})]})]})]})}export{j as default};
