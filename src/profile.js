/**
 * JavaScript for the user profile page
 * Handles displaying and saving the user's kitchen appliances
 */
import { applianceCategories } from './data/appliances.js';

console.log("Profile page loaded");
console.log("Imported appliance categories:", Object.keys(applianceCategories));

/**
 * Class responsible for managing the user's kitchen profile
 * Handles appliance selection, display, and persistence
 */
class UserProfileManager {
  constructor() {
    // Load saved appliances from localStorage or initialize empty
    this.userAppliances = new Set(JSON.parse(localStorage.getItem('userAppliances') || '[]'));
    
    // Wait for DOM to be ready before initializing UI
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }
  
  /**
   * Initialize the profile manager when DOM is ready
   */
  initialize() {
    try {
      this.initializeApplianceCategories();
      this.initializeEventListeners();
      console.log("User profile manager initialized");
    } catch (error) {
      console.error('Error initializing UserProfileManager:', error);
    }
  }
  
  /**
   * Set up the appliance category buttons and initial display
   */
  initializeApplianceCategories() {
    const categoryContainer = document.querySelector('.appliance-categories');
    if (!categoryContainer) {
      console.error("Appliance categories container not found");
      return;
    }
    
    // Clear the container
    categoryContainer.innerHTML = '';
    
    // Add "All" category button (default selection)
    const allButton = document.createElement('button');
    allButton.className = 'category-btn active';
    allButton.dataset.category = 'all';
    allButton.textContent = 'All';
    categoryContainer.appendChild(allButton);
    
    // Add a button for each appliance category
    Object.keys(applianceCategories).forEach(category => {
      const button = document.createElement('button');
      button.className = 'category-btn';
      button.dataset.category = category;
      button.textContent = category;
      categoryContainer.appendChild(button);
    });
    
    // Display all appliances initially
    this.displayAppliances('all');
  }
  
  /**
   * Set up event listeners for user interactions
   */
  initializeEventListeners() {
    // Category button click event - filter appliances by category
    document.querySelectorAll('.appliance-categories .category-btn').forEach(button => {
      button.addEventListener('click', () => {
        // Update active state on buttons
        document.querySelectorAll('.appliance-categories .category-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Display appliances for the selected category
        this.displayAppliances(button.dataset.category);
      });
    });

    // Save button event - save changes and return to main page
    const saveBtn = document.getElementById('save-profile');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveUserAppliances();
        alert('Profile saved successfully!');
        window.location.href = 'index.html';
      });
    }
  }
  
  /**
   * Display appliances for a specific category or all categories
   * @param {string} categoryName - The category to display or 'all' for all categories
   */
  displayAppliances(categoryName) {
    const applianceGrid = document.querySelector('.appliance-grid');
    if (!applianceGrid) {
      console.error("Appliance grid not found");
      return;
    }
    
    // Clear the grid to rebuild it
    applianceGrid.innerHTML = '';
    
    if (categoryName === 'all') {
      // Display all appliances grouped by category
      Object.entries(applianceCategories).forEach(([category, appliances]) => {
        this.addAppliancesToGrid(category, appliances, applianceGrid);
      });
    } else if (applianceCategories[categoryName]) {
      // Display only appliances for the selected category
      this.addAppliancesToGrid(categoryName, applianceCategories[categoryName], applianceGrid);
    }
  }
  
  /**
   * Add a group of appliances to the display grid
   * @param {string} category - The category name for the heading
   * @param {string[]} appliances - Array of appliance names
   * @param {HTMLElement} grid - The grid container to add appliances to
   */
  addAppliancesToGrid(category, appliances, grid) {
    // Add category header
    const header = document.createElement('div');
    header.className = 'category-header';
    header.style.gridColumn = '1 / -1'; // Span all columns
    header.textContent = category;
    grid.appendChild(header);
    
    // Add each appliance as a checkbox item
    appliances.forEach(appliance => {
      // Create a clean ID from the appliance name
      const applianceId = appliance.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
      const item = document.createElement('label');
      item.className = 'appliance-item';
      
      // Create checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `appliance-${applianceId}`;
      // Check if user has this appliance
      checkbox.checked = this.userAppliances.has(applianceId);
      // Toggle when changed
      checkbox.addEventListener('change', () => this.toggleAppliance(applianceId));
      
      // Add label text
      const span = document.createElement('span');
      span.textContent = appliance;
      
      // Add checkbox and label to item
      item.appendChild(checkbox);
      item.appendChild(span);
      grid.appendChild(item);
    });
  }
  
  /**
   * Toggle an appliance in the user's set of available appliances
   * @param {string} applianceId - ID of the appliance to toggle
   */
  toggleAppliance(applianceId) {
    if (this.userAppliances.has(applianceId)) {
      this.userAppliances.delete(applianceId);
    } else {
      this.userAppliances.add(applianceId);
    }
  }
  
  /**
   * Save the user's appliances to localStorage
   * Only called when the Save button is clicked
   */
  saveUserAppliances() {
    localStorage.setItem('userAppliances', JSON.stringify([...this.userAppliances]));
  }
  
  /**
   * Get the user's appliances as an array
   * @returns {string[]} Array of appliance IDs
   */
  getUserAppliances() {
    return [...this.userAppliances];
  }
}

// Initialize the profile manager
const profileManager = new UserProfileManager();
// Make it globally available for event handlers
window.profileManager = profileManager;
