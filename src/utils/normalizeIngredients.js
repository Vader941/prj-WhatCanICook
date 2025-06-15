/**
 * Utility functions for normalizing ingredient names
 * Uses a canonical ingredient map to standardize different variations of the same ingredient
 */

// Import the canonical ingredient map
let canonicalIngredients = {};

// Load the canonical ingredients map
async function loadCanonicalIngredients() {
  try {
    const response = await fetch('/src/data/canonical_ingredients.json');
    canonicalIngredients = await response.json();
    console.log('Loaded structured canonical ingredients:', Object.keys(canonicalIngredients).length);
  } catch (error) {
    console.error('Error loading canonical ingredients:', error);
  }
}

// Initialize the map on module load
loadCanonicalIngredients();

/**
 * Clean an ingredient name by removing common measurement words and formatting
 * @param {string} name - The raw ingredient name
 * @returns {string} - The cleaned name
 */
function cleanIngredientName(name) {
  // Convert to lowercase
  name = name.toLowerCase().trim();
  
  // Remove measurement patterns
  const measurementPatterns = [
    /\d+[\/-]?\d*\s*(cup|tbsp|tsp|oz|pound|lb|g|ml|l|pinch|dash|to taste)/g,
    /\d+[\/-]?\d*/g, // Remove fractions and numbers
    /(cup|tbsp|tsp|oz|pound|lb|g|ml|l|pinch|dash|to taste)/g, // Remove measurement words
    /(sliced|diced|chopped|minced|grated|peeled|crushed|ground|frozen|fresh|canned|cooked)/g, // Remove preparation words
    /(optional|\(optional\))/g, // Remove "optional" markers
  ];
  
  measurementPatterns.forEach(pattern => {
    name = name.replace(pattern, '');
  });
  
  // Replace hyphens with spaces
  name = name.replace(/-/g, ' ');
  
  // Replace multiple spaces with a single space
  name = name.replace(/\s+/g, ' ').trim();
  
  return name;
}

/**
 * Find the canonical form of an ingredient name
 * @param {string} name - The cleaned ingredient name
 * @returns {string|null} - The canonical name or null if not found
 */
function findCanonicalForm(name) {
  // Direct lookup in the canonical ingredient keys
  if (canonicalIngredients[name]) {
    return name;
  }
  
  // Check if the name is in any of the alias lists
  for (const [canonical, data] of Object.entries(canonicalIngredients)) {
    if (data.aliases && data.aliases.includes(name)) {
      return canonical;
    }
  }
  
  return null;
}

/**
 * Try to find the most similar ingredient using fuzzy matching
 * @param {string} name - The cleaned ingredient name
 * @returns {string|null} - The most likely canonical match or null
 */
function findSimilarIngredient(name) {
  // Special case handling for known problematic matches
  const specialCases = {
    'bell pepper': 'bell pepper',   // Ensure bell pepper is never confused with pepper
    'red pepper': 'bell pepper',    // Red pepper is likely a bell pepper, not the spice
    'green pepper': 'bell pepper',  // Green pepper is likely a bell pepper, not the spice
    'yellow pepper': 'bell pepper', // Yellow pepper is likely a bell pepper, not the spice
    'chili pepper': 'chili pepper', // Chili pepper is its own thing
    'red chili': 'chili pepper',
    'jalapeno': 'jalapeno',
    'serrano': 'serrano'
  };
  
  // Check for exact matches in special cases first
  if (specialCases[name]) {
    console.log(`Special case match: "${name}" → "${specialCases[name]}"`);
    return specialCases[name];
  }
  
  // Check for compound words where the last word matches a spice name
  const spices = ['pepper', 'salt', 'cumin', 'cinnamon', 'oregano', 'thyme', 'basil'];
  const words = name.split(/\s+/);
  
  // If this is a multi-word ingredient ending with a spice name, don't match it to just the spice
  if (words.length > 1) {
    const lastWord = words[words.length - 1];
    if (spices.includes(lastWord)) {
      // This is likely a compound ingredient (like "bell pepper"), not just the spice
      console.log(`Prevented "${name}" from matching with "${lastWord}" (compound name)`);
      return name; // Return the original name to prevent matching
    }
  }
  
  // EXACT WORD MATCHING - More precise than substring matching
  // Only consider it a match if the words are exactly the same
  for (const canonical of Object.keys(canonicalIngredients)) {
    // Exact match
    if (name === canonical) {
      return canonical;
    }
    
    // Match plural/singular forms
    if (name === canonical + 's' || name + 's' === canonical) {
      return canonical;
    }
  }
  
  // Check if name directly matches any aliases
  for (const [canonical, data] of Object.entries(canonicalIngredients)) {
    if (data.aliases) {
      for (const alias of data.aliases) {
        if (name === alias || 
            name === alias + 's' || 
            name + 's' === alias) {
          console.log(`Direct alias match found: "${name}" → "${canonical}" (via "${alias}")`);
          return canonical;
        }
      }
    }
  }
  
  // Only do word matching if the name is at least 4 characters
  // This prevents short words like "egg" from matching with unrelated terms
  if (name.length >= 4) {
    // Check if any complete word matches between the ingredient and canonical keys
    for (const canonical of Object.keys(canonicalIngredients)) {
      // Skip very short canonical keys to prevent false matches
      if (canonical.length < 3) continue;
      
      // Only consider it a match if the word boundary is respected
      const nameWords = name.split(/\s+/);
      const canonicalWords = canonical.split(/\s+/);
      
      // Check if any complete word matches between the two
      const hasWordMatch = nameWords.some(nameWord => 
        canonicalWords.some(canonicalWord => 
          nameWord === canonicalWord || 
          // Allow plural/singular matches
          nameWord === canonicalWord + 's' || 
          nameWord + 's' === canonicalWord
        )
      );
      
      if (hasWordMatch && nameWords.length === canonicalWords.length) {
        console.log(`Word match found: "${name}" → "${canonical}"`);
        return canonical;
      }
    }

    // Check through aliases with the same approach
    for (const [canonical, data] of Object.entries(canonicalIngredients)) {
      if (data.aliases) {
        for (const alias of data.aliases) {
          // Skip very short aliases
          if (alias.length < 3) continue;
          
          const nameWords = name.split(/\s+/);
          const aliasWords = alias.split(/\s+/);
          
          // Check for complete word match with same word count
          const hasWordMatch = nameWords.some(nameWord => 
            aliasWords.some(aliasWord => 
              nameWord === aliasWord || 
              nameWord === aliasWord + 's' || 
              nameWord + 's' === aliasWord
            )
          );
          
          if (hasWordMatch && nameWords.length === aliasWords.length) {
            console.log(`Alias word match found: "${name}" → "${canonical}" (via "${alias}")`);
            return canonical;
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Normalize an ingredient name to its canonical form
 * @param {string} rawName - The raw ingredient name to normalize
 * @returns {string} - The normalized canonical name or the cleaned original
 */
export function normalizeIngredientName(rawName) {
  // Check for empty input
  if (!rawName) return '';
  
  // Special case for bell pepper to avoid matching with pepper
  if (rawName.toLowerCase().includes('bell pepper')) {
    return 'bell pepper';
  }
  
  // Clean the name to remove measurements and formatting
  const cleanedName = cleanIngredientName(rawName);
  
  // Try to find the canonical form
  const canonical = findCanonicalForm(cleanedName);
  if (canonical) {
    return canonical;
  }
  
  // Try fuzzy matching if no direct match
  const similarMatch = findSimilarIngredient(cleanedName);
  if (similarMatch) {
    console.log(`Normalized "${rawName}" → "${similarMatch}" (fuzzy match)`);
    return similarMatch;
  }
  
  // If no match is found, log a warning and return the cleaned name
  console.warn(`No canonical mapping found for ingredient: "${rawName}" (cleaned: "${cleanedName}")`);
  return cleanedName;
}

/**
 * Check if an ingredient is a duplicate of an existing one after normalization
 * @param {string} newIngredient - The new ingredient name
 * @param {Set|Array} existingIngredients - Set or Array of existing ingredients
 * @returns {boolean} - True if the normalized form already exists
 */
export function isDuplicateIngredient(newIngredient, existingIngredients) {
  const normalized = normalizeIngredientName(newIngredient);
  if (existingIngredients instanceof Set) {
    return Array.from(existingIngredients).some(existingIng => 
      normalizeIngredientName(existingIng) === normalized
    );
  }
  return existingIngredients.some(existingIng => 
    normalizeIngredientName(existingIng) === normalized
  );
}

/**
 * Get the normalized form of an ingredient ID (for use with localStorage)
 * @param {string} id - The ingredient ID (usually lowercase-hyphenated)
 * @returns {string} - The normalized ID
 */
export function normalizeIngredientId(id) {
  if (!id || typeof id !== 'string') {
    console.warn(`Invalid ingredient ID: ${id} (type: ${typeof id})`);
    return id || ''; // Return original or empty string to avoid errors
  }
  
  try {
    // Convert hyphens to spaces for normalization
    const name = id.replace(/-/g, ' ');
    // Normalize the name
    const normalized = normalizeIngredientName(name);
    // Convert back to ID format (spaces to hyphens)
    return normalized.replace(/\s+/g, '-');
  } catch (error) {
    console.error(`Error normalizing ingredient ID "${id}":`, error);
    return id; // Return original in case of error
  }
}

