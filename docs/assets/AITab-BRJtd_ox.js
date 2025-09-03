import{r as S,u as T,j as n,z as c}from"./index-CZAeFb-9.js";function V({onNavigate:z}){const[$,x]=S.useState(null),[A,b]=S.useState(!1),[a,k]=S.useState("AEK"),{data:h}=T("players","*"),{data:y}=T("matches","*",{order:{column:"date",ascending:!1}}),{data:v}=T("transactions","*"),M=[{id:"team-performance",icon:"📊",title:"Team-Performance Analyse",description:"KI-basierte Analyse der Team-Leistung über Zeit",action:()=>K()},{id:"player-valuation",icon:"💰",title:"Spieler-Bewertung",description:"KI bewertet Spieler basierend auf Performance und Marktwert",action:()=>E()},{id:"transfer-predictor",icon:"🔮",title:"Transfer Vorhersagen",description:"Voraussage von zukünftigen Transfers basierend auf Trends",action:()=>F()},{id:"formation-optimizer",icon:"⚽",title:"Aufstellungs-Optimierer",description:"Optimale Aufstellung basierend auf Spieler-Stärken",action:()=>w()},{id:"injury-predictor",icon:"🏥",title:"Verletzungsrisiko",description:"Analyse des Verletzungsrisikos von Spielern",action:()=>N()},{id:"financial-forecast",icon:"📈",title:"Finanz-Prognose",description:"Vorhersage der finanziellen Entwicklung",action:()=>j()}],K=async()=>{b(!0);try{if(await new Promise(e=>setTimeout(e,2e3)),!y||y.length===0){c.error("Nicht genügend Spieldaten für Analyse");return}const t=y.slice(0,10),i=t.filter(e=>(e.goalsa||0)>(e.goalsb||0)).length,g=t.filter(e=>(e.goalsb||0)>(e.goalsa||0)).length,p=t.length-i-g,s=a==="AEK"?t.reduce((e,o)=>e+(o.goalsa||0),0):t.reduce((e,o)=>e+(o.goalsb||0),0),l=a==="AEK"?t.reduce((e,o)=>e+(o.goalsb||0),0):t.reduce((e,o)=>e+(o.goalsa||0),0),d=a==="AEK"?i:g,u=(d/t.length*100).toFixed(1),f={title:`🤖 KI Team-Performance Analyse für ${a==="AEK"?"AEK Athen":"Real Madrid"}`,data:`
📊 Analyse der letzten ${t.length} Spiele für ${a==="AEK"?"AEK Athen":"Real Madrid"}:

🎯 ${a} Performance:
• Siege: ${d} (${u}%)
• Erzielte Tore: ${s} (⌀ ${(s/t.length).toFixed(1)} pro Spiel)
• Gegentore: ${l} (⌀ ${(l/t.length).toFixed(1)} pro Spiel)
• Tor-Differenz: ${s>l?"+":""}${s-l}

📈 Form-Trend:
${d>t.length-d-p?"Steigend 📈 - Starke Phase!":d===t.length-d-p?"Stabil ↔️ - Ausgeglichene Leistung":"Fallend 📉 - Verbesserung nötig"}

🎯 KI-Empfehlung für ${a}:
${u>=70?`Exzellente Form! ${a} sollte die Taktik beibehalten und Erfolg stabilisieren.`:u>=50?`Solide Leistung. ${a} kann mit kleinen Anpassungen noch besser werden.`:`Schwächephase. ${a} sollte Taktik überdenken und Spieler motivieren.`}

💡 Taktische Empfehlungen:
• ${s<l?"Offensive verstärken - mehr Kreativität im Angriff":"Defensive stabilisieren - weniger Gegentore zulassen"}
• ${u<50?"Mentaltraining für mehr Siegeswillen":"Konstanz halten und Erfolg ausbauen"}
• Spielerrotation ${u>60?"beibehalten":"überdenken"}
        `};x(f),c.success("🤖 KI-Analyse abgeschlossen!")}catch{c.error("Fehler bei der KI-Analyse")}finally{b(!1)}},E=async()=>{b(!0);try{if(await new Promise(r=>setTimeout(r,1500)),!h||h.length===0){c.error("Keine Spielerdaten für Analyse verfügbar");return}const t=h.filter(r=>r.team===a),i=h.filter(r=>r.team!==a&&r.team!=="Ehemalige");if(t.length===0){c.error(`Keine Spielerdaten für ${a} verfügbar`);return}const p=[...t].sort((r,m)=>(m.value||0)-(r.value||0))[0],s=t.reduce((r,m)=>r+(m.value||0),0)/t.length,l=t.reduce((r,m)=>r+(m.value||0),0),d=i.reduce((r,m)=>r+(m.value||0),0),u=a==="AEK"?"Real Madrid":"AEK Athen",f=t.filter(r=>(r.value||0)<s*.7),e=t.filter(r=>(r.value||0)>s*1.5),o={title:`🤖 KI Spieler-Bewertung für ${a==="AEK"?"AEK Athen":"Real Madrid"}`,data:`
💎 Top-Spieler: ${p.name} (${p.value||0}M €)
📊 Durchschnittswert: ${s.toFixed(1)}M €
💰 Gesamtwert Kader: ${l.toFixed(1)}M €
👥 Spieler im Team: ${t.length}

⚖️ Vergleich mit ${u}:
• ${a} Kaderwert: ${l.toFixed(1)}M €
• ${u} Kaderwert: ${d.toFixed(1)}M €
• Differenz: ${l>d?"+":""}${(l-d).toFixed(1)}M €

🔍 Unterbewertete Talente (< ${(s*.7).toFixed(1)}M €):
${f.length>0?f.slice(0,3).map(r=>`• ${r.name} - ${r.value||0}M € (${r.position||"Unbekannt"})`).join(`
`):"• Keine unterbewerteten Spieler gefunden"}

💸 Überbewertete Spieler (> ${(s*1.5).toFixed(1)}M €):
${e.length>0?e.slice(0,2).map(r=>`• ${r.name} - ${r.value||0}M € (Verkaufskandidat?)`).join(`
`):"• Keine überbewerteten Spieler"}

🎯 KI-Empfehlung für ${a}:
${l>d?"Starker Kader! Fokus auf Qualität und taktische Entwicklung.":"Investition nötig. Unterbewertete Talente fördern oder neue Spieler verpflichten."}

💡 Transferstrategie:
• ${f.length>0?`Talente wie ${f[0].name} fördern`:"Keine internen Talente - externe Verstärkung suchen"}
• ${e.length>0?`Verkauf von ${e[0].name} erwägen für Budget`:"Kader gut ausbalanciert"}
        `};x(o),c.success("🤖 Spieler-Analyse abgeschlossen!")}catch{c.error("Fehler bei der Spieler-Analyse")}finally{b(!1)}},F=async()=>{var t;b(!0);try{if(await new Promise(e=>setTimeout(e,2500)),!h||h.length===0){c.error("Keine Spielerdaten für Transfer-Analyse verfügbar");return}const i=h.filter(e=>e.team==="AEK"),g=h.filter(e=>e.team==="Real"),p=[...i,...g].reduce((e,o)=>(e[o.position]=(e[o.position]||0)+1,e),{}),s=[{name:"Pedri González",position:"ZOM",age:21,marketValue:80,eafc25Rating:85,club:"FC Barcelona",nationality:"Spanien",reason:"Junges Talent mit enormem Potenzial",pros:["Kreative Pässe","Technisch versiert","Ballsicher"],cons:["Noch jung","Hoher Preis"],fitScore:92},{name:"Jamal Musiala",position:"LF",age:21,marketValue:100,eafc25Rating:84,club:"FC Bayern München",nationality:"Deutschland",reason:"Perfekt für flexibles Offensivspiel",pros:["Dribbling-Künstler","Vielseitig","Torgefährlich"],cons:["Sehr teuer","Hohe Konkurrenz"],fitScore:89},{name:"Eduardo Camavinga",position:"ZDM",age:22,marketValue:90,eafc25Rating:83,club:"Real Madrid",nationality:"Frankreich",reason:"Stabilität im defensiven Mittelfeld",pros:["Defensive Stärke","Passspiel","Jung"],cons:["Teuer","Könnte zu Real passen"],fitScore:87},{name:"Florian Wirtz",position:"ZOM",age:21,marketValue:85,eafc25Rating:82,club:"Bayer Leverkusen",nationality:"Deutschland",reason:"Deutscher Spielmacher der Zukunft",pros:["Kreativität","Tore + Assists","Bundesliga-erprobt"],cons:["Verletzungshistorie","Hohe Erwartungen"],fitScore:91},{name:"Arda Güler",position:"RV",age:19,marketValue:25,eafc25Rating:77,club:"Real Madrid",nationality:"Türkei",reason:"Günstiges Talent mit Potenzial",pros:["Günstig","Hohes Potenzial","Junge Jahre"],cons:["Unerfahren","Entwicklung unsicher"],fitScore:78}],l=Object.keys(p).length<5?["ZOM","ST","IV"]:p.ST<2?["ST","LF","RF"]:p.IV<2?["IV","LV","RV"]:["ZM","ZOM"],d=s.filter(e=>l.includes(e.position)).sort((e,o)=>o.fitScore-e.fitScore).slice(0,3),u=h.reduce((e,o)=>e+(o.value||0),0)/h.length,f={title:"🔮 KI Transfer-Vorhersagen (Transfermarkt.de)",data:`
🌐 TRANSFERMARKT.DE EMPFEHLUNGEN

📊 Team-Analyse:
• AEK Spieler: ${i.length}
• Real Spieler: ${g.length}
• Ø Marktwert: ${u.toFixed(1)}M €
• Schwächste Positionen: ${l.join(", ")}

🎯 TOP TRANSFER-EMPFEHLUNGEN:

${d.map((e,o)=>`
${o+1}. ${e.name} (${e.age} Jahre)
   🏃 Position: ${e.position}
   💰 Marktwert: ${e.marketValue}M €
   🎮 EA FC 25: ${e.eafc25Rating}/100
   🏆 Verein: ${e.club}
   🌍 Nation: ${e.nationality}
   
   ✅ Stärken: ${e.pros.join(", ")}
   ⚠️ Schwächen: ${e.cons.join(", ")}
   🎯 Team-Fit: ${e.fitScore}%
   
   💡 Grund: ${e.reason}
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
${h.filter(e=>(e.value||0)>u*1.5).slice(0,2).map(e=>`• ${e.name} (${e.value}M €) - Überdurchschnittlich wertvoll`).join(`
`)}

🎯 BUDGET-EMPFEHLUNG:
Verfügbares Budget: ~${(u*h.length*.3).toFixed(0)}M €
Idealer Neuzugang: ${((t=d[0])==null?void 0:t.name)||"Siehe Empfehlungen"}
        `};x(f),c.success("🌐 Transfermarkt.de Analyse abgeschlossen!")}catch{c.error("Fehler bei der Transfer-Vorhersage")}finally{b(!1)}},w=async()=>{b(!0);try{await new Promise(r=>setTimeout(r,2200));const t=(h==null?void 0:h.filter(r=>r.team===a))||[];if(t.length===0){c.error(`Keine Spieler für ${a} verfügbar`);return}const i=t.reduce((r,m)=>(r[m.position]=(r[m.position]||0)+1,r),{}),g=(i.IV||0)>=2&&(i.LV||0)>=1&&(i.RV||0)>=1,p=(i.ZM||0)>=2,s=(i.ST||0)>=2;let l="4-3-3",d="Ausgewogene Formation";s&&g?(l="4-4-2",d="Nutzt verfügbare Stürmer optimal"):p||(l="3-5-2",d="Verstärkt schwaches Mittelfeld");const u=t.filter(r=>r.position==="TH").sort((r,m)=>(m.value||0)-(r.value||0))[0],f=t.filter(r=>r.position==="ZM"||r.position==="ZOM").sort((r,m)=>(m.value||0)-(r.value||0))[0],e=t.filter(r=>r.position==="ST"||r.position==="LF"||r.position==="RF").sort((r,m)=>(m.value||0)-(r.value||0))[0],o={title:`⚽ KI Aufstellungs-Optimierer für ${a==="AEK"?"AEK Athen":"Real Madrid"}`,data:`
🤖 Optimale Formation für ${a} basierend auf ${t.length} verfügbaren Spielern:

🏆 Empfohlene Formation: ${l}
📝 Grund: ${d}

📊 Kader-Analyse:
• Torhüter: ${i.TH||0}
• Verteidiger: ${(i.IV||0)+(i.LV||0)+(i.RV||0)}
• Mittelfeld: ${(i.ZM||0)+(i.ZDM||0)+(i.ZOM||0)}
• Angriff: ${(i.ST||0)+(i.LF||0)+(i.RF||0)}

⭐ Schlüsselspieler:
${u?`• Tor: ${u.name} (${u.value||0}M €)`:"• Tor: Kein Torhüter verfügbar"}
${f?`• Mittelfeld: ${f.name} (${f.value||0}M €)`:"• Mittelfeld: Kein Mittelfeldspieler verfügbar"}
${e?`• Angriff: ${e.name} (${e.value||0}M €)`:"• Angriff: Kein Angreifer verfügbar"}

💡 KI-Tipps für ${a}:
• ${f?`${f.name} als Spielmacher einsetzen`:"Kreativen Mittelfeldspieler verpflichten"}
• ${g?"Defensive ist gut besetzt":"Verteidigung verstärken"}
• ${i.ST>=2?"Sturm-Rotation nutzen":"Angriff durch Flügelspieler verstärken"}

⚡ Alternative Formationen:
• ${l!=="4-3-3"?"4-3-3: Mehr Offensive":"4-4-2: Mehr Defensive"}
• ${l!=="3-5-2"?"3-5-2: Mittelfeld-Dominanz":"4-5-1: Defensive Stabilität"}
        `};x(o),c.success(`⚽ Formation für ${a} optimiert!`)}catch{c.error("Fehler bei der Formations-Optimierung")}finally{b(!1)}},N=async()=>{b(!0);try{await new Promise(i=>setTimeout(i,1600)),x({title:"🏥 KI Verletzungsrisiko-Analyse",data:`
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
        `}),c.success("🏥 Verletzungsrisiko analysiert!")}catch{c.error("Fehler bei der Risiko-Analyse")}finally{b(!1)}},j=async()=>{b(!0);try{if(await new Promise(s=>setTimeout(s,1900)),!v){c.error("Keine Finanzdaten für Prognose verfügbar");return}const t=v.filter(s=>s.type==="income").reduce((s,l)=>s+l.amount,0),i=v.filter(s=>s.type==="expense").reduce((s,l)=>s+l.amount,0),g=t-i,p={title:"📈 KI Finanz-Prognose",data:`
🤖 Finanzielle Zukunftsanalyse:

💰 Aktuelle Bilanz:
• Einnahmen: ${t.toFixed(1)}M €
• Ausgaben: ${i.toFixed(1)}M €
• Saldo: ${g.toFixed(1)}M € ${g>=0?"✅":"⚠️"}

📊 6-Monats-Prognose:
• Erwartete Einnahmen: ${(t*1.2).toFixed(1)}M €
• Geschätzte Ausgaben: ${(i*1.15).toFixed(1)}M €
• Voraussichtlicher Saldo: ${(g*1.1).toFixed(1)}M €

🎯 KI-Empfehlungen:
${g>=0?`• Stabile Finanzlage - Investitionen möglich
• Transferbudget: ~`+(g*.7).toFixed(1)+"M €":`• Ausgaben reduzieren
• Transferverkäufe erwägen
• Kostenoptimierung nötig`}

🔮 Langzeit-Trend: ${g>=0?"Positiv 📈":"Kritisch 📉"}
        `};x(p),c.success("📈 Finanz-Prognose erstellt!")}catch{c.error("Fehler bei der Finanz-Prognose")}finally{b(!1)}};return n.jsxs("div",{className:"p-4 pb-20",children:[n.jsxs("div",{className:"mb-6",children:[n.jsxs("h2",{className:"text-2xl font-bold text-text-primary mb-2 flex items-center",children:[n.jsx("span",{className:"mr-3",children:"🤖"}),"KI-Assistent"]}),n.jsx("p",{className:"text-text-muted",children:"Intelligente Analysen und Vorhersagen für dein Team"})]}),n.jsxs("div",{className:"mb-6 modern-card",children:[n.jsxs("h3",{className:"font-semibold text-text-primary mb-3 flex items-center",children:[n.jsx("span",{className:"mr-2",children:"🎯"}),"Team für KI-Analyse auswählen"]}),n.jsxs("div",{className:"flex gap-3",children:[n.jsxs("button",{onClick:()=>k("AEK"),className:`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${a==="AEK"?"bg-blue-500 text-white shadow-md":"bg-bg-secondary text-text-primary hover:bg-blue-100 border border-border-light"}`,children:[n.jsx("span",{className:"text-lg",children:"🔵"}),"AEK Athen"]}),n.jsxs("button",{onClick:()=>k("Real"),className:`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${a==="Real"?"bg-red-500 text-white shadow-md":"bg-bg-secondary text-text-primary hover:bg-red-100 border border-border-light"}`,children:[n.jsx("span",{className:"text-lg",children:"🔴"}),"Real Madrid"]})]}),n.jsx("p",{className:"text-sm text-text-muted mt-2",children:"Die KI-Analysen werden speziell für das ausgewählte Team angepasst."})]}),n.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6",children:M.map(t=>n.jsx("button",{onClick:t.action,disabled:A,className:"p-4 bg-bg-secondary border border-border-light rounded-lg hover:bg-bg-tertiary hover:border-primary-green transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed",children:n.jsxs("div",{className:"flex items-start gap-3",children:[n.jsx("span",{className:"text-2xl","aria-hidden":"true",children:t.icon}),n.jsxs("div",{className:"flex-1",children:[n.jsx("h3",{className:"font-semibold text-text-primary mb-1",children:t.title}),n.jsx("p",{className:"text-sm text-text-secondary",children:t.description})]})]})},t.id))}),A&&n.jsx("div",{className:"bg-primary-green bg-opacity-10 border border-primary-green rounded-lg p-4 mb-6",children:n.jsxs("div",{className:"flex items-center gap-3",children:[n.jsx("div",{className:"animate-spin w-6 h-6 border-2 border-primary-green border-t-transparent rounded-full"}),n.jsxs("div",{children:[n.jsx("h3",{className:"font-semibold text-primary-green",children:"🤖 KI analysiert..."}),n.jsx("p",{className:"text-sm text-text-secondary",children:"Bitte warten Sie, während die KI die Daten verarbeitet."})]})]})}),$&&n.jsxs("div",{className:"bg-bg-secondary border border-border-light rounded-lg p-6",children:[n.jsxs("div",{className:"flex justify-between items-start mb-4",children:[n.jsx("h3",{className:"text-lg font-bold text-text-primary",children:$.title}),n.jsx("button",{onClick:()=>x(null),className:"text-text-secondary hover:text-text-primary transition-colors",children:"✕"})]}),n.jsx("pre",{className:"whitespace-pre-wrap text-sm text-text-primary font-mono bg-bg-primary p-4 rounded border border-border-light overflow-x-auto",children:$.data}),n.jsxs("div",{className:"mt-4 flex gap-2",children:[n.jsx("button",{onClick:()=>{navigator.clipboard.writeText($.data),c.success("Analyse in Zwischenablage kopiert!")},className:"px-3 py-1 bg-primary-green text-white rounded text-sm hover:bg-green-600 transition-colors",children:"📋 Kopieren"}),n.jsx("button",{onClick:()=>x(null),className:"px-3 py-1 bg-bg-tertiary border border-border-light rounded text-sm hover:bg-bg-primary transition-colors",children:"Schließen"})]})]}),n.jsxs("div",{className:"mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4",children:[n.jsx("h4",{className:"font-semibold text-blue-800 mb-2",children:"💡 KI-Tipps"}),n.jsxs("ul",{className:"text-sm text-blue-700 space-y-1",children:[n.jsx("li",{children:"• Nutze mehrere Analysen für bessere Einschätzungen"}),n.jsx("li",{children:"• KI-Empfehlungen sind Vorschläge - finale Entscheidung liegt bei dir"}),n.jsx("li",{children:"• Regelmäßige Analysen helfen bei der Trend-Erkennung"}),n.jsx("li",{children:"• Kombiniere KI-Insights mit eigener Spielerfahrung"})]})]})]})}export{V as default};
