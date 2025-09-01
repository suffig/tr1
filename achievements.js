/**
 * Enhanced Achievement System for FIFA Tracker
 * Tracks player and team achievements, milestones, and performance metrics
 */

import { dataManager } from './dataManager.js';
import { loadingManager, ErrorHandler } from './utils.js';

export class AchievementSystem {
    static achievements = {
        // Player Individual Achievements
        'first_goal': {
            id: 'first_goal',
            name: 'Erstes Tor',
            description: 'Dein erstes Tor im FIFA Tracker',
            icon: 'fas fa-futbol',
            category: 'individual',
            points: 10
        },
        'hat_trick': {
            id: 'hat_trick', 
            name: 'Hattrick Hero',
            description: '3 Tore in einem Spiel',
            icon: 'fas fa-fire',
            category: 'individual',
            points: 50
        },
        'goal_machine': {
            id: 'goal_machine',
            name: 'Tormaschine',
            description: '10 Tore erzielt',
            icon: 'fas fa-rocket',
            category: 'individual',
            points: 100,
            levels: [10, 25, 50, 100]
        },
        'clean_sheet': {
            id: 'clean_sheet',
            name: 'Zu Null',
            description: 'Kein Gegentor im Spiel als Torhüter',
            icon: 'fas fa-shield-alt',
            category: 'individual',
            points: 25
        },
        'win_streak': {
            id: 'win_streak',
            name: 'Siegesserie',
            description: '5 Siege in Folge',
            icon: 'fas fa-trophy',
            category: 'individual',
            points: 75,
            levels: [3, 5, 10, 15]
        },
        'veteran': {
            id: 'veteran',
            name: 'Veteran',
            description: '50 Spiele gespielt',
            icon: 'fas fa-medal',
            category: 'individual',
            points: 150,
            levels: [25, 50, 100, 200]
        },
        
        // Team Achievements
        'team_domination': {
            id: 'team_domination',
            name: 'Team-Dominanz',
            description: 'Team gewinnt 10 Spiele in Folge',
            icon: 'fas fa-crown',
            category: 'team',
            points: 200
        },
        'high_scoring': {
            id: 'high_scoring',
            name: 'Tor-Festival',
            description: '5+ Tore in einem Spiel',
            icon: 'fas fa-star',
            category: 'team',
            points: 30
        },
        'perfect_season': {
            id: 'perfect_season',
            name: 'Perfekte Saison',
            description: '10 Siege ohne Niederlage',
            icon: 'fas fa-gem',
            category: 'team',
            points: 500
        },
        
        // Special Achievements
        'comeback_king': {
            id: 'comeback_king',
            name: 'Comeback-König',
            description: 'Von 2+ Toren Rückstand noch gewonnen',
            icon: 'fas fa-magic',
            category: 'special',
            points: 100
        },
        'last_minute_hero': {
            id: 'last_minute_hero',
            name: 'Last-Minute-Held',
            description: 'Siegtor in letzter Minute',
            icon: 'fas fa-clock',
            category: 'special',
            points: 75
        },
        'financial_guru': {
            id: 'financial_guru',
            name: 'Finanz-Guru',
            description: '1000€ Vereinskapital erreicht',
            icon: 'fas fa-coins',
            category: 'special',
            points: 200
        }
    };
    
    static async checkAchievements(playerId = null, teamName = null) {
        try {
            const newAchievements = [];
            const data = await dataManager.loadAllAppData();
            
            if (playerId) {
                const playerAchievements = await this.checkPlayerAchievements(playerId, data);
                newAchievements.push(...playerAchievements);
            }
            
            if (teamName) {
                const teamAchievements = await this.checkTeamAchievements(teamName, data);
                newAchievements.push(...teamAchievements);
            }
            
            // Award special achievements
            const specialAchievements = await this.checkSpecialAchievements(data);
            newAchievements.push(...specialAchievements);
            
            // Save new achievements
            for (const achievement of newAchievements) {
                await this.awardAchievement(achievement);
            }
            
            return newAchievements;
            
        } catch (error) {
            ErrorHandler.handle(error, 'Fehler beim Überprüfen der Erfolge');
            return [];
        }
    }
    
    static async checkPlayerAchievements(playerId, data) {
        const achievements = [];
        const player = data.players?.find(p => p.id === playerId);
        if (!player) return achievements;
        
        const playerMatches = data.matches?.filter(m => 
            m.aek_players?.includes(playerId) || 
            m.real_players?.includes(playerId)
        ) || [];
        
        // Calculate player stats
        const totalGoals = this.calculatePlayerGoals(playerId, data.matches || [], player.team);
        const totalWins = this.calculatePlayerWins(playerId, data.matches || [], player.team);
        const consecutiveWins = this.calculateConsecutiveWins(playerId, data.matches || [], player.team);
        
        // Check achievements
        if (totalGoals >= 1 && !await this.hasAchievement(playerId, 'first_goal')) {
            achievements.push({
                playerId,
                achievementId: 'first_goal',
                unlockedAt: new Date().toISOString(),
                progress: totalGoals
            });
        }
        
        // Goal machine levels
        const goalMachine = this.achievements.goal_machine;
        for (const level of goalMachine.levels) {
            if (totalGoals >= level && !await this.hasAchievement(playerId, `goal_machine_${level}`)) {
                achievements.push({
                    playerId,
                    achievementId: `goal_machine_${level}`,
                    baseAchievement: 'goal_machine',
                    level,
                    unlockedAt: new Date().toISOString(),
                    progress: totalGoals
                });
            }
        }
        
        // Win streak
        const winStreak = this.achievements.win_streak;
        for (const level of winStreak.levels) {
            if (consecutiveWins >= level && !await this.hasAchievement(playerId, `win_streak_${level}`)) {
                achievements.push({
                    playerId,
                    achievementId: `win_streak_${level}`,
                    baseAchievement: 'win_streak',
                    level,
                    unlockedAt: new Date().toISOString(),
                    progress: consecutiveWins
                });
            }
        }
        
        // Veteran levels
        const veteran = this.achievements.veteran;
        for (const level of veteran.levels) {
            if (playerMatches.length >= level && !await this.hasAchievement(playerId, `veteran_${level}`)) {
                achievements.push({
                    playerId,
                    achievementId: `veteran_${level}`,
                    baseAchievement: 'veteran',
                    level,
                    unlockedAt: new Date().toISOString(),
                    progress: playerMatches.length
                });
            }
        }
        
        // Check for hat tricks in recent matches
        const recentMatches = playerMatches.slice(-5); // Check last 5 matches
        for (const match of recentMatches) {
            const teamGoals = player.team === 'AEK' ? (match.aek_goals || []) : (match.real_goals || []);
            const playerGoalsInMatch = teamGoals.filter(g => g.player_id === playerId).length;
            
            if (playerGoalsInMatch >= 3 && !await this.hasAchievement(playerId, `hat_trick_${match.id}`)) {
                achievements.push({
                    playerId,
                    achievementId: `hat_trick_${match.id}`,
                    baseAchievement: 'hat_trick',
                    matchId: match.id,
                    unlockedAt: new Date().toISOString(),
                    progress: playerGoalsInMatch
                });
            }
        }
        
        return achievements;
    }
    
    static async checkTeamAchievements(teamName, data) {
        const achievements = [];
        const teamMatches = data.matches?.filter(m => 
            m.aek_team === teamName || m.real_team === teamName
        ) || [];
        
        // Check for high-scoring games
        for (const match of teamMatches.slice(-10)) { // Check last 10 matches
            const teamScore = teamName === 'AEK' ? (match.aek_score || 0) : (match.real_score || 0);
            
            if (teamScore >= 5 && !await this.hasAchievement(teamName, `high_scoring_${match.id}`)) {
                achievements.push({
                    teamName,
                    achievementId: `high_scoring_${match.id}`,
                    baseAchievement: 'high_scoring',
                    matchId: match.id,
                    unlockedAt: new Date().toISOString(),
                    progress: teamScore
                });
            }
        }
        
        return achievements;
    }
    
    static async checkSpecialAchievements(data) {
        const achievements = [];
        
        // Check financial achievements
        const finances = data.finances || [];
        const totalBalance = finances.reduce((sum, f) => sum + (f.amount || 0), 0);
        
        if (totalBalance >= 1000 && !await this.hasAchievement('system', 'financial_guru')) {
            achievements.push({
                systemWide: true,
                achievementId: 'financial_guru',
                unlockedAt: new Date().toISOString(),
                progress: totalBalance
            });
        }
        
        return achievements;
    }
    
    // Helper methods for calculations
    static calculatePlayerGoals(playerId, matches, playerTeam) {
        return matches.reduce((total, match) => {
            const teamGoals = playerTeam === 'AEK' ? (match.aek_goals || []) : (match.real_goals || []);
            return total + teamGoals.filter(g => g.player_id === playerId).length;
        }, 0);
    }
    
    static calculatePlayerWins(playerId, matches, playerTeam) {
        return matches.filter(match => {
            const hasPlayer = playerTeam === 'AEK' ? 
                match.aek_players?.includes(playerId) : 
                match.real_players?.includes(playerId);
                
            if (!hasPlayer) return false;
            
            if (playerTeam === 'AEK') {
                return (match.aek_score || 0) > (match.real_score || 0);
            } else {
                return (match.real_score || 0) > (match.aek_score || 0);
            }
        }).length;
    }
    
    static calculateConsecutiveWins(playerId, matches, playerTeam) {
        const playerMatches = matches.filter(match => 
            playerTeam === 'AEK' ? 
                match.aek_players?.includes(playerId) : 
                match.real_players?.includes(playerId)
        ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        let streak = 0;
        for (const match of playerMatches) {
            const won = playerTeam === 'AEK' ?
                (match.aek_score || 0) > (match.real_score || 0) :
                (match.real_score || 0) > (match.aek_score || 0);
                
            if (won) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    static async hasAchievement(entityId, achievementId) {
        try {
            const storageKey = 'fifa_tracker_achievements';
            const allAchievements = JSON.parse(localStorage.getItem(storageKey) || '[]');
            return allAchievements.some(a => a.entity_id === entityId && a.achievement_id === achievementId);
        } catch (error) {
            return false; // Assume not achieved if error
        }
    }
    
    static async awardAchievement(achievement) {
        try {
            // Save to localStorage for now
            const achievementRecord = {
                entity_id: achievement.playerId || achievement.teamName || 'system',
                entity_type: achievement.playerId ? 'player' : achievement.teamName ? 'team' : 'system',
                achievement_id: achievement.achievementId,
                base_achievement: achievement.baseAchievement || achievement.achievementId,
                level: achievement.level || 1,
                match_id: achievement.matchId || null,
                unlocked_at: achievement.unlockedAt,
                progress: achievement.progress || 0,
                points: this.achievements[achievement.baseAchievement || achievement.achievementId]?.points || 10
            };
            
            const storageKey = 'fifa_tracker_achievements';
            const existingAchievements = JSON.parse(localStorage.getItem(storageKey) || '[]');
            existingAchievements.push(achievementRecord);
            localStorage.setItem(storageKey, JSON.stringify(existingAchievements));
            
            // Show notification
            this.showAchievementNotification(achievement);
            
        } catch (error) {
            ErrorHandler.handle(error, 'Fehler beim Speichern des Erfolgs');
        }
    }
    
    static showAchievementNotification(achievement) {
        const achievementData = this.achievements[achievement.baseAchievement || achievement.achievementId];
        if (!achievementData) return;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification fixed top-4 right-4 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg shadow-lg transform translate-x-full transition-all duration-500';
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="text-2xl">
                    <i class="${achievementData.icon}"></i>
                </div>
                <div>
                    <div class="font-bold text-sm">Erfolg freigeschaltet!</div>
                    <div class="font-semibold">${achievementData.name}</div>
                    <div class="text-xs opacity-90">${achievementData.description}</div>
                    <div class="text-xs font-bold">+${achievementData.points} Punkte</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 5000);
    }
    
    static async getPlayerAchievements(playerId) {
        try {
            const storageKey = 'fifa_tracker_achievements';
            const allAchievements = JSON.parse(localStorage.getItem(storageKey) || '[]');
            return allAchievements.filter(a => a.entity_id === playerId);
        } catch (error) {
            ErrorHandler.handle(error, 'Fehler beim Laden der Erfolge');
            return [];
        }
    }
    
    static async getAllAchievements() {
        try {
            const storageKey = 'fifa_tracker_achievements';
            return JSON.parse(localStorage.getItem(storageKey) || '[]');
        } catch (error) {
            ErrorHandler.handle(error, 'Fehler beim Laden aller Erfolge');
            return [];
        }
    }
    
    static generateAchievementSummaryHTML(achievements) {
        if (!achievements.length) {
            return '<div class="text-gray-400 text-center py-4">Noch keine Erfolge freigeschaltet</div>';
        }
        
        const totalPoints = achievements.reduce((sum, a) => sum + (a.points || 0), 0);
        
        return `
            <div class="achievement-summary bg-slate-800 rounded-lg p-4 border border-slate-600">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-white font-semibold">Erfolge</h3>
                    <span class="bg-yellow-500 text-black px-2 py-1 rounded text-sm font-bold">${totalPoints} Punkte</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    ${achievements.map(achievement => {
                        const achievementData = this.achievements[achievement.base_achievement] || { name: 'Unbekannt', icon: 'fas fa-trophy' };
                        return `
                            <div class="flex items-center space-x-2 bg-slate-700 p-2 rounded">
                                <i class="${achievementData.icon} text-yellow-400"></i>
                                <div class="flex-1 text-sm">
                                    <div class="text-white font-medium">${achievementData.name}</div>
                                    <div class="text-gray-400 text-xs">${new Date(achievement.unlocked_at).toLocaleDateString('de-DE')}</div>
                                </div>
                                <span class="text-yellow-400 text-xs font-bold">+${achievement.points}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
}

// Integration helper for other modules
export async function checkAchievementsAfterMatch(matchData) {
    const newAchievements = [];
    
    // Check for all players in the match
    if (matchData.aek_players) {
        for (const playerId of matchData.aek_players) {
            const achievements = await AchievementSystem.checkAchievements(playerId);
            newAchievements.push(...achievements);
        }
    }
    
    if (matchData.real_players) {
        for (const playerId of matchData.real_players) {
            const achievements = await AchievementSystem.checkAchievements(playerId);
            newAchievements.push(...achievements);
        }
    }
    
    // Check team achievements
    if (matchData.aek_team) {
        const teamAchievements = await AchievementSystem.checkAchievements(null, matchData.aek_team);
        newAchievements.push(...teamAchievements);
    }
    
    if (matchData.real_team) {
        const teamAchievements = await AchievementSystem.checkAchievements(null, matchData.real_team);
        newAchievements.push(...teamAchievements);
    }
    
    return newAchievements;
}

// Backward compatibility
export const achievementSystem = {
    async checkAchievements(matches, players, bans) {
        console.log('Legacy achievement check completed', { matches: matches?.length, players: players?.length, bans: bans?.length });
        return [];
    }
};

console.log("Enhanced achievements.js loaded");