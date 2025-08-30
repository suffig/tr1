import { supabase } from './supabaseClient.js';
import { ErrorHandler } from './utils.js';

// Achievement System for FIFA Tracker
class AchievementSystem {
    constructor() {
        this.achievements = [
            // Match Achievements
            { 
                id: 'first_win_aek', 
                title: 'Erster AEK Sieg', 
                description: 'Gewinne das erste Spiel mit AEK',
                icon: '🏆',
                category: 'matches',
                requirement: { type: 'team_wins', team: 'AEK', count: 1 }
            },
            { 
                id: 'first_win_real', 
                title: 'Erster Real Sieg', 
                description: 'Gewinne das erste Spiel mit Real',
                icon: '🏆',
                category: 'matches',
                requirement: { type: 'team_wins', team: 'Real', count: 1 }
            },
            { 
                id: 'hat_trick', 
                title: 'Hattrick-Held', 
                description: 'Erziele 3 oder mehr Tore in einem Spiel',
                icon: '⚽',
                category: 'goals',
                requirement: { type: 'goals_in_match', count: 3 }
            },
            { 
                id: 'high_scoring', 
                title: 'Torspektakel', 
                description: 'Spiele ein Match mit 6+ Gesamttoren',
                icon: '🎯',
                category: 'goals',
                requirement: { type: 'total_goals_match', count: 6 }
            },
            { 
                id: 'win_streak_3', 
                title: 'Siegesserie', 
                description: 'Gewinne 3 Spiele in Folge',
                icon: '🔥',
                category: 'streaks',
                requirement: { type: 'win_streak', count: 3 }
            },
            { 
                id: 'clean_sheet', 
                title: 'Zu Null', 
                description: 'Gewinne ein Spiel ohne Gegentor',
                icon: '🛡️',
                category: 'defense',
                requirement: { type: 'clean_sheet', count: 1 }
            },
            
            // Player Achievements
            { 
                id: 'top_scorer_10', 
                title: 'Torjäger', 
                description: 'Erziehe 10 Tore mit einem Spieler',
                icon: '👑',
                category: 'players',
                requirement: { type: 'player_goals', count: 10 }
            },
            { 
                id: 'team_player', 
                title: 'Teamspieler', 
                description: 'Habe 5 verschiedene Torschützen',
                icon: '🤝',
                category: 'team',
                requirement: { type: 'different_scorers', count: 5 }
            },
            
            // Discipline Achievements  
            { 
                id: 'disciplined', 
                title: 'Diszipliniert', 
                description: 'Spiele 10 Matches ohne Rote Karte',
                icon: '😇',
                category: 'discipline',
                requirement: { type: 'matches_no_red', count: 10 }
            },
            { 
                id: 'troublemaker', 
                title: 'Problemfall', 
                description: 'Sammle 5 Sperren mit einem Team',
                icon: '😈',
                category: 'discipline',
                requirement: { type: 'team_bans', count: 5 }
            },
            
            // Milestone Achievements
            { 
                id: 'veteran', 
                title: 'Veteran', 
                description: 'Spiele 25 Matches',
                icon: '🎖️',
                category: 'milestones',
                requirement: { type: 'total_matches', count: 25 }
            },
            { 
                id: 'goal_machine', 
                title: 'Tormaschine', 
                description: 'Erziehe insgesamt 100 Tore',
                icon: '⚡',
                category: 'goals',
                requirement: { type: 'total_goals', count: 100 }
            }
        ];
        
        this.unlockedAchievements = new Set();
        this.newAchievements = [];
    }

    // Check all achievements against current data
    async checkAchievements(matches, players, bans) {
        const newUnlocked = [];
        
        for (const achievement of this.achievements) {
            if (this.unlockedAchievements.has(achievement.id)) continue;
            
            if (await this.checkRequirement(achievement.requirement, matches, players, bans)) {
                this.unlockedAchievements.add(achievement.id);
                newUnlocked.push(achievement);
            }
        }
        
        if (newUnlocked.length > 0) {
            this.newAchievements = [...this.newAchievements, ...newUnlocked];
            this.showAchievementNotifications(newUnlocked);
        }
        
        return newUnlocked;
    }
    
    async checkRequirement(req, matches, players, bans) {
        switch (req.type) {
            case 'team_wins':
                return this.countTeamWins(matches, req.team) >= req.count;
                
            case 'goals_in_match':
                return matches.some(match => {
                    const aekGoals = match.goalsa || 0;
                    const realGoals = match.goalsb || 0;
                    return Math.max(aekGoals, realGoals) >= req.count;
                });
                
            case 'total_goals_match':
                return matches.some(match => {
                    const total = (match.goalsa || 0) + (match.goalsb || 0);
                    return total >= req.count;
                });
                
            case 'win_streak':
                return this.checkWinStreak(matches) >= req.count;
                
            case 'clean_sheet':
                return matches.some(match => {
                    const aekGoals = match.goalsa || 0;
                    const realGoals = match.goalsb || 0;
                    return (aekGoals > 0 && realGoals === 0) || (realGoals > 0 && aekGoals === 0);
                });
                
            case 'player_goals':
                return players.some(player => (player.goals || 0) >= req.count);
                
            case 'different_scorers':
                const scorers = players.filter(p => (p.goals || 0) > 0);
                return scorers.length >= req.count;
                
            case 'matches_no_red':
                const recentMatches = matches.slice(-req.count);
                return recentMatches.length >= req.count && 
                       recentMatches.every(m => (m.reda || 0) === 0 && (m.redb || 0) === 0);
                       
            case 'team_bans':
                const aekBans = bans.filter(b => b.team === 'AEK').length;
                const realBans = bans.filter(b => b.team === 'Real').length;
                return Math.max(aekBans, realBans) >= req.count;
                
            case 'total_matches':
                return matches.length >= req.count;
                
            case 'total_goals':
                const totalGoals = matches.reduce((sum, m) => sum + (m.goalsa || 0) + (m.goalsb || 0), 0);
                return totalGoals >= req.count;
                
            default:
                return false;
        }
    }
    
    countTeamWins(matches, team) {
        return matches.filter(match => {
            const aekGoals = match.goalsa || 0;
            const realGoals = match.goalsb || 0;
            return (team === 'AEK' && aekGoals > realGoals) || 
                   (team === 'Real' && realGoals > aekGoals);
        }).length;
    }
    
    checkWinStreak(matches) {
        let maxStreak = 0;
        let currentStreak = 0;
        let lastWinner = null;
        
        for (const match of matches) {
            const aekGoals = match.goalsa || 0;
            const realGoals = match.goalsb || 0;
            
            let winner = null;
            if (aekGoals > realGoals) winner = 'AEK';
            else if (realGoals > aekGoals) winner = 'Real';
            
            if (winner && winner === lastWinner) {
                currentStreak++;
            } else {
                maxStreak = Math.max(maxStreak, currentStreak);
                currentStreak = winner ? 1 : 0;
                lastWinner = winner;
            }
        }
        
        return Math.max(maxStreak, currentStreak);
    }
    
    showAchievementNotifications(achievements) {
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                this.showAchievementPopup(achievement);
            }, index * 2000); // Stagger notifications
        });
    }
    
    showAchievementPopup(achievement) {
        const popup = document.createElement('div');
        popup.className = 'fixed top-4 right-4 z-50 bg-yellow-400 text-yellow-900 p-4 rounded-lg shadow-lg border-2 border-yellow-500 animate-bounce max-w-sm';
        popup.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="text-2xl">${achievement.icon}</div>
                <div>
                    <div class="font-bold">Achievement Unlocked!</div>
                    <div class="text-sm font-semibold">${achievement.title}</div>
                    <div class="text-xs">${achievement.description}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-yellow-700 hover:text-yellow-900">✕</button>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (popup.parentElement) {
                popup.remove();
            }
        }, 8000);
    }
    
    // Get achievement progress for display
    async getProgress(matches, players, bans) {
        const progress = [];
        
        for (const achievement of this.achievements) {
            const isUnlocked = this.unlockedAchievements.has(achievement.id);
            let currentProgress = 0;
            
            if (!isUnlocked) {
                currentProgress = await this.getRequirementProgress(achievement.requirement, matches, players, bans);
            }
            
            progress.push({
                ...achievement,
                unlocked: isUnlocked,
                progress: currentProgress,
                maxProgress: achievement.requirement.count || 1,
                percentage: isUnlocked ? 100 : Math.min(100, (currentProgress / (achievement.requirement.count || 1)) * 100)
            });
        }
        
        return progress.sort((a, b) => {
            if (a.unlocked !== b.unlocked) return a.unlocked ? 1 : -1;
            return b.percentage - a.percentage;
        });
    }
    
    async getRequirementProgress(req, matches, players, bans) {
        switch (req.type) {
            case 'team_wins':
                return this.countTeamWins(matches, req.team);
            case 'total_matches':
                return matches.length;
            case 'total_goals':
                return matches.reduce((sum, m) => sum + (m.goalsa || 0) + (m.goalsb || 0), 0);
            case 'player_goals':
                return Math.max(0, ...players.map(p => p.goals || 0));
            case 'different_scorers':
                return players.filter(p => (p.goals || 0) > 0).length;
            case 'team_bans':
                const aekBans = bans.filter(b => b.team === 'AEK').length;
                const realBans = bans.filter(b => b.team === 'Real').length;
                return Math.max(aekBans, realBans);
            case 'win_streak':
                return this.checkWinStreak(matches);
            default:
                return 0;
        }
    }
    
    // Get categories for filtering
    getCategories() {
        return [...new Set(this.achievements.map(a => a.category))];
    }
    
    // Get recent achievements
    getRecentAchievements(limit = 5) {
        return this.newAchievements.slice(-limit);
    }
}

// Global achievement system instance
export const achievementSystem = new AchievementSystem();

// Achievement tab renderer
export async function renderAchievementsTab(containerId = "app") {
    console.log("renderAchievementsTab aufgerufen!", { containerId });
    
    try {
        // Load data
        const [
            { data: matches = [], error: errorMatches },
            { data: players = [], error: errorPlayers },
            { data: bans = [], error: errorBans }
        ] = await Promise.all([
            supabase.from('matches').select('*'),
            supabase.from('players').select('*'),
            supabase.from('bans').select('*')
        ]);
        
        if (errorMatches || errorPlayers || errorBans) {
            document.getElementById(containerId).innerHTML = 
                `<div class="text-red-700 p-4">Fehler beim Laden der Achievement-Daten</div>`;
            return;
        }
        
        // Check for new achievements
        await achievementSystem.checkAchievements(matches, players, bans);
        const progress = await achievementSystem.getProgress(matches, players, bans);
        const categories = achievementSystem.getCategories();
        
        const unlockedCount = progress.filter(p => p.unlocked).length;
        const totalCount = progress.length;
        const completionPercentage = Math.round((unlockedCount / totalCount) * 100);
        
        const app = document.getElementById(containerId);
        app.innerHTML = `
            <div class="mb-4 flex items-center gap-2">
                <span class="text-3xl">🏆</span>
                <h2 class="text-2xl font-bold">Achievements</h2>
            </div>
            
            <!-- Progress Overview -->
            <div class="bg-gray-800 rounded-xl p-4 mb-6">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-lg font-bold">Fortschritt</h3>
                    <span class="text-lg font-bold text-yellow-400">${unlockedCount}/${totalCount}</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-3 mb-2">
                    <div class="bg-yellow-400 h-3 rounded-full transition-all duration-300" style="width: ${completionPercentage}%"></div>
                </div>
                <div class="text-sm text-gray-300 text-center">${completionPercentage}% abgeschlossen</div>
            </div>
            
            <!-- Category Filter -->
            <div class="mb-4">
                <div class="flex flex-wrap gap-2">
                    <button onclick="filterAchievements('all')" class="filter-btn active bg-blue-600 text-white px-3 py-1 rounded text-sm">
                        Alle
                    </button>
                    ${categories.map(cat => `
                        <button onclick="filterAchievements('${cat}')" class="filter-btn bg-gray-700 text-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-600">
                            ${this.getCategoryLabel(cat)}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <!-- Achievements Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="achievements-grid">
                ${progress.map(achievement => this.renderAchievementCard(achievement)).join('')}
            </div>
        `;
        
        // Add filter functionality
        window.filterAchievements = (category) => {
            const cards = document.querySelectorAll('.achievement-card');
            const buttons = document.querySelectorAll('.filter-btn');
            
            // Update button states
            buttons.forEach(btn => {
                btn.classList.remove('active', 'bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-700', 'text-gray-300');
            });
            event.target.classList.add('active', 'bg-blue-600', 'text-white');
            event.target.classList.remove('bg-gray-700', 'text-gray-300');
            
            // Filter cards
            cards.forEach(card => {
                const cardCategory = card.dataset.category;
                if (category === 'all' || cardCategory === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        };
        
    } catch (error) {
        console.error('Error rendering achievements:', error);
        ErrorHandler.showUserError('Fehler beim Laden der Achievements');
    }
}

// Helper methods for the achievement system
achievementSystem.getCategoryLabel = function(category) {
    const labels = {
        'matches': 'Spiele',
        'goals': 'Tore', 
        'streaks': 'Serien',
        'defense': 'Verteidigung',
        'players': 'Spieler',
        'team': 'Team',
        'discipline': 'Disziplin',
        'milestones': 'Meilensteine'
    };
    return labels[category] || category;
};

achievementSystem.renderAchievementCard = function(achievement) {
    const progressBarColor = achievement.unlocked ? 'bg-yellow-400' : 'bg-blue-500';
    const cardBorder = achievement.unlocked ? 'border-yellow-400 bg-yellow-50' : 'border-gray-600 bg-gray-800';
    const textColor = achievement.unlocked ? 'text-yellow-900' : 'text-gray-300';
    
    return `
        <div class="achievement-card border-2 ${cardBorder} rounded-lg p-4 transition-all duration-300 hover:shadow-lg" data-category="${achievement.category}">
            <div class="flex items-start gap-3">
                <div class="text-3xl ${achievement.unlocked ? 'animate-pulse' : 'grayscale'}">${achievement.icon}</div>
                <div class="flex-1">
                    <h4 class="font-bold ${textColor} mb-1">${achievement.title}</h4>
                    <p class="text-sm ${textColor} opacity-80 mb-2">${achievement.description}</p>
                    
                    ${!achievement.unlocked ? `
                        <div class="w-full bg-gray-700 rounded-full h-2 mb-1">
                            <div class="${progressBarColor} h-2 rounded-full transition-all duration-300" style="width: ${achievement.percentage}%"></div>
                        </div>
                        <div class="text-xs ${textColor} opacity-60">${achievement.progress}/${achievement.maxProgress}</div>
                    ` : `
                        <div class="text-xs font-bold text-yellow-600">🎉 FREIGESCHALTET!</div>
                    `}
                </div>
            </div>
        </div>
    `;
};

export function resetAchievementsState() {
    // Reset state if needed
}