/**
 * Recipe matching functionality
 * Matches recipes based on user ingredients and appliances
 * Displays results in an interactive UI
 */

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
  // Get user ingredients (stored as an array or Set)
  const ingredientIds = JSON.parse(localStorage.getItem('userIngredients') || '[]');
  
  // Convert to Set for more efficient lookups
  const ingredients = new Set(ingredientIds);
  
  // Get user appliances
  const appliances = new Set(JSON.parse(localStorage.getItem('userAppliances') || '[]'));
  
  return { ingredients, appliances };
}

// STEP 3: Match recipes based on ingredients and appliances
function matchRecipes(recipes, userIngredients, userAppliances) {
  return recipes.map(recipe => {
    // Calculate ingredient matches
    const totalIngredients = recipe.ingredients.length;
    const matchedIngredients = recipe.ingredients.filter(ing => 
      userIngredients.has(ing.toLowerCase().replace(/\s+/g, '-'))
    );
    const matchedCount = matchedIngredients.length;
    const matchPercentage = Math.round((matchedCount / totalIngredients) * 100);
    
    // Find missing ingredients
    const missingIngredients = recipe.ingredients.filter(ing => 
      !userIngredients.has(ing.toLowerCase().replace(/\s+/g, '-'))
    );
    
    // Check appliances
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
    
    return {
      ...recipe,
      matchPercentage,
      matchedIngredients: matchedIngredients.map(ing => ing.toLowerCase().replace(/\s+/g, '-')),
      missingIngredients,
      missingAppliances,
      canMake: hasRequiredAppliances && matchPercentage >= 80 // Can make if has all appliances and 80%+ ingredients
    };
  }).sort((a, b) => {
    // Sort by whether they can make it
    if (a.canMake && !b.canMake) return -1;
    if (!a.canMake && b.canMake) return 1;
    
    // Then by match percentage
    return b.matchPercentage - a.matchPercentage;
  });
}

// STEP 4: Render recipe results with detailed cards
function displayRecipes(matchedRecipes) {
  const container = document.getElementById('recipe-results');
  
  // Clear previous results
  container.innerHTML = '';
  
  // Add header
  const header = document.createElement('h2');
  header.textContent = 'Recipe Matches';
  container.appendChild(header);
  
  if (matchedRecipes.length === 0) {
    // Show message if no matches
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.innerHTML = `
      <h3>No matching recipes found</h3>
      <p>Try adding more ingredients or adjusting your kitchen profile.</p>
    `;
    container.appendChild(noResults);
    return;
  }
  
  // Create container for recipe cards
  const recipesGrid = document.createElement('div');
  recipesGrid.className = 'recipes-container';
  container.appendChild(recipesGrid);
  
  // Add each recipe card
  matchedRecipes.forEach(recipe => {
    const card = createRecipeCard(recipe);
    recipesGrid.appendChild(card);
  });
  
  // Scroll to results
  container.scrollIntoView({ behavior: 'smooth' });
}

// Helper function to create a recipe card
function createRecipeCard(recipe) {
  const card = document.createElement('div');
  card.className = 'recipe-card';
  
  // Create card header with title
  const cardHeader = document.createElement('div');
  cardHeader.className = 'recipe-card-header';
  cardHeader.innerHTML = `<h3>${recipe.name}</h3>`;
  
  // Create card body with match details
  const cardBody = document.createElement('div');
  cardBody.className = 'recipe-card-body';
  
  // Match percentage display
  const matchDisplay = document.createElement('div');
  matchDisplay.className = 'match-percentage';
  matchDisplay.textContent = `${recipe.matchPercentage}% match`;
  
  // Visual match bar
  const matchBarContainer = document.createElement('div');
  matchBarContainer.className = 'match-bar-container';
  const matchBar = document.createElement('div');
  matchBar.className = 'match-bar';
  matchBar.style.width = `${recipe.matchPercentage}%`;
  matchBarContainer.appendChild(matchBar);
  
  // Can make indicator
  const canMakeInfo = document.createElement('div');
  canMakeInfo.className = 'recipe-info';
  canMakeInfo.innerHTML = recipe.canMake ? 
    '<strong style="color: #28a745;">✓ Ready to Cook</strong>' : 
    '<strong style="color: #dc3545;">✗ Missing Requirements</strong>';
  
  cardBody.appendChild(matchDisplay);
  cardBody.appendChild(matchBarContainer);
  cardBody.appendChild(canMakeInfo);
  
  // Missing ingredients section (if any)
  if (recipe.missingIngredients.length > 0) {
    const missingIngredientsSection = document.createElement('div');
    missingIngredientsSection.innerHTML = `
      <div class="recipe-info"><strong>Missing Ingredients:</strong></div>
      <ul class="ingredient-list">
        ${recipe.missingIngredients.map(ing => `<li class="ingredient-item missing">${ing}</li>`).join('')}
      </ul>
    `;
    cardBody.appendChild(missingIngredientsSection);
  }
  
  // Missing appliances section (if any)
  if (recipe.missingAppliances.length > 0) {
    const missingAppliancesSection = document.createElement('div');
    missingAppliancesSection.innerHTML = `
      <div class="recipe-info"><strong>Missing Appliances:</strong></div>
      <ul class="appliance-list">
        ${recipe.missingAppliances.map(app => `<li class="ingredient-item missing">${app}</li>`).join('')}
      </ul>
    `;
    cardBody.appendChild(missingAppliancesSection);
  }
  
  // View recipe button
  const viewButton = document.createElement('button');
  viewButton.className = 'view-recipe-btn';
  viewButton.textContent = 'View Recipe';
  viewButton.addEventListener('click', () => showRecipeDetail(recipe));
  
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'recipe-actions';
  actionsDiv.appendChild(viewButton);
  cardBody.appendChild(actionsDiv);
  
  // Assemble card
  card.appendChild(cardHeader);
  card.appendChild(cardBody);
  
  return card;
}

// Display detailed recipe view in modal
function showRecipeDetail(recipe) {
  const modal = document.getElementById('recipe-modal');
  const content = document.getElementById('recipe-detail-content');
  
  content.innerHTML = `
    <div class="recipe-detail-header">
      <h2>${recipe.name}</h2>
      <div class="recipe-detail-info">
        <span><strong>Match:</strong> ${recipe.matchPercentage}%</span>
        <span><strong>Can Make:</strong> ${recipe.canMake ? 'Yes' : 'No'}</span>
      </div>
    </div>
    
    <div class="recipe-detail-section">
      <h3>Ingredients</h3>
      <ul class="ingredient-list">
        ${recipe.ingredients.map(ing => {
          const isMissing = recipe.missingIngredients.includes(ing);
          return `<li class="ingredient-item ${isMissing ? 'missing' : ''}">${ing}${isMissing ? ' (missing)' : ''}</li>`;
        }).join('')}
      </ul>
    </div>
    
    <div class="recipe-detail-section">
      <h3>Required Appliances</h3>
      <ul class="appliance-list">
        ${(recipe.requiredAppliances || []).map(app => {
          const isMissing = recipe.missingAppliances.includes(app);
          return `<li class="appliance-item ${isMissing ? 'missing' : ''}">${app}${isMissing ? ' (missing)' : ''}</li>`;
        }).join('')}
      </ul>
    </div>
    
    <div class="recipe-detail-section">
      <h3>Instructions</h3>
      <ol class="instruction-list">
        ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
      </ol>
    </div>
  `;
  
  modal.style.display = 'flex';
  
  // Close modal when clicking the close button or outside the modal
  const closeBtn = modal.querySelector('.close-modal');
  closeBtn.onclick = () => modal.style.display = 'none';
  
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
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
        document.getElementById('recipe-results').innerHTML = `
          <h2>Recipe Matches</h2>
          <div class="no-results">
            <h3>Error finding recipes</h3>
            <p>Something went wrong. Please try again later.</p>
          </div>
        `;
      } finally {
        // Reset button
        findRecipesBtn.textContent = 'Find Recipes';
        findRecipesBtn.disabled = false;
      }
    });
  }
  
  // Initialize any other elements
  const modal = document.getElementById('recipe-modal');
  if (modal) {
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
      closeBtn.onclick = () => modal.style.display = 'none';
    }
  }
});
