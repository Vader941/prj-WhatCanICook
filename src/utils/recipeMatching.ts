/**
 * TypeScript version of recipe matching functionality
 * Provides type safety and more structured interfaces
 */
import type { UserIngredients } from '../types/ingredient';

/**
 * Represents a recipe ingredient
 */
export interface RecipeIngredient {
  id: string;
  name: string;
  // quantity and unit removed - user determines if they have enough
}

/**
 * Represents a complete recipe with all its details
 */
export interface Recipe {
  id: string;                     // Unique identifier for the recipe
  name: string;                   // Recipe name/title
  ingredients: RecipeIngredient[]; // List of required ingredients
  requiredAppliances: string[];    // Appliances needed to make this recipe
  instructions: string[];          // Step-by-step cooking instructions
  cookTime: number;                // Cooking time in minutes
  prepTime: number;                // Preparation time in minutes
  difficulty: 'easy' | 'medium' | 'hard'; // Recipe difficulty level
  tags: string[];                  // Categories/tags for the recipe
}

/**
 * Result of matching a recipe against user's available ingredients and appliances
 */
export interface RecipeMatchResult {
  recipe: Recipe;                 // The full recipe details
  matchPercentage: number;        // How well the user's ingredients match (0-100)
  missingIngredients: string[];   // Ingredients the user doesn't have
  missingAppliances: string[];    // Appliances the user doesn't have
  canCook: boolean;               // Whether the user has all required appliances
}

/**
 * Match recipes based on user's ingredients and appliances
 * 
 * @param recipes - Array of all available recipes
 * @param userIngredients - Object tracking which ingredients the user has
 * @param userAppliances - Array of appliance IDs the user has
 * @returns Array of recipe match results, sorted by cookability and match percentage
 */
export function matchRecipes(
  recipes: Recipe[],
  userIngredients: UserIngredients,
  userAppliances: string[]
): RecipeMatchResult[] {
  return recipes
    .map(recipe => {
      // Check which ingredients the user has
      const availableIngredients = recipe.ingredients.filter(
        ingredient => userIngredients[ingredient]
      );
      
      // Calculate match percentage
      const matchPercentage = (availableIngredients.length / recipe.ingredients.length) * 100;
      
      // Find missing ingredients
      const missingIngredients = recipe.ingredients.filter(
        ingredient => !userIngredients[ingredient]
      );
      
      // Check which required appliances the user is missing
      const missingAppliances = recipe.requiredAppliances.filter(
        appliance => !userAppliances.includes(appliance)
      );
      
      // User can cook if they have all required appliances
      const canCook = missingAppliances.length === 0;
      
      return {
        recipe,
        matchPercentage,
        missingIngredients,
        missingAppliances,
        canCook
      };
    })
    .sort((a, b) => {
      // First prioritize recipes they can actually cook (have all required appliances)
      if (a.canCook && !b.canCook) return -1;
      if (!a.canCook && b.canCook) return 1;
      
      // Then sort by ingredient match percentage (higher percentage first)
      return b.matchPercentage - a.matchPercentage;
    });
}
