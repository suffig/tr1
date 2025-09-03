/**
 * FIFA Database Service
 * Provides integration with FIFA player statistics and ratings
 * Based on FIFA/SoFIFA data structure
 */

export class FIFADataService {
    
    /**
     * Mock FIFA database - in production this would connect to SoFIFA API or similar
     * Data structure based on https://sofifa.com player profiles
     */
    static fifaDatabase = {
        // Real Madrid players
        "Erling Haaland": {
            overall: 91,
            potential: 94,
            positions: ["ST", "CF"],
            age: 23,
            height: 195,
            weight: 88,
            foot: "Left",
            pace: 89,
            shooting: 91,
            passing: 65,
            dribbling: 80,
            defending: 45,
            physical: 88,
            skills: {
                crossing: 55,
                finishing: 94,
                headingAccuracy: 85,
                shortPassing: 65,
                volleys: 86,
                curve: 77,
                fkAccuracy: 84,
                longPassing: 65,
                ballControl: 81,
                acceleration: 87,
                sprintSpeed: 90,
                agility: 77,
                reactions: 93,
                balance: 70,
                shotPower: 94,
                jumping: 95,
                stamina: 88,
                strength: 92,
                longShots: 85,
                aggression: 84,
                interceptions: 30,
                positioning: 95,
                vision: 68,
                penalties: 85,
                composure: 88
            },
            workrates: "High/Medium",
            weakFoot: 3,
            skillMoves: 3,
            nationality: "Norway",
            club: "Manchester City",
            value: "€180M",
            wage: "€375K",
            contract: "2027",
            sofifaId: 239085,
            sofifaUrl: "https://sofifa.com/player/239085/erling-haaland/250001/"
        },
        
        "Kylian Mbappé": {
            overall: 91,
            potential: 95,
            positions: ["LW", "ST", "RW"],
            age: 25,
            height: 178,
            weight: 73,
            foot: "Right",
            pace: 97,
            shooting: 89,
            passing: 80,
            dribbling: 92,
            defending: 39,
            physical: 77,
            skills: {
                crossing: 80,
                finishing: 89,
                headingAccuracy: 78,
                shortPassing: 83,
                volleys: 87,
                curve: 80,
                fkAccuracy: 79,
                longPassing: 75,
                ballControl: 92,
                acceleration: 97,
                sprintSpeed: 97,
                agility: 92,
                reactions: 92,
                balance: 84,
                shotPower: 88,
                jumping: 78,
                stamina: 88,
                strength: 76,
                longShots: 86,
                aggression: 78,
                interceptions: 41,
                positioning: 90,
                vision: 80,
                penalties: 80,
                composure: 85
            },
            workrates: "High/Low",
            weakFoot: 4,
            skillMoves: 5,
            nationality: "France",
            club: "Real Madrid",
            value: "€180M",
            wage: "€1.2M",
            contract: "2029",
            sofifaId: 231747,
            sofifaUrl: "https://sofifa.com/player/231747/kylian-mbappe/250001/"
        },

        "Jude Bellingham": {
            overall: 90,
            potential: 94,
            positions: ["CM", "CAM", "CDM"],
            age: 20,
            height: 186,
            weight: 75,
            foot: "Right",
            pace: 75,
            shooting: 83,
            passing: 88,
            dribbling: 86,
            defending: 78,
            physical: 82,
            skills: {
                crossing: 84,
                finishing: 82,
                headingAccuracy: 85,
                shortPassing: 90,
                volleys: 80,
                curve: 85,
                fkAccuracy: 81,
                longPassing: 86,
                ballControl: 87,
                acceleration: 78,
                sprintSpeed: 72,
                agility: 84,
                reactions: 89,
                balance: 86,
                shotPower: 85,
                jumping: 84,
                stamina: 88,
                strength: 79,
                longShots: 84,
                aggression: 80,
                interceptions: 76,
                positioning: 88,
                vision: 89,
                penalties: 78,
                composure: 84
            },
            workrates: "High/High",
            weakFoot: 4,
            skillMoves: 4,
            nationality: "England",
            club: "Real Madrid",
            value: "€150M",
            wage: "€350K",
            contract: "2029",
            sofifaId: 252371,
            sofifaUrl: "https://sofifa.com/player/252371/jude-bellingham/250001/"
        },

        // AEK Athens players (using more modest ratings)
        "Sergio Araújo": {
            overall: 72,
            potential: 75,
            positions: ["ST", "CF"],
            age: 32,
            height: 180,
            weight: 75,
            foot: "Left",
            pace: 68,
            shooting: 75,
            passing: 62,
            dribbling: 71,
            defending: 30,
            physical: 73,
            skills: {
                crossing: 55,
                finishing: 78,
                headingAccuracy: 72,
                shortPassing: 65,
                volleys: 74,
                curve: 68,
                fkAccuracy: 70,
                longPassing: 58,
                ballControl: 73,
                acceleration: 70,
                sprintSpeed: 66,
                agility: 72,
                reactions: 76,
                balance: 70,
                shotPower: 76,
                jumping: 71,
                stamina: 72,
                strength: 74,
                longShots: 72,
                aggression: 65,
                interceptions: 25,
                positioning: 77,
                vision: 60,
                penalties: 75,
                composure: 74
            },
            workrates: "Medium/Low",
            weakFoot: 3,
            skillMoves: 3,
            nationality: "Argentina",
            club: "AEK Athens",
            value: "€2.8M",
            wage: "€15K",
            contract: "2025",
            sofifaId: 199455,
            sofifaUrl: "https://sofifa.com/player/199455/sergio-araujo/250001/"
        },

        "Nordin Amrabat": {
            overall: 70,
            potential: 70,
            positions: ["RW", "RM", "RWB"],
            age: 37,
            height: 173,
            weight: 65,
            foot: "Right",
            pace: 76,
            shooting: 65,
            passing: 73,
            dribbling: 76,
            defending: 61,
            physical: 65,
            skills: {
                crossing: 78,
                finishing: 62,
                headingAccuracy: 55,
                shortPassing: 74,
                volleys: 68,
                curve: 71,
                fkAccuracy: 75,
                longPassing: 72,
                ballControl: 78,
                acceleration: 78,
                sprintSpeed: 74,
                agility: 80,
                reactions: 72,
                balance: 74,
                shotPower: 68,
                jumping: 58,
                stamina: 76,
                strength: 52,
                longShots: 70,
                aggression: 68,
                interceptions: 65,
                positioning: 68,
                vision: 75,
                penalties: 65,
                composure: 74
            },
            workrates: "High/Medium",
            weakFoot: 4,
            skillMoves: 4,
            nationality: "Morocco",
            club: "AEK Athens",
            value: "€800K",
            wage: "€8K",
            contract: "2024",
            sofifaId: 199014,
            sofifaUrl: "https://sofifa.com/player/199014/nordin-amrabat/250001/"
        }
    };

    /**
     * Search for a player in the FIFA database
     * @param {string} playerName - Name of the player to search for
     * @returns {Object|null} FIFA player data or null if not found
     */
    static async getPlayerData(playerName) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try exact match first
        if (this.fifaDatabase[playerName]) {
            return {
                ...this.fifaDatabase[playerName],
                searchName: playerName,
                found: true
            };
        }

        // Try fuzzy matching (case insensitive, partial matches)
        const searchTerms = playerName.toLowerCase().split(' ');
        for (const [dbName, data] of Object.entries(this.fifaDatabase)) {
            const dbNameLower = dbName.toLowerCase();
            const dbTerms = dbNameLower.split(' ');
            
            // Check if all search terms are found in database name
            const allTermsFound = searchTerms.every(term => 
                dbTerms.some(dbTerm => dbTerm.includes(term) || term.includes(dbTerm))
            );
            
            if (allTermsFound) {
                return {
                    ...data,
                    searchName: playerName,
                    suggestedName: dbName,
                    found: true
                };
            }
        }

        // Return a default structure for unknown players
        return this.generateDefaultPlayerData(playerName);
    }

    /**
     * Generate default FIFA-style data for unknown players
     * @param {string} playerName - Name of the player
     * @returns {Object} Default FIFA player data structure
     */
    static generateDefaultPlayerData(playerName) {
        // Generate realistic but modest ratings for unknown players
        const baseRating = 65 + Math.floor(Math.random() * 15); // 65-79 overall
        
        return {
            overall: baseRating,
            potential: Math.min(baseRating + Math.floor(Math.random() * 8), 85),
            positions: ["Unknown"],
            age: 25,
            height: 175 + Math.floor(Math.random() * 15),
            weight: 70 + Math.floor(Math.random() * 15),
            foot: Math.random() > 0.5 ? "Right" : "Left",
            pace: this.generateAttribute(baseRating),
            shooting: this.generateAttribute(baseRating),
            passing: this.generateAttribute(baseRating),
            dribbling: this.generateAttribute(baseRating),
            defending: this.generateAttribute(baseRating),
            physical: this.generateAttribute(baseRating),
            skills: this.generateDetailedSkills(baseRating),
            workrates: "Medium/Medium",
            weakFoot: 2 + Math.floor(Math.random() * 3),
            skillMoves: 2 + Math.floor(Math.random() * 3),
            nationality: "Unknown",
            club: "Unknown",
            value: "€" + (Math.random() * 5 + 0.5).toFixed(1) + "M",
            wage: "€" + Math.floor(Math.random() * 20 + 5) + "K",
            contract: "2025",
            sofifaId: null,
            sofifaUrl: null,
            searchName: playerName,
            found: false,
            generated: true
        };
    }

    /**
     * Generate a realistic attribute value based on overall rating
     * @param {number} overall - Overall player rating
     * @returns {number} Attribute value
     */
    static generateAttribute(overall) {
        const variance = 15; // Attributes can vary +/- 15 from overall
        const min = Math.max(35, overall - variance);
        const max = Math.min(90, overall + variance);
        return min + Math.floor(Math.random() * (max - min));
    }

    /**
     * Generate detailed skills object
     * @param {number} baseRating - Base rating to derive skills from
     * @returns {Object} Detailed skills object
     */
    static generateDetailedSkills(baseRating) {
        const skills = {};
        const skillNames = [
            'crossing', 'finishing', 'headingAccuracy', 'shortPassing', 'volleys',
            'curve', 'fkAccuracy', 'longPassing', 'ballControl', 'acceleration',
            'sprintSpeed', 'agility', 'reactions', 'balance', 'shotPower',
            'jumping', 'stamina', 'strength', 'longShots', 'aggression',
            'interceptions', 'positioning', 'vision', 'penalties', 'composure'
        ];

        skillNames.forEach(skill => {
            skills[skill] = this.generateAttribute(baseRating);
        });

        return skills;
    }

    /**
     * Get all available players in the FIFA database
     * @returns {Array} List of player names available in the database
     */
    static getAvailablePlayers() {
        return Object.keys(this.fifaDatabase);
    }

    /**
     * Add a new player to the FIFA database (for testing/admin purposes)
     * @param {string} name - Player name
     * @param {Object} data - FIFA player data
     */
    static addPlayer(name, data) {
        this.fifaDatabase[name] = data;
    }

    /**
     * Check if a player exists in the FIFA database
     * @param {string} playerName - Player name to check
     * @returns {boolean} True if player exists
     */
    static hasPlayer(playerName) {
        return this.fifaDatabase.hasOwnProperty(playerName);
    }

    /**
     * Get player card color based on overall rating
     * @param {number} overall - Overall rating
     * @returns {string} CSS color class
     */
    static getPlayerCardColor(overall) {
        if (overall >= 90) return 'fifa-card-icon'; // Icon/Legend
        if (overall >= 85) return 'fifa-card-gold'; // Gold
        if (overall >= 80) return 'fifa-card-silver'; // Silver
        if (overall >= 75) return 'fifa-card-bronze'; // Bronze
        return 'fifa-card-common'; // Common
    }

    /**
     * Format overall rating with visual indicators
     * @param {number} overall - Overall rating
     * @returns {string} Formatted rating string
     */
    static formatOverallRating(overall) {
        let indicator = '';
        if (overall >= 90) indicator = '🌟'; // Icon
        else if (overall >= 85) indicator = '🥇'; // Gold
        else if (overall >= 80) indicator = '🥈'; // Silver
        else if (overall >= 75) indicator = '🥉'; // Bronze
        
        return `${overall} ${indicator}`;
    }
}

export default FIFADataService;