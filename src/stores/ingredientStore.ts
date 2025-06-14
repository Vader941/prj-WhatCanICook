/**
 * Svelte store for managing ingredients state
 * Provides reactive data storage and helper functions for ingredient management
 */
import { writable } from 'svelte/store';
import type { IngredientsByCategory, UserIngredients } from '../types/ingredient';

// Store for all available ingredients grouped by category
export const availableIngredients = writable<IngredientsByCategory>({});

// Store for ingredients the user has selected
export const userIngredients = writable<UserIngredients>({});

/**
 * Adds an ingredient to the user's selected ingredients
 * @param ingredientId - The ID of the ingredient to add
 */
export function addUserIngredient(ingredientId: string) {
  userIngredients.update(ingredients => ({
    ...ingredients,  // Keep existing ingredients
    [ingredientId]: true  // Add or update the specified ingredient
  }));
}

/**
 * Removes an ingredient from the user's selected ingredients
 * @param ingredientId - The ID of the ingredient to remove
 */
export function removeUserIngredient(ingredientId: string) {
  userIngredients.update(ingredients => {
    const updated = { ...ingredients };  // Clone the ingredients object
    delete updated[ingredientId];        // Remove the specified ingredient
    return updated;
  });
}

/**
 * Toggles an ingredient in the user's selected ingredients
 * If present, removes it; if not present, adds it
 * @param ingredientId - The ID of the ingredient to toggle
 */
export function toggleUserIngredient(ingredientId: string) {
  userIngredients.update(ingredients => {
    const updated = { ...ingredients };  // Clone the ingredients object
    
    // Toggle the ingredient (remove if exists, add if doesn't)
    if (updated[ingredientId]) {
      delete updated[ingredientId];
    } else {
      updated[ingredientId] = true;
    }
    
    return updated;
  });
}
