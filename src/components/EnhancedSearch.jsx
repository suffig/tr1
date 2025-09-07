import { useState, useMemo, useEffect, useRef } from 'react';

export default function EnhancedSearch({ 
  data = [], 
  searchFields = [], 
  filterOptions = [], 
  onResults,
  placeholder = "Suchen...",
  showCount = true,
  searchExtractor // Custom function to extract searchable text from items
}) {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const lastResultsRef = useRef(null);

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply text search
    if (query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      filtered = filtered.filter(item => {
        // Use custom search extractor if provided
        if (searchExtractor) {
          const extractedText = searchExtractor(item);
          return extractedText && performEnhancedNameSearch(searchTerm, extractedText);
        }
        
        // Default search through specified fields with enhanced name matching
        return searchFields.some(field => {
          const value = getNestedValue(item, field);
          if (!value) return false;
          
          const valueStr = value.toString();
          // For name fields, use enhanced search; for others, use standard includes
          if (field.toLowerCase().includes('name') || field === 'name') {
            return performEnhancedNameSearch(searchTerm, valueStr);
          } else {
            return valueStr.toLowerCase().includes(searchTerm);
          }
        });
      });
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([filterKey, filterValue]) => {
      if (filterValue && filterValue !== 'all') {
        const filterConfig = filterOptions.find(opt => opt.key === filterKey);
        if (filterConfig && filterConfig.filterFn) {
          filtered = filtered.filter(item => filterConfig.filterFn(item, filterValue));
        } else {
          // Default filtering by exact match
          filtered = filtered.filter(item => getNestedValue(item, filterKey) === filterValue);
        }
      }
    });

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = getNestedValue(a, sortBy);
        const bValue = getNestedValue(b, sortBy);
        
        // Handle different data types
        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [data, query, activeFilters, sortBy, sortOrder, searchFields, filterOptions, searchExtractor]);

  // Update parent with results - use useCallback to prevent infinite loops
  useEffect(() => {
    if (onResults && JSON.stringify(filteredData) !== lastResultsRef.current) {
      lastResultsRef.current = JSON.stringify(filteredData);
      onResults(filteredData);
    }
  }, [filteredData, onResults]);

  const handleFilterChange = (filterKey, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const clearAllFilters = () => {
    setQuery('');
    setActiveFilters({});
    setSortBy('');
    setSortOrder('asc');
  };

  const hasActiveFilters = query || Object.values(activeFilters).some(v => v && v !== 'all') || sortBy;

  return (
    <div className="bg-bg-primary border border-border-light rounded-lg shadow-sm mb-4">
      {/* Search Bar */}
      <div className="p-4 border-b border-border-light">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <span className="text-text-secondary" aria-hidden="true">🔍</span>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`${placeholder} (Strg+K für globale Suche)`}
            className="w-full pl-10 pr-20 py-2 bg-bg-secondary border border-border-light rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
            <button
              onClick={() => {
                const event = new CustomEvent('global-search-toggle');
                window.dispatchEvent(event);
              }}
              className="text-text-secondary hover:text-primary-green transition-colors p-1 rounded"
              title="Globale Suche öffnen (Strg+K)"
            >
              <span aria-hidden="true">🌐</span>
            </button>
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded"
                title="Suchfeld leeren"
              >
                <span aria-hidden="true">✕</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      {(filterOptions.length > 0 || sortBy) && (
        <div className="p-4 border-b border-border-light">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Filter Options */}
            {filterOptions.map((filter) => (
              <div key={filter.key} className="flex items-center gap-2">
                <label className="text-sm font-medium text-text-primary">
                  {filter.label}:
                </label>
                <select
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="px-3 py-1 bg-bg-secondary border border-border-light rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-green"
                >
                  <option value="">Alle</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* Sorting */}
            {searchFields.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-text-primary">
                  Sortieren:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 bg-bg-secondary border border-border-light rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-green"
                >
                  <option value="">Standard</option>
                  {searchFields.map((field) => (
                    <option key={field} value={field}>
                      {formatFieldName(field)}
                    </option>
                  ))}
                </select>
                {sortBy && (
                  <button
                    onClick={() => handleSortChange(sortBy)}
                    className="px-2 py-1 bg-bg-secondary border border-border-light rounded text-sm text-text-primary hover:bg-bg-tertiary transition-colors duration-200"
                    title={`Sortierung: ${sortOrder === 'asc' ? 'Aufsteigend' : 'Absteigend'}`}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                )}
              </div>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 bg-red-100 text-red-800 border border-red-200 rounded text-sm hover:bg-red-200 transition-colors duration-200"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      {showCount && (
        <div className="px-4 py-2 bg-bg-secondary border-b border-border-light">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              {filteredData.length === data.length 
                ? `${data.length} Einträge`
                : `${filteredData.length} von ${data.length} Einträgen`
              }
            </span>
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                {query && (
                  <span className="bg-primary-green bg-opacity-10 text-primary-green px-2 py-1 rounded text-xs">
                    🔍 &quot;{query}&quot;
                  </span>
                )}
                {Object.entries(activeFilters)
                  .filter(([, value]) => value && value !== 'all')
                  .map(([key, value]) => {
                    const filter = filterOptions.find(f => f.key === key);
                    const option = filter?.options.find(o => o.value === value);
                    return (
                      <span
                        key={key}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                      >
                        {filter?.label}: {option?.label || value}
                      </span>
                    );
                  })
                }
                {sortBy && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                    📊 {formatFieldName(sortBy)} {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get nested object values
function getNestedValue(obj, path) {
  if (!obj || !path) return '';
  return path.split('.').reduce((current, key) => {
    return (current && current[key] !== undefined) ? current[key] : '';
  }, obj);
}

// Enhanced search function for better name matching
function performEnhancedNameSearch(searchTerm, targetText) {
  if (!searchTerm || !targetText) return false;
  
  const normalizedSearch = normalizeString(searchTerm.toLowerCase());
  const normalizedTarget = normalizeString(targetText.toLowerCase());
  
  // Simple contains check first
  if (normalizedTarget.includes(normalizedSearch)) {
    return true;
  }
  
  // Split search terms and target into words
  const searchWords = normalizedSearch.split(' ').filter(word => word.length > 0);
  const targetWords = normalizedTarget.split(' ').filter(word => word.length > 0);
  
  // Check if all search words are found in target words (allows partial matching)
  const allWordsFound = searchWords.every(searchWord => {
    return targetWords.some(targetWord => {
      // Allow partial word matching (great for last name searches)
      return targetWord.includes(searchWord) || 
             searchWord.includes(targetWord) ||
             calculateSimilarity(searchWord, targetWord) > 0.6;
    });
  });
  
  return allWordsFound;
}

// Normalize string by removing accents and special characters
function normalizeString(str) {
  return str.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^\w\s]/g, "") // Remove special characters
    .toLowerCase();
}

// Calculate string similarity (Levenshtein-based)
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Levenshtein distance calculation
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Helper function to format field names for display
function formatFieldName(field) {
  const fieldNames = {
    'name': 'Name',
    'team': 'Team',
    'position': 'Position',
    'value': 'Wert',
    'date': 'Datum',
    'goalsa': 'AEK Tore',
    'goalsb': 'Real Tore',
    'type': 'Typ',
    'amount': 'Betrag',
    'description': 'Beschreibung',
    'totalgames': 'Gesamt Spiele',
    'matchesserved': 'Gespielte Spiele'
  };

  return fieldNames[field] || field.charAt(0).toUpperCase() + field.slice(1);
}