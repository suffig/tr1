import { useState, useEffect } from 'react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import toast from 'react-hot-toast';

// Achievement System for React
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
            { 
                id: 'top_scorer_10', 
                title: 'Torjäger', 
                description: 'Erziele 10 Tore mit einem Spieler',
                icon: '👑',
                category: 'players',
                requirement: { type: 'player_goals', count: 10 }
            },
            { 
                id: 'veteran', 
                title: 'Veteran', 
                description: 'Spiele 25 Matches',
                icon: '🎖️',
                category: 'milestones',
                requirement: { type: 'total_matches', count: 25 }
            }
        ];
        
        this.unlockedAchievements = new Set(
            JSON.parse(localStorage.getItem('fifa-achievements') || '[]')
        );
    }

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
            // Save to localStorage
            localStorage.setItem('fifa-achievements', JSON.stringify([...this.unlockedAchievements]));
            
            // Show notifications
            newUnlocked.forEach((achievement, index) => {
                setTimeout(() => {
                    toast.success(`🏆 Achievement Unlocked: ${achievement.title}`, {
                        duration: 5000,
                        style: {
                            background: '#FCD34D',
                            color: '#92400E',
                            fontWeight: 'bold'
                        }
                    });
                }, index * 1000);
            });
        }
        
        return newUnlocked;
    }

    async checkRequirement(req, matches, players, bans) {
        switch (req.type) {
            case 'team_wins':
                return this.countTeamWins(matches, req.team) >= req.count;
            case 'goals_in_match':
                return matches.some(match => Math.max(match.goalsa || 0, match.goalsb || 0) >= req.count);
            case 'total_goals_match':
                return matches.some(match => (match.goalsa || 0) + (match.goalsb || 0) >= req.count);
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
            case 'total_matches':
                return matches.length >= req.count;
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
            case 'player_goals':
                return Math.max(0, ...players.map(p => p.goals || 0));
            case 'win_streak':
                return this.checkWinStreak(matches);
            default:
                return 0;
        }
    }

    getCategories() {
        return [...new Set(this.achievements.map(a => a.category))];
    }
}

// Global instance
const achievementSystem = new AchievementSystem();

const AchievementsTab = () => {
    const { data: matches } = useSupabaseQuery('matches', '*');
    const { data: players } = useSupabaseQuery('players', '*');
    const { data: bans } = useSupabaseQuery('bans', '*');
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [stats, setStats] = useState({ unlocked: 0, total: 0, percentage: 0 });

    useEffect(() => {
        if (matches && players && bans) {
            loadAchievements();
        }
    }, [matches, players, bans]);

    const loadAchievements = async () => {
        try {
            setLoading(true);

            // Check for new achievements
            await achievementSystem.checkAchievements(matches || [], players || [], bans || []);
            
            // Get progress
            const progress = await achievementSystem.getProgress(matches || [], players || [], bans || []);
            setAchievements(progress);

            // Calculate stats
            const unlockedCount = progress.filter(a => a.unlocked).length;
            const totalCount = progress.length;
            const percentage = Math.round((unlockedCount / totalCount) * 100);
            
            setStats({ unlocked: unlockedCount, total: totalCount, percentage });
            
        } catch (error) {
            console.error('Error loading achievements:', error);
            toast.error('Fehler beim Laden der Achievements');
        } finally {
            setLoading(false);
        }
    };

    const categories = achievementSystem.getCategories();
    const categoryLabels = {
        'matches': 'Spiele',
        'goals': 'Tore',
        'streaks': 'Serien',
        'defense': 'Verteidigung',
        'players': 'Spieler',
        'milestones': 'Meilensteine'
    };

    const filteredAchievements = selectedCategory === 'all' 
        ? achievements 
        : achievements.filter(a => a.category === selectedCategory);

    if (loading) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                    <span className="ml-2 text-text-secondary">Lade Achievements...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <span className="text-3xl">🏆</span>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Achievements</h1>
                    <p className="text-text-secondary">Verfolge deine Erfolge und Meilensteine</p>
                </div>
            </div>

            {/* Progress Overview */}
            <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-text-primary">Fortschritt</h2>
                    <span className="text-lg font-bold text-accent-primary">
                        {stats.unlocked}/{stats.total}
                    </span>
                </div>
                <div className="w-full bg-bg-secondary rounded-full h-3 mb-2">
                    <div 
                        className="bg-accent-primary h-3 rounded-full transition-all duration-300"
                        style={{ width: `${stats.percentage}%` }}
                    ></div>
                </div>
                <div className="text-sm text-text-secondary text-center">
                    {stats.percentage}% abgeschlossen
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedCategory === 'all'
                            ? 'bg-accent-primary text-white'
                            : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                    }`}
                >
                    Alle
                </button>
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                            selectedCategory === category
                                ? 'bg-accent-primary text-white'
                                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                        }`}
                    >
                        {categoryLabels[category] || category}
                    </button>
                ))}
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAchievements.map(achievement => (
                    <div
                        key={achievement.id}
                        className={`card p-4 transition-all duration-300 hover:shadow-lg ${
                            achievement.unlocked 
                                ? 'border-accent-primary bg-accent-primary/5' 
                                : 'border-border-primary'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`text-3xl ${achievement.unlocked ? 'animate-pulse' : 'grayscale opacity-50'}`}>
                                {achievement.icon}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-text-primary mb-1">
                                    {achievement.title}
                                </h4>
                                <p className="text-sm text-text-secondary mb-2">
                                    {achievement.description}
                                </p>
                                
                                {!achievement.unlocked ? (
                                    <>
                                        <div className="w-full bg-bg-secondary rounded-full h-2 mb-1">
                                            <div 
                                                className="bg-accent-primary h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${achievement.percentage}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-text-secondary">
                                            {achievement.progress}/{achievement.maxProgress}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-xs font-bold text-accent-primary">
                                        🎉 FREIGESCHALTET!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredAchievements.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                    Keine Achievements in dieser Kategorie gefunden.
                </div>
            )}
        </div>
    );
};

export default AchievementsTab;