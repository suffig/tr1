/**
 * Alcohol Calculator Persistence Utility
 * Handles saving and loading of alcohol calculator values over time
 */

const STORAGE_KEY = 'alcoholCalculatorValues';
const STORAGE_VERSION = '1.0';

/**
 * Default calculator values
 */
const getDefaultValues = () => ({
  aekPlayer: '',
  realPlayer: '',
  aekGoals: 0,
  realGoals: 0,
  mode: 'manual', // 'manual' or 'automatic'
  gameDay: new Date().toISOString().split('T')[0],
  beerCount: {
    aek: 0,
    real: 0
  },
  // Timestamp tracking for time-based calculations
  lastUpdated: new Date().toISOString(),
  drinkingStartTime: null, // When drinking started for time decay calculations
  version: STORAGE_VERSION
});

/**
 * Load calculator values from localStorage
 * @returns {Object} Calculator values with fallback to defaults
 */
export const loadCalculatorValues = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return getDefaultValues();
    }

    const parsed = JSON.parse(saved);
    
    // Version compatibility check
    if (!parsed.version || parsed.version !== STORAGE_VERSION) {
      console.log('Alcohol calculator: Version mismatch, using defaults');
      return getDefaultValues();
    }

    // Ensure all required fields exist with defaults
    const defaults = getDefaultValues();
    const merged = {
      ...defaults,
      ...parsed,
      beerCount: {
        ...defaults.beerCount,
        ...(parsed.beerCount || {})
      }
    };

    return merged;
  } catch (error) {
    console.error('Error loading alcohol calculator values:', error);
    return getDefaultValues();
  }
};

/**
 * Save calculator values to localStorage
 * @param {Object} values - Calculator values to save
 */
export const saveCalculatorValues = (values) => {
  try {
    const toSave = {
      ...values,
      lastUpdated: new Date().toISOString(),
      version: STORAGE_VERSION
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    
    // Dispatch custom event to notify other components if needed (browser only)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('alcoholCalculatorValuesChanged', {
        detail: toSave
      }));
    }
    
    return true;
  } catch (error) {
    console.error('Error saving alcohol calculator values:', error);
    return false;
  }
};

/**
 * Update specific calculator values and save
 * @param {Object} updates - Partial updates to merge with existing values
 * @param {Object} currentValues - Current calculator values
 * @returns {Object} Updated values
 */
export const updateCalculatorValues = (updates, currentValues) => {
  const updated = {
    ...currentValues,
    ...updates,
    lastUpdated: new Date().toISOString()
  };
  
  // Handle nested beerCount updates
  if (updates.beerCount) {
    updated.beerCount = {
      ...currentValues.beerCount,
      ...updates.beerCount
    };
  }
  
  saveCalculatorValues(updated);
  return updated;
};

/**
 * Set drinking start time for time decay calculations
 * @param {Object} currentValues - Current calculator values
 * @returns {Object} Updated values with drinking start time
 */
export const setDrinkingStartTime = (currentValues) => {
  const updated = {
    ...currentValues,
    drinkingStartTime: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  
  saveCalculatorValues(updated);
  return updated;
};

/**
 * Clear all calculator values (reset to defaults)
 * @returns {Object} Default values
 */
export const clearCalculatorValues = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return getDefaultValues();
  } catch (error) {
    console.error('Error clearing alcohol calculator values:', error);
    return getDefaultValues();
  }
};

/**
 * Get time passed since drinking started (for BAC decay calculations)
 * @param {Object} values - Calculator values containing drinkingStartTime
 * @returns {number} Hours passed since drinking started, or 0 if no start time
 */
export const getHoursSinceDrinkingStarted = (values) => {
  if (!values.drinkingStartTime) {
    return 0;
  }
  
  try {
    const startTime = new Date(values.drinkingStartTime);
    const now = new Date();
    return (now - startTime) / (1000 * 60 * 60); // Convert to hours
  } catch (error) {
    console.error('Error calculating time since drinking started:', error);
    return 0;
  }
};

/**
 * Check if values were updated today (useful for automatic mode)
 * @param {Object} values - Calculator values
 * @returns {boolean} True if values were updated today
 */
export const wasUpdatedToday = (values) => {
  if (!values.lastUpdated) {
    return false;
  }
  
  try {
    const lastUpdated = new Date(values.lastUpdated);
    const today = new Date();
    
    return lastUpdated.toDateString() === today.toDateString();
  } catch (error) {
    console.error('Error checking if values were updated today:', error);
    return false;
  }
};