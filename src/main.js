/**
 * Main application script for the WhatCanICook web app
 * Handles ingredient management including:
 * - Loading ingredients from categories
 * - Adding custom ingredients
 * - Tracking user-selected ingredients
 * - Managing the ingredient selection UI
 */
console.log("Welcome to WhatCanICook!");

// Import ingredient data categories
import { ingredientCategories } from './data/ingredients.js';

// Log available categories to help with debugging
console.log("Imported ingredient categories:", Object.keys(ingredientCategories));

/**
 * Class responsible for managing all ingredient-related functionality
 * Including user's ingredient list, custom ingredients, and UI interactions
 */
class IngredientManager {
  constructor() {
    // Initialize user ingredients from localStorage or empty set if none exists
    this.userIngredients = new Set(JSON.parse(localStorage.getItem('userIngredients') || '[]'));
    
    // Initialize custom ingredients from localStorage or empty object if none exists
    this.customIngredients = JSON.parse(localStorage.getItem('customIngredients') || '{}');

    // Ensure DOM is ready before initializing UI components
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }

  /**
   * Initialize all component parts of the ingredient manager
   * Called when DOM is ready to be manipulated
   */
  initialize() {
    try {
      this.initializeDropdown();      // Setup ingredient dropdown with categories
      this.initializeCategoryRadios(); // Setup category radio buttons for manual ingredient entry
      this.initializeEventListeners(); // Add event handlers for user interactions
      this.populateCustomIngredients(); // Add any previously created custom ingredients
      this.renderUserIngredients();    // Display user's currently selected ingredients
    } catch (error) {
      console.error('Error initializing IngredientManager:', error);
    }
  }

  /**
   * Sets up the ingredient dropdown with categorized options
   * Groups ingredients by their categories and sorts them alphabetically
   */
  initializeDropdown() {
    const select = document.getElementById('ingredient-select');
    if (!select) throw new Error('ingredient-select element not found');

    // Preserve the default empty option and "add manual" option
    const emptyOption = select.querySelector('option[value=""]');
    const manualOption = select.querySelector('option[value="manual"]');

    // Clear the select to rebuild it
    select.innerHTML = '';

    // Re-add the empty option (or create it if it doesn't exist)
    if (emptyOption) {
      select.appendChild(emptyOption);
    } else {
      const newEmpty = document.createElement('option');
      newEmpty.value = '';
      newEmpty.textContent = 'Select ingredient...';
      select.appendChild(newEmpty);
    }

    // Add each category as an optgroup with its ingredients as options
    Object.entries(ingredientCategories).forEach(([category, ingredients]) => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = category;

      // Sort ingredients alphabetically before adding
      [...ingredients].sort().forEach(ingredient => {
        const option = document.createElement('option');
        // Create an ID-friendly value from the ingredient name
        option.value = ingredient.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
        option.textContent = ingredient;
        optgroup.appendChild(option);
      });

      select.appendChild(optgroup);
    });

    // Re-add the "manual add" option at the end
    if (manualOption) {
      select.appendChild(manualOption);
    } else {
      const newManual = document.createElement('option');
      newManual.value = 'manual';
      newManual.textContent = '+ Add new ingredient';
      select.appendChild(newManual);
    }
  }

  /**
   * Sets up radio buttons for selecting an ingredient category
   * when manually adding a new ingredient
   */
  initializeCategoryRadios() {
    const radioGroup = document.getElementById('category-radio-group');
    if (!radioGroup) throw new Error('category-radio-group element not found');

    // Clear existing radio buttons
    radioGroup.innerHTML = '';
    
    // Create a radio button for each category
    Object.keys(ingredientCategories).forEach(category => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'category';
      radio.value = category;

      label.appendChild(radio);
      label.appendChild(document.createTextNode(` ${category}`));
      radioGroup.appendChild(label);
    });
  }

  /**
   * Sets up all event listeners for user interactions
   * Includes form submissions, button clicks, and popups
   */
  initializeEventListeners() {
    // Get references to DOM elements
    const ingredientForm = document.getElementById('ingredient-form');
    const manualForm = document.getElementById('manual-ingredient-form');
    const cancelBtn = document.getElementById('cancel-manual');
    const popup = document.getElementById('manual-ingredient-popup');

    // Form submission for selecting an ingredient from dropdown
    ingredientForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleIngredientSelection();
    });

    // Form submission for manually adding a new ingredient
    manualForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleManualIngredient();
    });

    // Cancel button in the manual ingredient popup
    cancelBtn?.addEventListener('click', () => this.closeManualPopup());

    // Close popup when clicking outside the form
    popup?.addEventListener('click', (e) => {
      if (e.target.id === 'manual-ingredient-popup') {
        this.closeManualPopup();
      }
    });
  }

  /**
   * Handles selecting an ingredient from the dropdown
   * Either adds the ingredient or shows the manual input popup
   */
  handleIngredientSelection() {
    const select = document.getElementById('ingredient-select');
    const value = select.value;

    if (value === 'manual') {
      // Show popup for manual ingredient entry
      this.showManualPopup();
    } else if (value) {
      // Add the selected ingredient to user's ingredients
      this.addIngredient(value);
      // Reset dropdown to empty selection
      select.value = '';
    }
  }

  /**
   * Handles the submission of a manually added ingredient
   * Creates a new custom ingredient and adds it to the user's list
   */
  handleManualIngredient() {
    // Get the ingredient name and category from the form
    const name = document.getElementById('new-ingredient-name').value.trim();
    const category = document.querySelector('input[name="category"]:checked')?.value;

    // Validate input
    if (!name || !category) {
      alert('Please fill in all fields');
      return;
    }

    // Create an ID for the ingredient (lowercase, hyphenated)
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');

    // Initialize category array if it doesn't exist
    if (!this.customIngredients[category]) {
      this.customIngredients[category] = [];
    }

    // Add to custom ingredients
    this.customIngredients[category].push({ id, name });
    
    // Sort ingredients alphabetically within their category
    this.customIngredients[category].sort((a, b) => a.name.localeCompare(b.name));
    
    // Save custom ingredients to localStorage
    localStorage.setItem('customIngredients', JSON.stringify(this.customIngredients));

    // Add the ingredient to the dropdown and user's selected ingredients
    this.addToDropdown(id, name, category);
    this.addIngredient(id);
    
    // Close the popup
    this.closeManualPopup();
  }

  /**
   * Adds a manually created ingredient to the dropdown
   * Ensures it's inserted in alphabetical order within its category
   */
  addToDropdown(id, name, category) {
    const select = document.getElementById('ingredient-select');
    const optgroups = select.querySelectorAll('optgroup');

    // Find the optgroup for this category
    for (const group of optgroups) {
      if (group.label === category) {
        // Create the new option
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;

        // Get existing options in this category
        const existingOptions = Array.from(group.querySelectorAll('option'));
        
        // Find where to insert the new option alphabetically
        let insertAt = existingOptions.length;
        for (let i = 0; i < existingOptions.length; i++) {
          if (name.localeCompare(existingOptions[i].textContent) < 0) {
            insertAt = i;
            break;
          }
        }

        // Insert at the determined position
        if (insertAt === existingOptions.length) {
          group.appendChild(option);
        } else {
          group.insertBefore(option, existingOptions[insertAt]);
        }
        break;
      }
    }
  }

  /**
   * Adds any previously created custom ingredients to the dropdown
   * Called during initialization
   */
  populateCustomIngredients() {
    Object.entries(this.customIngredients).forEach(([category, ingredients]) => {
      ingredients.forEach(ing => {
        this.addToDropdown(ing.id, ing.name, category);
      });
    });
  }

  /**
   * Adds an ingredient to the user's selected ingredients
   * @param {string} id - The ID of the ingredient to add
   */
  addIngredient(id) {
    this.userIngredients.add(id);
    this.saveUserIngredients();
    this.renderUserIngredients();
  }

  /**
   * Removes an ingredient from the user's selected ingredients
   * @param {string} id - The ID of the ingredient to remove
   */
  removeIngredient(id) {
    this.userIngredients.delete(id);
    this.saveUserIngredients();
    this.renderUserIngredients();
  }

  /**
   * Saves the user's selected ingredients to localStorage
   */
  saveUserIngredients() {
    localStorage.setItem('userIngredients', JSON.stringify([...this.userIngredients]));
  }

  /**
   * Renders the user's selected ingredients in the UI
   * Creates a list with remove buttons
   */
  renderUserIngredients() {
    const list = document.getElementById('ingredient-list');
    if (!list) return;

    // Clear the current list
    list.innerHTML = '';
    
    // Add each ingredient as a list item
    this.userIngredients.forEach(id => {
      const li = document.createElement('li');
      li.className = 'ingredient-item';
      
      // Get the display name for the ingredient
      const name = this.getIngredientName(id);
      
      // Create HTML with ingredient name and remove button
      li.innerHTML = `
        <span>${name}</span>
        <button class="remove-btn" onclick="ingredientManager.removeIngredient('${id}')">×</button>
      `;
      
      list.appendChild(li);
    });
  }

  /**
   * Gets the display name for an ingredient by ID
   * Looks in both standard and custom ingredients
   * @param {string} id - The ID of the ingredient to find
   * @returns {string} The display name of the ingredient
   */
  getIngredientName(id) {
    // First check in dropdown options (standard ingredients)
    const select = document.getElementById('ingredient-select');
    const option = select?.querySelector(`option[value="${id}"]`);
    if (option && option.value !== 'manual') return option.textContent;

    // Then check in custom ingredients
    for (const ingredients of Object.values(this.customIngredients)) {
      const ingredient = ingredients.find(i => i.id === id);
      if (ingredient) return ingredient.name;
    }

    // Fallback to ID if name not found
    return id;
  }

  /**
   * Shows the manual ingredient popup
   * Sets focus to the name input field
   */
  showManualPopup() {
    const popup = document.getElementById('manual-ingredient-popup');
    if (popup) {
      popup.style.display = 'flex';
      document.getElementById('new-ingredient-name')?.focus();
    }
  }

  /**
   * Closes the manual ingredient popup
   * Resets the form and dropdown
   */
  closeManualPopup() {
    document.getElementById('manual-ingredient-popup')?.style.setProperty('display', 'none');
    document.getElementById('manual-ingredient-form')?.reset();
    document.getElementById('ingredient-select').value = '';
  }
}

// Initialize the ingredient manager when the script loads
const ingredientManager = new IngredientManager();

// Make it globally available for event handlers
window.ingredientManager = ingredientManager;

console.log("Setup complete");
