/**
 * TypeScript type definitions for ingredients and related data structures
 * Used for type safety and better code documentation
 */

/**
 * Represents a single ingredient with its properties
 */
export interface Ingredient {
  id: string;      // Unique identifier for the ingredient (e.g. "chicken")
  name: string;    // Display name for the ingredient (e.g. "Chicken")
  category: string; // The category this ingredient belongs to (e.g. "Proteins")
}

/**
 * Groups ingredients by their categories
 * Keys are category names, values are arrays of ingredients
 */
export interface IngredientsByCategory {
  [category: string]: Ingredient[];
}

/**
 * Tracks which ingredients the user has selected
 * Keys are ingredient IDs, values are boolean (true if user has the ingredient)
 * This simplifies ingredient presence checking without storing quantities
 */
export interface UserIngredients {
  [ingredientId: string]: boolean;
}
