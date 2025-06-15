/**
 * Main application script for the WhatCanICook web app
 */
console.log("Welcome to WhatCanICook!");

// Import ingredient data categories and normalization utilities
import { ingredientCategories } from './data/ingredients.js';
import { normalizeIngredientName, isDuplicateIngredient, normalizeIngredientId } from './utils/normalizeIngredients.js';

// Add more detailed logging to diagnose the issue
console.log("Imported ingredient categories:", Object.keys(ingredientCategories));
console.log("Number of categories:", Object.keys(ingredientCategories).length);
console.log("Sample category contents:", ingredientCategories["Staples"] || "Not found");

/**
 * Class responsible for managing all ingredient-related functionality
 */
class IngredientManager {
  constructor() {
    // Initialize with empty Map first (avoid circular dependency)
    this.userIngredients = new Map();
    
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
      this.loadStoredIngredients();  // First load ingredients safely
      this.initializeDropdown();     // Then setup the UI components
      this.initializeCategoryRadios();
      this.initializeEventListeners();
      this.populateCustomIngredients();
      this.renderUserIngredients();
    } catch (error) {
      console.error('Error initializing IngredientManager:', error);
    }
  }
  
  /**
   * Load user ingredients from localStorage safely
   * Avoids circular dependency during initialization
   */
  loadStoredIngredients() {
    const storedIngredients = JSON.parse(localStorage.getItem('userIngredients') || '[]');
    
    // Clear the Map (should be empty, but just to be safe)
    this.userIngredients.clear();
    
    // Check the format of stored ingredients
    if (storedIngredients.length > 0) {
      if (Array.isArray(storedIngredients[0])) {
        // New format with [id, name] pairs
        storedIngredients.forEach(([id, name]) => {
          this.userIngredients.set(id, name);
        });
      } else {
        // Old format with just IDs - use the dropdown name or ID itself
        storedIngredients.forEach(id => {
          // Get name from dropdown if initialized, otherwise use ID temporarily
          // We'll fix any missing names when dropdown is initialized
          const name = id;  // Just use ID during initialization
          this.userIngredients.set(id, name);
        });
      }
    }
  }

  /**
   * Updates display names for ingredients after dropdown is initialized
   * This ensures all ingredients have proper display names even if loaded before dropdown
   */
  updateIngredientDisplayNames() {
    for (const [id, name] of this.userIngredients.entries()) {
      if (id === name) {  // If name is same as ID, try to get a better name
        const betterName = this.getDropdownName(id);
        if (betterName) {
          this.userIngredients.set(id, betterName);
        }
      }
    }
  }
  
  /**
   * Sets up the ingredient dropdown with categorized options
   * Groups ingredients by their categories and sorts them alphabetically
   */
  initializeDropdown() {
    const select = document.getElementById('ingredient-select');
    if (!select) {
      console.error('ingredient-select element not found');
      return; // Exit early instead of throwing an error
    }

    console.log("Initializing dropdown with categories:", Object.keys(ingredientCategories));

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

    // Check if ingredientCategories is empty or undefined
    if (!ingredientCategories || Object.keys(ingredientCategories).length === 0) {
      console.error("No ingredient categories found! Check import path.");
      
      // Add a single disabled option to show there's a problem
      const errorOption = document.createElement('option');
      errorOption.disabled = true;
      errorOption.textContent = '-- Error loading ingredients --';
      select.appendChild(errorOption);
    } else {
      // Add each category as an optgroup with its ingredients as options
      Object.entries(ingredientCategories).forEach(([category, ingredients]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;

        console.log(`Adding category: ${category} with ${ingredients.length} ingredients`);

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
    }

    // Re-add the "manual add" option at the end
    if (manualOption) {
      select.appendChild(manualOption);
    } else {
      const newManual = document.createElement('option');
      newManual.value = 'manual';
      newManual.textContent = '+ Add new ingredient';
      select.appendChild(newManual);
    }

    // After dropdown is initialized, update any ingredient names
    this.updateIngredientDisplayNames();
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

    // Form submission for selecting an ingredient from dropdown - FIX: bound to this context
    if (ingredientForm) {
      console.log('Setting up ingredient form submit handler');
      // Use a named function to ensure the event handler isn't lost
      const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted, processing selection');
        this.handleIngredientSelection();
      };
      
      // Remove any existing handlers to prevent duplicates
      ingredientForm.removeEventListener('submit', handleSubmit);
      ingredientForm.addEventListener('submit', handleSubmit);
    } else {
      console.error('Ingredient form element not found!');
    }

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
    
    if (!select) {
      console.error('Ingredient select element not found');
      return;
    }
    
    const value = select.value;
    console.log(`Selected ingredient value: "${value}"`);

    if (value === 'manual') {
      // Show popup for manual ingredient entry
      this.showManualPopup();
    } else if (value) {
      // Add the selected ingredient to user's ingredients
      const success = this.addIngredient(value);
      
      // Only reset the dropdown if the ingredient was successfully added
      if (success) {
        console.log('Resetting select dropdown after successful add');
        select.value = '';
      }
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

    // Keep original input name for display
    const originalName = name;

    // Normalize the ingredient name for ID generation and duplicate checking
    const normalizedName = normalizeIngredientName(name);
    
    // Check if this ingredient already exists (using normalized form)
    if (isDuplicateIngredient(normalizedName, 
        new Set([...this.userIngredients.keys()]))) {
      alert(`You already have "${name}" in your ingredient list.`);
      return;
    }

    // Create an ID for the ingredient (lowercase, hyphenated)
    const id = normalizedName.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');

    // Initialize category array if it doesn't exist
    if (!this.customIngredients[category]) {
      this.customIngredients[category] = [];
    }

    // Add to custom ingredients - store original name
    this.customIngredients[category].push({ id, name: originalName });
    
    // Sort ingredients alphabetically within their category
    this.customIngredients[category].sort((a, b) => a.name.localeCompare(b.name));
    
    // Save custom ingredients to localStorage
    localStorage.setItem('customIngredients', JSON.stringify(this.customIngredients));

    // Add the ingredient to the dropdown and user's selected ingredients
    this.addToDropdown(id, originalName, category);
    // Pass original name to preserve it
    this.addIngredient(id, originalName);
    
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
   * Renders the user's selected ingredients in the UI
   * Organizes ingredients by their categories
   */
  renderUserIngredients() {
    const container = document.getElementById('categorized-ingredients');
    if (!container) return;

    // Clear the current display
    container.innerHTML = '';
    
    if (this.userIngredients.size === 0) {
      container.innerHTML = `
        <div class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          No ingredients added yet. Start adding ingredients above.
        </div>
      `;
      return;
    }
    
    // Group ingredients by category
    const categorizedIngredients = {};
    
    // Process all user ingredients - now using entries() for [id, displayName]
    for (const [id, displayName] of this.userIngredients.entries()) {
      // Find the ingredient's category by ID
      let category = this.findIngredientCategory(id);
      
      // Initialize category array if needed
      if (!categorizedIngredients[category]) {
        categorizedIngredients[category] = [];
      }
      
      // Add to the appropriate category - use the stored displayName
      categorizedIngredients[category].push({ id, name: displayName });
    }

    // Sort the categories by name
    const sortedCategories = Object.keys(categorizedIngredients).sort();
    
    // Create DOM elements for each category and its ingredients
    sortedCategories.forEach(category => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'ingredient-category';
      
      // Category heading
      const heading = document.createElement('h3');
      heading.textContent = category;
      categoryDiv.appendChild(heading);
      
      // Container for ingredients in this category
      const ingredientsList = document.createElement('div');
      ingredientsList.className = 'category-ingredients';
      
      // Sort ingredients alphabetically within each category
      const sortedIngredients = categorizedIngredients[category].sort((a, b) => 
        a.name.localeCompare(b.name));
      
      // Add each ingredient as a tag with remove button
      sortedIngredients.forEach(({ id, name }) => {
        const tag = document.createElement('div');
        tag.className = 'ingredient-tag';
        
        // Ingredient name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        tag.appendChild(nameSpan);
        
        // Button container for actions
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'tag-buttons';
        
        // Remove button - removes from selected ingredients only
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.setAttribute('aria-label', 'Remove ingredient');
        removeBtn.title = 'Remove from selection';
        removeBtn.onclick = () => this.removeIngredient(id);
        buttonContainer.appendChild(removeBtn);
        
        // Check if this is a custom ingredient
        const isCustom = this.isCustomIngredient(id);
        if (isCustom) {
          // Delete button - deletes custom ingredient completely
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'delete-btn';
          deleteBtn.innerHTML = '<i class="bi bi-trash3"></i>';
          deleteBtn.setAttribute('aria-label', 'Delete custom ingredient');
          deleteBtn.title = 'Delete custom ingredient';
          deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteCustomIngredient(id);
          };
          buttonContainer.appendChild(deleteBtn);
        }
        
        tag.appendChild(buttonContainer);
        ingredientsList.appendChild(tag);
      });
      
      categoryDiv.appendChild(ingredientsList);
      container.appendChild(categoryDiv);
    });
  }
  
  /**
   * Checks if an ingredient is a custom ingredient
   * @param {string} id - The ID of the ingredient to check
   * @returns {boolean} True if it's a custom ingredient
   */
  isCustomIngredient(id) {
    // Check all categories in customIngredients for the ID
    return Object.values(this.customIngredients).some(
      ingredients => ingredients.some(ing => ing.id === id)
    );
  }

  /**
   * Deletes a custom ingredient completely from the system
   * @param {string} id - The ID of the custom ingredient to delete
   */
  deleteCustomIngredient(id) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this ingredient? This cannot be undone.')) {
      return;
    }
    
    console.log(`Deleting custom ingredient: ${id}`);
    
    // Remove from userIngredients if present
    if (this.userIngredients.has(id)) {
      this.userIngredients.delete(id);
      this.saveUserIngredients();
    }
    
    // Find and remove from customIngredients
    let found = false;
    for (const [category, ingredients] of Object.entries(this.customIngredients)) {
      const index = ingredients.findIndex(ing => ing.id === id);
      if (index !== -1) {
        // Remove the ingredient from the category
        this.customIngredients[category].splice(index, 1);
        found = true;
        break;
      }
    }
    
    if (found) {
      // Save updated custom ingredients list
      localStorage.setItem('customIngredients', JSON.stringify(this.customIngredients));
      
      // Remove from dropdown
      const select = document.getElementById('ingredient-select');
      const option = select?.querySelector(`option[value="${id}"]`);
      if (option) option.remove();
      
      console.log(`Custom ingredient ${id} deleted successfully`);
    } else {
      console.warn(`Failed to find custom ingredient ${id} for deletion`);
    }
    
    // Re-render the ingredients list
    this.renderUserIngredients();
  }

  /**
   * Finds the category of an ingredient by its ID
   * @param {string} id - The ID of the ingredient
   * @returns {string} - The category name
   */
  findIngredientCategory(id) {
    // First check in the predefined categories
    for (const [category, ingredients] of Object.entries(ingredientCategories)) {
      const normalizedIngredients = ingredients.map(ing => 
        ing.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
      );
      
      if (normalizedIngredients.includes(id)) {
        return category;
      }
    }
    
    // Then check in custom ingredients
    for (const [category, ingredients] of Object.entries(this.customIngredients)) {
      if (ingredients.some(ing => ing.id === id)) {
        return category;
      }
    }
    
    // Default category if not found
    return "Other";
  }

  /**
   * Adds an ingredient to the user's selected ingredients
   * @param {string} id - The ID of the ingredient to add
   * @param {string} [displayName] - Optional custom display name (uses dropdown text by default)
   * @returns {boolean} - Whether the ingredient was successfully added
   */
  addIngredient(id, displayName = null) {
    // Fix: Ensure the id is a string
    const ingredientId = String(id);
    console.log(`Attempting to add ingredient: "${ingredientId}"`);
    
    // Check for empty values
    if (!ingredientId.trim()) {
      console.warn('Attempted to add empty ingredient ID');
      return false;
    }
    
    try {
      // Normalize the ID to prevent duplicates
      const normalizedId = normalizeIngredientId(ingredientId);
      console.log(`Normalized ID: "${normalizedId}"`);
      
      // Debug current ingredients
      console.log('Current ingredients:', [...this.userIngredients.keys()]);
      
      // Check if this ingredient (or its normalized form) already exists
      // by comparing normalized IDs
      const isDuplicate = Array.from(this.userIngredients.keys()).some(existingId => {
        const existingNormalized = normalizeIngredientId(existingId);
        const isDup = existingNormalized === normalizedId;
        if (isDup) {
          console.log(`Duplicate found: "${existingId}" (norm: "${existingNormalized}") matches "${ingredientId}" (norm: "${normalizedId}")`);
        }
        return isDup;
      });
      
      if (isDuplicate) {
        console.log(`Ingredient "${ingredientId}" already exists, not adding duplicate.`);
        return false;
      }
      
      // Get display name (from parameter, dropdown, or fallback to ID)
      const name = displayName || this.getDropdownName(ingredientId) || ingredientId;
      
      // Add the ingredient to the Map with its display name
      this.userIngredients.set(ingredientId, name);
      console.log(`Successfully added ingredient: "${ingredientId}" with display name: "${name}"`);
      console.log(`Updated ingredients:`, [...this.userIngredients.entries()]);
      
      // Update localStorage and UI
      this.saveUserIngredients();
      this.renderUserIngredients();
      
      return true;
    } catch (error) {
      console.error(`Error adding ingredient "${ingredientId}":`, error);
      return false;
    }
  }

  /**
   * Get name from dropdown by ID
   * @param {string} id - Ingredient ID to look up
   * @returns {string|null} - Display name if found
   */
  getDropdownName(id) {
    const select = document.getElementById('ingredient-select');
    const option = select?.querySelector(`option[value="${id}"]`);
    if (option && option.value !== 'manual') return option.textContent;
    return null;
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
    // Convert Map to array of entries for JSON storage
    localStorage.setItem('userIngredients', 
      JSON.stringify([...this.userIngredients.entries()]));
  }

  /**
   * Gets the display name for an ingredient by ID
   * Looks in both stored names, standard and custom ingredients
   * @param {string} id - The ID of the ingredient to find
   * @returns {string} The display name of the ingredient
   */
  getIngredientName(id) {
    // First check if we have a stored name
    if (this.userIngredients.has(id)) {
      return this.userIngredients.get(id);
    }
    
    // Then check in dropdown options (standard ingredients)
    const name = this.getDropdownName(id);
    if (name) return name;

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
      // Use Bootstrap's Modal API instead of changing style directly
      const bootstrapModal = new bootstrap.Modal(popup);
      bootstrapModal.show();
      document.getElementById('new-ingredient-name')?.focus();
    }
  }

  /**
   * Closes the manual ingredient popup
   * Resets the form and dropdown
   */
  closeManualPopup() {
    const popup = document.getElementById('manual-ingredient-popup');
    if (popup) {
      // Use Bootstrap's Modal API to hide
      const bootstrapModal = bootstrap.Modal.getInstance(popup);
      if (bootstrapModal) {
        bootstrapModal.hide();
      }
    }
    document.getElementById('manual-ingredient-form')?.reset();
    document.getElementById('ingredient-select').value = '';
  }
}

// Initialize the ingredient manager when the script loads
const ingredientManager = new IngredientManager();

// Make it globally available for event handlers
window.ingredientManager = ingredientManager;

console.log("Setup complete");
