/**
 * Recipe matching functionality
 * Matches recipes based on user ingredients and appliances
 */
import { normalizeIngredientName } from '../utils/normalizeIngredients.js';

// STEP 1: Load the recipes from the JSON file
async function loadRecipes() {
  try {
    const response = await fetch('/src/data/recipes.json');
    const recipes = await response.json();
    return recipes;
  } catch (error) {
    console.error('Error loading recipes:', error);
    return [];
  }
}

// STEP 2: Get user ingredients and appliances from localStorage
function getUserPreferences() {
  // Get user ingredients (stored as an array of [id, name] pairs or just IDs)
  const storedIngredients = JSON.parse(localStorage.getItem('userIngredients') || '[]');
  
  // Convert to Set for more efficient lookups and normalize each ingredient
  const ingredients = new Set();
  
  storedIngredients.forEach(item => {
    // Check if the item is an array (new format) or a string (old format)
    const id = Array.isArray(item) ? item[0] : item;
    
    // Now process the ID string
    const normalizedId = id.replace(/-/g, ' '); // Convert ID format to name format
    const normalizedName = normalizeIngredientName(normalizedId);
    const normalizedId2 = normalizedName.replace(/\s+/g, '-'); // Convert back to ID format
    ingredients.add(normalizedId2);
    
    // Also add the normalized name for direct matching
    ingredients.add(normalizedName);
  });
  
  // Get user appliances
  const appliances = new Set(JSON.parse(localStorage.getItem('userAppliances') || '[]'));
  
  return { ingredients, appliances };
}

// STEP 3: Match recipes based on ingredients and appliances
function matchRecipes(recipes, userIngredients, userAppliances) {
  return recipes.map(recipe => {
    // Extract required ingredients (new structure)
    const requiredIngredients = recipe.requiredIngredients || [];
    const recommendedIngredients = recipe.recommendedIngredients || [];
    
    // Process required ingredients
    const matchedRequiredIngredients = requiredIngredients.filter(item => {
      // Get the ingredient name and normalize it
      const ingredientName = item.ingredient.trim().toLowerCase();
      const normalizedName = normalizeIngredientName(ingredientName);
      
      // Check if the user has this ingredient (either as normalized name or ID)
      return Array.from(userIngredients).some(userIng => {
        // Try direct match with the normalized name
        if (userIng === normalizedName) return true;
        
        // Try matching the ID form
        const normalizedId = normalizedName.replace(/\s+/g, '-');
        return userIng === normalizedId;
      });
    });
    
    // Process recommended ingredients
    const matchedRecommendedIngredients = recommendedIngredients.filter(item => {
      // Get the ingredient name and normalize it
      const ingredientName = item.ingredient.trim().toLowerCase();
      const normalizedName = normalizeIngredientName(ingredientName);
      
      // Check if the user has this ingredient (either as normalized name or ID)
      return Array.from(userIngredients).some(userIng => {
        // Try direct match with the normalized name
        if (userIng === normalizedName) return true;
        
        // Try matching the ID form
        const normalizedId = normalizedName.replace(/\s+/g, '-');
        return userIng === normalizedId;
      });
    });
    
    // Calculate match percentages
    const totalRequired = requiredIngredients.length;
    const totalRecommended = recommendedIngredients.length;
    
    const matchedRequired = matchedRequiredIngredients.length;
    const matchedRecommended = matchedRecommendedIngredients.length;
    
    const requiredMatchPercentage = totalRequired > 0 
      ? Math.round((matchedRequired / totalRequired) * 100) 
      : 100;
    
    const recommendedMatchPercentage = totalRecommended > 0 
      ? Math.round((matchedRecommended / totalRecommended) * 100)
      : 0;
    
    // Find missing required ingredients
    const missingRequiredIngredients = requiredIngredients
      .filter(item => !matchedRequiredIngredients.includes(item))
      .map(item => ({ amount: item.amount, ingredient: item.ingredient }));
    
    // Find missing recommended ingredients
    const missingRecommendedIngredients = recommendedIngredients
      .filter(item => !matchedRecommendedIngredients.includes(item))
      .map(item => ({ amount: item.amount, ingredient: item.ingredient }));
    
    // Check appliances - same as before
    const requiredAppliances = recipe.requiredAppliances || [];
    const hasRequiredAppliances = requiredAppliances.every(appliance => {
      const applianceId = appliance.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
      return userAppliances.has(applianceId);
    });
    
    // Find missing appliances
    const missingAppliances = requiredAppliances.filter(appliance => {
      const applianceId = appliance.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
      return !userAppliances.has(applianceId);
    });
    
    // User can make this recipe if they have all required appliances and at least 80% of required ingredients
    const canMake = hasRequiredAppliances && requiredMatchPercentage >= 80;
    
    return {
      ...recipe,
      requiredMatchPercentage,
      recommendedMatchPercentage,
      matchedRequiredCount: matchedRequired,
      totalRequiredCount: totalRequired,
      matchedRecommendedCount: matchedRecommended,
      totalRecommendedCount: totalRecommended,
      missingRequiredIngredients,
      missingRecommendedIngredients,
      missingAppliances,
      canMake
    };
  }).sort((a, b) => {
    // Sort by whether they can make it
    if (a.canMake && !b.canMake) return -1;
    if (!a.canMake && b.canMake) return 1;
    
    // Then by required ingredient match percentage
    if (a.requiredMatchPercentage !== b.requiredMatchPercentage) {
      return b.requiredMatchPercentage - a.requiredMatchPercentage;
    }
    
    // Then by recommended ingredient match percentage
    return b.recommendedMatchPercentage - a.recommendedMatchPercentage;
  });
}

// STEP 4: Render recipe results in a carousel
function displayRecipes(matchedRecipes) {
  const carousel = document.getElementById('recipe-carousel');
  const counter = document.getElementById('carousel-counter');
  
  // Clear previous results
  carousel.innerHTML = '';
  
  if (matchedRecipes.length === 0) {
    // Show message if no matches
    carousel.innerHTML = `
      <div class="no-results">
        <h3>No matching recipes found</h3>
        <p>Try adding more ingredients or adjusting your kitchen profile.</p>
      </div>
    `;
    counter.textContent = '0 recipes found';
    
    // Disable carousel buttons
    document.getElementById('prev-recipe').disabled = true;
    document.getElementById('next-recipe').disabled = true;
    
    // Clear statistics
    displayRecipeStatistics(matchedRecipes);
    return;
  }
  
  // Update counter
  counter.textContent = `${matchedRecipes.length} recipes found`;
  
  // Add each recipe as a carousel item
  matchedRecipes.forEach((recipe, index) => {
    const item = document.createElement('div');
    item.className = 'carousel-item';
    if (index === 0) item.classList.add('active'); // Make first one active
    
    // Create recipe card
    const card = createRecipeCard(recipe);
    item.appendChild(card);
    carousel.appendChild(item);
  });
  
  // Enable/disable carousel buttons based on recipe count
  const prevButton = document.getElementById('prev-recipe');
  const nextButton = document.getElementById('next-recipe');
  
  prevButton.disabled = true; // Start with prev disabled (at first slide)
  nextButton.disabled = matchedRecipes.length <= 1; // Disable next if only 1 recipe
  
  // Set up carousel navigation
  let currentIndex = 0;
  
  prevButton.onclick = () => {
    // Hide current slide
    carousel.children[currentIndex].classList.remove('active');
    
    // Show previous slide
    currentIndex = (currentIndex - 1 + matchedRecipes.length) % matchedRecipes.length;
    carousel.children[currentIndex].classList.add('active');
    
    // Update button states
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = false;
  };
  
  nextButton.onclick = () => {
    // Hide current slide
    carousel.children[currentIndex].classList.remove('active');
    
    // Show next slide
    currentIndex = (currentIndex + 1) % matchedRecipes.length;
    carousel.children[currentIndex].classList.add('active');
    
    // Update button states
    prevButton.disabled = false;
    nextButton.disabled = currentIndex === matchedRecipes.length - 1;
  };
  
  // Display recipe statistics
  displayRecipeStatistics(matchedRecipes);
}

/**
 * Calculates and displays statistics about matched recipes
 * @param {Array} matchedRecipes - Array of recipe objects with match data
 */
function displayRecipeStatistics(matchedRecipes) {
  const statsContainer = document.getElementById('recipe-statistics');
  if (!statsContainer) return;
  
  // If no recipes found, show a message
  if (!matchedRecipes || matchedRecipes.length === 0) {
    statsContainer.innerHTML = `
      <div class="col text-center">
        <p class="text-muted small">No recipes found. Try adding more ingredients!</p>
      </div>
    `;
    return;
  }
  
  // Calculate statistics
  const totalRecipes = matchedRecipes.length;
  const readyToCook = matchedRecipes.filter(recipe => recipe.canMake).length;
  const almostReady = matchedRecipes.filter(recipe => 
    recipe.requiredMatchPercentage >= 80 && recipe.requiredMatchPercentage < 100).length;
  
  // Find most commonly missing ingredients and appliances
  const missingIngredientCounts = {};
  const missingApplianceCounts = {};
  
  matchedRecipes.forEach(recipe => {
    // Count missing ingredients
    recipe.missingRequiredIngredients.forEach(item => {
      const ing = item.ingredient;
      missingIngredientCounts[ing] = (missingIngredientCounts[ing] || 0) + 1;
    });
    
    // Count missing appliances
    recipe.missingAppliances.forEach(app => {
      missingApplianceCounts[app] = (missingApplianceCounts[app] || 0) + 1;
    });
  });
  
  // Get top missing ingredients and appliances
  const topMissingIngredients = Object.entries(missingIngredientCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  const topMissingAppliances = Object.entries(missingApplianceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  // Display statistics
  statsContainer.innerHTML = `
    <div class="col-md-4 mb-3">
      <div class="card h-100 bg-light">
        <div class="card-body text-center">
          <h6 class="card-title">Match Summary</h6>
          <div class="d-flex justify-content-between align-items-center my-2">
            <span>Total Recipes:</span>
            <span class="badge bg-secondary">${totalRecipes}</span>
          </div>
          <div class="d-flex justify-content-between align-items-center my-2">
            <span>Ready to Cook:</span>
            <span class="badge bg-success">${readyToCook}</span>
          </div>
          <div class="d-flex justify-content-between align-items-center my-2">
            <span>Almost Ready (≥80%):</span>
            <span class="badge bg-info">${almostReady}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="col-md-4 mb-3">
      <div class="card h-100 bg-light">
        <div class="card-body">
          <h6 class="card-title text-center">Top Missing Ingredients</h6>
          <ul class="list-group list-group-flush">
            ${topMissingIngredients.length > 0 ? 
              topMissingIngredients.map(([ing, count]) => 
                `<li class="list-group-item d-flex justify-content-between align-items-center py-2 bg-light">
                  ${ing}
                  <span class="badge bg-danger">${count} recipes</span>
                </li>`
              ).join('') : 
              '<li class="list-group-item bg-light text-center py-2">No common missing ingredients</li>'
            }
          </ul>
        </div>
      </div>
    </div>
    
    <div class="col-md-4 mb-3">
      <div class="card h-100 bg-light">
        <div class="card-body">
          <h6 class="card-title text-center">Top Missing Appliances</h6>
          <ul class="list-group list-group-flush">
            ${topMissingAppliances.length > 0 ? 
              topMissingAppliances.map(([app, count]) => 
                `<li class="list-group-item d-flex justify-content-between align-items-center py-2 bg-light">
                  ${app}
                  <span class="badge bg-danger">${count} recipes</span>
                </li>`
              ).join('') : 
              '<li class="list-group-item bg-light text-center py-2">No common missing appliances</li>'
            }
          </ul>
        </div>
      </div>
    </div>
  `;
}

// Helper function to create a recipe card
function createRecipeCard(recipe) {
  const card = document.createElement('div');
  card.className = 'recipe-card';
  
  // Create a better structured layout for larger screens
  card.innerHTML = `
    <div class="recipe-card-header p-3">
      <h3 class="h4">${recipe.name}</h3>
    </div>
    
    <div class="recipe-card-body p-3">
      <div class="row">
        <!-- Left side - recipe details -->
        <div class="col-lg-8 mb-3 mb-lg-0">
          <!-- Required ingredients match info -->
          <div class="recipe-match-info required mb-3">
            <div class="match-label">
              <span class="badge bg-success me-2">${recipe.matchedRequiredCount}/${recipe.totalRequiredCount}</span>
              <strong>Required Ingredients</strong> (${recipe.requiredMatchPercentage}%)
            </div>
            <div class="match-bar-container">
              <div class="match-bar" style="width: ${recipe.requiredMatchPercentage}%"></div>
            </div>
          </div>
          
          <!-- Recommended ingredients match info (if any) -->
          ${recipe.totalRecommendedCount > 0 ? `
            <div class="recipe-match-info recommended mb-3">
              <div class="match-label">
                <span class="badge bg-info me-2">${recipe.matchedRecommendedCount}/${recipe.totalRecommendedCount}</span>
                <strong>Recommended Ingredients</strong> (${recipe.recommendedMatchPercentage}%)
              </div>
              <div class="match-bar-container recommended">
                <div class="match-bar recommended" style="width: ${recipe.recommendedMatchPercentage}%"></div>
              </div>
            </div>
          ` : ''}
          
          <!-- Can make indicator -->
          <div class="recipe-info mt-3">
            ${recipe.canMake ? `
              <div class="alert alert-success d-flex align-items-center py-2">
                <i class="bi bi-check-circle-fill me-2"></i>
                <strong>Ready to Cook</strong>
              </div>
            ` : `
              <div class="alert alert-danger d-flex align-items-center py-2">
                <i class="bi bi-x-circle-fill me-2"></i>
                <strong>Missing Requirements</strong>
              </div>
            `}
          </div>
          
          <!-- View recipe button -->
          <button class="btn btn-primary mt-3 w-100">
            <i class="bi bi-eye me-1"></i> View Recipe
          </button>
        </div>
        
        <!-- Right side - missing items -->
        <div class="col-lg-4">
          ${(recipe.missingRequiredIngredients.length > 0 || recipe.missingAppliances.length > 0) ? `
            <div class="missing-section">
              ${recipe.missingRequiredIngredients.length > 0 ? `
                <div><strong>Missing Ingredients:</strong></div>
                <div class="text-danger ms-2 mb-2">
                  ${recipe.missingRequiredIngredients.map(item => 
                    `${item.ingredient} ${item.amount ? `<small>(${item.amount})</small>` : ''}`
                  ).join('<br>')}
                </div>
              ` : ''}
              
              ${recipe.missingAppliances.length > 0 ? `
                <div><strong>Missing Appliances:</strong></div>
                <div class="text-danger ms-2">
                  ${recipe.missingAppliances.join('<br>')}
                </div>
              ` : ''}
            </div>
          ` : `
            <div class="text-success">
              <i class="bi bi-check-circle-fill me-1"></i>
              <strong>You have everything needed!</strong>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
  
  // Add event listener to the view recipe button
  card.querySelector('.btn-primary').addEventListener('click', () => showRecipeDetail(recipe));
  
  return card;
}

// Display detailed recipe view in modal
function showRecipeDetail(recipe) {
  const modal = document.getElementById('recipe-modal');
  const content = document.getElementById('recipe-detail-content');
  
  // Use Bootstrap modal
  const bootstrapModal = new bootstrap.Modal(modal);
  
  content.innerHTML = `
    <div class="mb-4">
      <h3>${recipe.name}</h3>
      <div class="d-flex flex-wrap gap-3 mt-3">
        <span class="badge bg-success fs-6">${recipe.matchedRequiredCount}/${recipe.totalRequiredCount} Required</span>
        ${recipe.totalRecommendedCount > 0 ? 
          `<span class="badge bg-info fs-6">${recipe.matchedRecommendedCount}/${recipe.totalRecommendedCount} Recommended</span>` : ''}
        <span class="badge ${recipe.canMake ? 'bg-success' : 'bg-danger'} fs-6">
          ${recipe.canMake ? 'Can Make' : 'Missing Items'}
        </span>
      </div>
    </div>
    
    <div class="card mb-3">
      <div class="card-header">
        <h5 class="mb-0">Required Ingredients</h5>
      </div>
      <div class="card-body">
        <ul class="list-group list-group-flush">
          ${recipe.requiredIngredients.map(item => {
            const isMissing = recipe.missingRequiredIngredients.some(
              missingItem => missingItem.ingredient === item.ingredient
            );
            return `
              <li class="list-group-item d-flex justify-content-between align-items-center ${isMissing ? 'text-danger' : ''}">
                <span>
                  ${item.amount ? `<small class="text-muted me-2">${item.amount}</small>` : ''}
                  ${item.ingredient}
                </span>
                ${isMissing ? 
                  '<span class="badge bg-danger rounded-pill">Missing</span>' : 
                  '<span class="badge bg-success rounded-pill"><i class="bi bi-check"></i></span>'}
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    </div>
    
    ${recipe.recommendedIngredients && recipe.recommendedIngredients.length > 0 ? `
      <div class="card mb-3">
        <div class="card-header">
          <h5 class="mb-0">Recommended Ingredients</h5>
        </div>
        <div class="card-body">
          <ul class="list-group list-group-flush">
            ${recipe.recommendedIngredients.map(item => {
              const isMissing = recipe.missingRecommendedIngredients.some(
                missingItem => missingItem.ingredient === item.ingredient
              );
              return `
                <li class="list-group-item d-flex justify-content-between align-items-center ${isMissing ? 'text-muted' : ''}">
                  <span>
                    ${item.amount ? `<small class="text-muted me-2">${item.amount}</small>` : ''}
                    ${item.ingredient}
                  </span>
                  ${isMissing ? 
                    '<span class="badge bg-secondary rounded-pill">Optional</span>' : 
                    '<span class="badge bg-info rounded-pill"><i class="bi bi-check"></i></span>'}
                </li>
              `;
            }).join('')}
          </ul>
        </div>
      </div>
    ` : ''}
    
    <div class="card mb-3">
      <div class="card-header">
        <h5 class="mb-0">Instructions</h5>
      </div>
      <div class="card-body">
        <ol class="list-group list-group-numbered">
          ${recipe.instructions.map(step => `
            <li class="list-group-item">${step}</li>
          `).join('')}
        </ol>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Required Appliances</h5>
      </div>
      <div class="card-body">
        <ul class="list-group list-group-flush">
          ${(recipe.requiredAppliances || []).map(app => {
            const isMissing = recipe.missingAppliances.includes(app);
            return `
              <li class="list-group-item d-flex justify-content-between align-items-center ${isMissing ? 'text-danger' : ''}">
                ${app}
                ${isMissing ? 
                  '<span class="badge bg-danger rounded-pill">Missing</span>' : 
                  '<span class="badge bg-success rounded-pill"><i class="bi bi-check"></i></span>'}
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    </div>
  `;
  
  // Show the modal
  bootstrapModal.show();
  
  // Setup close handlers
  const closeButtons = modal.querySelectorAll('.close-modal');
  closeButtons.forEach(button => {
    button.onclick = () => bootstrapModal.hide();
  });
}

// STEP 5: Initialize and run the recipe search when requested
document.addEventListener('DOMContentLoaded', () => {
  const findRecipesBtn = document.getElementById('find-recipes-btn');
  
  if (findRecipesBtn) {
    findRecipesBtn.addEventListener('click', async () => {
      // Show loading state
      findRecipesBtn.textContent = 'Finding Recipes...';
      findRecipesBtn.disabled = true;
      
      try {
        // Get recipes and user preferences
        const recipes = await loadRecipes();
        const { ingredients, appliances } = getUserPreferences();
        
        // Match recipes
        const matched = matchRecipes(recipes, ingredients, appliances);
        
        // Display results
        displayRecipes(matched);
      } catch (error) {
        console.error('Error finding recipes:', error);
        document.getElementById('recipe-carousel').innerHTML = `
          <div class="no-results">
            <h3>Error finding recipes</h3>
            <p>Something went wrong. Please try again later.</p>
          </div>
        `;
        document.getElementById('carousel-counter').textContent = '0 recipes found';
      } finally {
        // Reset button
        findRecipesBtn.textContent = 'Find Recipes';
        findRecipesBtn.disabled = false;
      }
    });
  }
  
  // Initialize modal for recipe details
  const modal = document.getElementById('recipe-modal');
  if (modal) {
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
      closeBtn.onclick = () => {
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) {
          bootstrapModal.hide();
        }
      };
    }
  }
});

