/**
 * FutWiz Integration Module
 * Handles fetching real data from FutWiz with proper error handling and fallbacks
 */

export class FutwizIntegration {
    static CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache
    static cache = new Map();
    static rateLimit = {
        requests: 0,
        resetTime: 0,
        maxRequests: 10 // Max 10 requests per minute
    };

    /**
     * Attempt to fetch player data from FutWiz
     * @param {string} futwizUrl - The FutWiz URL for the player
     * @param {number} futwizId - The FutWiz ID for the player (optional)
     * @returns {Promise<Object|null>} Player data or null if failed
     */
    static async fetchPlayerData(futwizUrl, futwizId) {
        try {
            // Check cache first
            const cacheKey = `${futwizId || futwizUrl}`;
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                console.log(`📦 Cache hit for FutWiz ID: ${futwizId || 'URL'}`);
                return cached.data;
            }

            // Check rate limit
            if (!this.checkRateLimit()) {
                console.warn('⚠️ Rate limit exceeded for FutWiz requests');
                return null;
            }

            console.log(`🌐 Attempting to fetch data from FutWiz: ${futwizUrl}`);

            // Attempt to fetch using multiple strategies
            const strategies = [
                () => this.fetchWithCorsProxy(futwizUrl),
                () => this.fetchWithAllowOrigins(futwizUrl),
                () => this.fetchWithServerProxy(futwizUrl),
                () => this.parsePlayerIdFromUrl(futwizUrl)
            ];

            for (const strategy of strategies) {
                try {
                    const result = await strategy();
                    if (result) {
                        // Cache successful result
                        this.cache.set(cacheKey, {
                            data: result,
                            timestamp: Date.now()
                        });
                        return result;
                    }
                } catch (error) {
                    console.warn(`❌ Strategy failed: ${error.message}`);
                    continue;
                }
            }

            console.warn(`⚠️ All FutWiz fetch strategies failed for: ${futwizUrl}`);
            return null;

        } catch (error) {
            console.error('❌ Error fetching FutWiz data:', error.message);
            return null;
        }
    }

    /**
     * Check if we're within rate limits
     * @returns {boolean} True if within limits
     */
    static checkRateLimit() {
        const now = Date.now();
        
        // Reset counter every minute
        if (now > this.rateLimit.resetTime) {
            this.rateLimit.requests = 0;
            this.rateLimit.resetTime = now + 60000; // Next minute
        }

        if (this.rateLimit.requests >= this.rateLimit.maxRequests) {
            return false;
        }

        this.rateLimit.requests++;
        return true;
    }

    /**
     * Try fetching with CORS proxy service
     * @param {string} url - FutWiz URL
     * @returns {Promise<Object|null>} Parsed data or null
     */
    static async fetchWithCorsProxy(url) {
        const proxyUrls = [
            `https://cors-anywhere.herokuapp.com/${url}`,
            `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
            `https://thingproxy.freeboard.io/fetch/${url}`
        ];

        for (const proxyUrl of proxyUrls) {
            try {
                console.log(`🔄 Trying CORS proxy: ${proxyUrl.split('/')[2]}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    let html = await response.text();
                    
                    // Handle allorigins response format
                    if (proxyUrl.includes('allorigins.win')) {
                        const jsonResponse = JSON.parse(html);
                        html = jsonResponse.contents;
                    }

                    const parsedData = this.parsePlayerDataFromHTML(html);
                    if (parsedData) {
                        console.log(`✅ Successfully fetched via proxy: ${proxyUrl.split('/')[2]}`);
                        return parsedData;
                    }
                }
            } catch (error) {
                console.warn(`❌ Proxy failed (${proxyUrl.split('/')[2]}): ${error.message}`);
                continue;
            }
        }

        return null;
    }

    /**
     * Try direct fetch with relaxed CORS
     * @param {string} url - FutWiz URL
     * @returns {Promise<Object|null>} Parsed data or null
     */
    static async fetchWithAllowOrigins(url) {
        try {
            console.log('🔄 Trying direct fetch with CORS headers');
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Origin': window.location.origin,
                    'Referer': window.location.origin,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (response.ok) {
                const html = await response.text();
                const parsedData = this.parsePlayerDataFromHTML(html);
                if (parsedData) {
                    console.log('✅ Direct fetch successful');
                    return parsedData;
                }
            }
        } catch (error) {
            // Expected to fail due to CORS, but we try anyway
            console.warn('❌ Direct fetch failed (expected due to CORS):', error.message);
        }

        return null;
    }

    /**
     * Try using a custom server proxy (if available)
     * @param {string} url - FutWiz URL
     * @returns {Promise<Object|null>} Parsed data or null
     */
    static async fetchWithServerProxy(url) {
        try {
            // Check if there's a custom proxy endpoint
            const proxyEndpoint = '/api/proxy-futwiz'; // Adjust based on your server setup
            
            console.log('🔄 Trying server proxy');
            
            const response = await fetch(proxyEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.html) {
                    const parsedData = this.parsePlayerDataFromHTML(data.html);
                    if (parsedData) {
                        console.log('✅ Server proxy successful');
                        return parsedData;
                    }
                }
            }
        } catch (error) {
            console.warn('❌ Server proxy not available:', error.message);
        }

        return null;
    }

    /**
     * Extract basic data from FutWiz URL structure
     * @param {string} url - FutWiz URL
     * @returns {Object|null} Basic player data or null
     */
    static parsePlayerIdFromUrl(url) {
        try {
            console.log('🔄 Parsing player ID from URL structure');
            
            // Extract player ID and name from URL
            // URL format: https://www.futwiz.com/fc25/career-mode/player/player-name/12345
            const match = url.match(/\/player\/([^\/]+)\/(\d+)/);
            if (match) {
                const [, playerSlug, playerId] = match;
                const playerName = playerSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                console.log(`📝 Extracted from URL: ID ${playerId}, Name: ${playerName}`);
                
                return {
                    futwizId: parseInt(playerId),
                    extractedName: playerName,
                    slug: playerSlug,
                    source: 'url_parsing',
                    timestamp: Date.now()
                };
            }
        } catch (error) {
            console.warn('❌ URL parsing failed:', error.message);
        }

        return null;
    }

    /**
     * Parse player data from FutWiz HTML
     * @param {string} html - HTML content from FutWiz
     * @returns {Object|null} Parsed player data or null
     */
    static parsePlayerDataFromHTML(html) {
        try {
            console.log('🔍 Parsing HTML for player data...');
            
            // Create a DOM parser
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extract basic player info
            const playerData = {
                source: 'futwiz_live',
                timestamp: Date.now()
            };

            // Try to extract overall rating - FutWiz may use different selectors
            const overallElement = doc.querySelector('.rating-overall') || 
                                 doc.querySelector('.overall-rating') ||
                                 doc.querySelector('[data-rating]') ||
                                 doc.querySelector('.player-rating');
            if (overallElement) {
                const ratingText = overallElement.textContent.trim();
                const ratingMatch = ratingText.match(/(\d+)/);
                if (ratingMatch) {
                    playerData.overall = parseInt(ratingMatch[1]);
                }
            }

            // Try to extract potential rating
            const potentialElement = doc.querySelector('.rating-potential') || 
                                   doc.querySelector('.potential-rating') ||
                                   doc.querySelector('[data-potential]');
            if (potentialElement) {
                const potentialText = potentialElement.textContent.trim();
                const potentialMatch = potentialText.match(/(\d+)/);
                if (potentialMatch) {
                    playerData.potential = parseInt(potentialMatch[1]);
                }
            }

            // Try to extract player name
            const nameElement = doc.querySelector('h1') || 
                              doc.querySelector('.player-name') ||
                              doc.querySelector('[data-player-name]') ||
                              doc.querySelector('.name');
            if (nameElement) {
                playerData.name = nameElement.textContent.trim();
            }

            // Try to extract positions
            const positionElements = doc.querySelectorAll('.position') || 
                                   doc.querySelectorAll('.player-position') ||
                                   doc.querySelectorAll('[data-position]');
            if (positionElements.length > 0) {
                playerData.positions = Array.from(positionElements).map(el => el.textContent.trim()).filter(pos => pos);
            }

            // Try to extract age
            const ageElement = doc.querySelector('.age') || 
                             doc.querySelector('.player-age') ||
                             doc.querySelector('[data-age]');
            if (ageElement) {
                const ageText = ageElement.textContent.trim();
                const ageMatch = ageText.match(/(\d+)/);
                if (ageMatch) {
                    playerData.age = parseInt(ageMatch[1]);
                }
            }

            // Try to extract club
            const clubElement = doc.querySelector('.club-name') || 
                              doc.querySelector('.team-name') ||
                              doc.querySelector('.club') ||
                              doc.querySelector('[data-club]');
            if (clubElement) {
                playerData.club = clubElement.textContent.trim();
            }

            // Try to extract nationality
            const nationalityElement = doc.querySelector('.nationality') || 
                                     doc.querySelector('.country') ||
                                     doc.querySelector('[data-nationality]');
            if (nationalityElement) {
                playerData.nationality = nationalityElement.textContent.trim();
            }

            // Validate that we got meaningful data
            if (playerData.overall || playerData.name) {
                console.log(`✅ Successfully parsed player data: ${playerData.name || 'Unknown'} (Overall: ${playerData.overall || 'N/A'})`);
                return playerData;
            } else {
                console.warn('⚠️ No meaningful data found in HTML');
                return null;
            }

        } catch (error) {
            console.error('❌ Error parsing HTML:', error.message);
            return null;
        }
    }

    /**
     * Clear the cache
     */
    static clearCache() {
        this.cache.clear();
        console.log('🗑️ FutWiz cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    static getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys()),
            rateLimit: this.rateLimit
        };
    }

    /**
     * Search for a player by name on FutWiz
     * @param {string} playerName - Name of the player to search for
     * @returns {Promise<Object|null>} Player data or null if not found
     */
    static async searchPlayerByName(playerName) {
        if (!playerName || typeof playerName !== 'string') {
            return null;
        }

        try {
            // Check rate limit
            if (!this.checkRateLimit()) {
                console.warn('⚠️ Rate limit exceeded for FutWiz search');
                return null;
            }

            console.log(`🔍 Searching FutWiz for: ${playerName}`);

            // Construct search URL for FutWiz
            const searchUrl = `https://www.futwiz.com/fc25/career-mode/players?search=${encodeURIComponent(playerName)}`;
            
            // Try different strategies to get search results
            const strategies = [
                () => this.searchWithCorsProxy(searchUrl, playerName),
                () => this.searchWithAllowOrigins(searchUrl, playerName),
                () => this.generateSearchResult(playerName) // Fallback to generate basic data
            ];

            for (const strategy of strategies) {
                try {
                    const result = await strategy();
                    if (result) {
                        console.log(`✅ Search successful for: ${playerName}`);
                        return result;
                    }
                } catch (error) {
                    console.warn(`❌ Search strategy failed: ${error.message}`);
                    continue;
                }
            }

            console.warn(`⚠️ All search strategies failed for: ${playerName}`);
            return null;

        } catch (error) {
            console.error('❌ Error searching FutWiz:', error.message);
            return null;
        }
    }

    /**
     * Search with CORS proxy
     * @param {string} searchUrl - FutWiz search URL
     * @param {string} playerName - Player name for parsing
     * @returns {Promise<Object|null>} Search result or null
     */
    static async searchWithCorsProxy(searchUrl, playerName) {
        const proxyUrls = [
            `https://api.allorigins.win/get?url=${encodeURIComponent(searchUrl)}`,
            `https://cors-anywhere.herokuapp.com/${searchUrl}`
        ];

        for (const proxyUrl of proxyUrls) {
            try {
                console.log(`🔄 Searching via proxy: ${proxyUrl.split('/')[2]}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    let html = await response.text();
                    
                    // Handle allorigins response format
                    if (proxyUrl.includes('allorigins.win')) {
                        const jsonResponse = JSON.parse(html);
                        html = jsonResponse.contents;
                    }

                    const searchResult = this.parseSearchResults(html, playerName);
                    if (searchResult) {
                        return searchResult;
                    }
                }
            } catch (error) {
                console.warn(`❌ Proxy search failed (${proxyUrl.split('/')[2]}): ${error.message}`);
                continue;
            }
        }

        return null;
    }

    /**
     * Search with direct request
     * @param {string} searchUrl - FutWiz search URL
     * @param {string} playerName - Player name for parsing
     * @returns {Promise<Object|null>} Search result or null
     */
    static async searchWithAllowOrigins(searchUrl, playerName) {
        try {
            console.log('🔄 Trying direct search');
            
            const response = await fetch(searchUrl, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Origin': window.location.origin,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (response.ok) {
                const html = await response.text();
                const searchResult = this.parseSearchResults(html, playerName);
                if (searchResult) {
                    return searchResult;
                }
            }
        } catch (error) {
            console.warn('❌ Direct search failed (expected due to CORS):', error.message);
        }

        return null;
    }

    /**
     * Parse FutWiz search results
     * @param {string} html - HTML from FutWiz search
     * @param {string} searchName - Original search name
     * @returns {Object|null} Parsed result or null
     */
    static parseSearchResults(html, searchName) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Look for player cards in search results - adjust selectors for FutWiz
            const playerCards = doc.querySelectorAll('.player-card') || 
                              doc.querySelectorAll('.search-result') ||
                              doc.querySelectorAll('[data-player]') ||
                              doc.querySelectorAll('.player-item');
            
            if (playerCards.length === 0) {
                console.log('No player cards found in search results');
                return null;
            }

            // Take the first result (most relevant)
            const firstCard = playerCards[0];
            
            // Extract player info from the card
            const playerData = {
                source: 'futwiz_search',
                searchName: searchName,
                timestamp: Date.now()
            };

            // Try to extract player name and URL
            const nameElement = firstCard.querySelector('a') || 
                              firstCard.querySelector('.player-name') ||
                              firstCard.querySelector('[data-name]');
            if (nameElement) {
                playerData.name = nameElement.textContent.trim();
                if (nameElement.tagName === 'A') {
                    const href = nameElement.getAttribute('href');
                    if (href) {
                        playerData.futwizUrl = href.startsWith('http') ? href : 'https://www.futwiz.com' + href;
                        
                        // Extract player ID from URL
                        const urlMatch = playerData.futwizUrl.match(/\/player\/[^\/]+\/(\d+)/);
                        if (urlMatch) {
                            playerData.futwizId = parseInt(urlMatch[1]);
                        }
                    }
                }
            }

            // Try to extract overall rating
            const overallElement = firstCard.querySelector('.rating') || 
                                 firstCard.querySelector('.overall') ||
                                 firstCard.querySelector('[data-rating]');
            if (overallElement) {
                const ratingText = overallElement.textContent.trim();
                const ratingMatch = ratingText.match(/(\d+)/);
                if (ratingMatch) {
                    playerData.overall = parseInt(ratingMatch[1]);
                }
            }

            // Try to extract positions
            const positionElements = firstCard.querySelectorAll('.position') ||
                                   firstCard.querySelectorAll('[data-position]');
            if (positionElements.length > 0) {
                playerData.positions = Array.from(positionElements).map(el => el.textContent.trim()).filter(pos => pos);
            }

            // Try to extract age
            const ageElement = firstCard.querySelector('.age') ||
                             firstCard.querySelector('[data-age]');
            if (ageElement) {
                const ageText = ageElement.textContent.trim();
                const ageMatch = ageText.match(/(\d+)/);
                if (ageMatch) {
                    playerData.age = parseInt(ageMatch[1]);
                }
            }

            // Try to extract club
            const clubElement = firstCard.querySelector('.club') ||
                              firstCard.querySelector('.team') ||
                              firstCard.querySelector('[data-club]');
            if (clubElement) {
                playerData.club = clubElement.textContent.trim();
            }

            // Validate that we got meaningful data
            if (playerData.name && playerData.overall) {
                console.log(`✅ Parsed search result: ${playerData.name} (${playerData.overall})`);
                return playerData;
            }

            return null;

        } catch (error) {
            console.error('❌ Error parsing search results:', error.message);
            return null;
        }
    }

    /**
     * Generate a basic search result when parsing fails
     * @param {string} playerName - Player name
     * @returns {Object} Basic player data
     */
    static generateSearchResult(playerName) {
        console.log(`🎲 Generating basic search result for: ${playerName}`);
        
        return {
            name: playerName,
            searchName: playerName,
            overall: 70 + Math.floor(Math.random() * 15), // 70-84
            source: 'search_generated',
            timestamp: Date.now(),
            generated: true
        };
    }
}

export default FutwizIntegration;