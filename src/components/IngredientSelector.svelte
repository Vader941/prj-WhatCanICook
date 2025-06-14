<!-- 
  Svelte component for ingredient selection
  Displays a tabbed interface with ingredient categories
  Allows users to check/uncheck ingredients they have
-->
<script>
  // Import the ingredient stores and helper functions
  import { availableIngredients, userIngredients, toggleUserIngredient } from '../stores/ingredientStore';

  // Track the currently selected category tab
  let selectedCategory = '';
  
  // Reactively get the list of categories from the available ingredients
  $: categories = Object.keys($availableIngredients);
</script>

<div class="ingredient-selector">
  <!-- Category tabs for navigation -->
  <div class="category-tabs">
    {#each categories as category}
      <button 
        class="category-tab" 
        class:active={selectedCategory === category}  
        on:click={() => selectedCategory = category}
      >
        {category}
      </button>
    {/each}
  </div>

  <!-- Display ingredients for the selected category -->
  {#if selectedCategory && $availableIngredients[selectedCategory]}
    <div class="ingredients-grid">
      {#each $availableIngredients[selectedCategory] as ingredient}
        <label class="ingredient-item">
          <input 
            type="checkbox" 
            checked={$userIngredients[ingredient.id] || false} 
            on:change={() => toggleUserIngredient(ingredient.id)} 
          />
          <span>{ingredient.name}</span>
        </label>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Container for the entire component */
  .ingredient-selector {
    max-width: 600px;
    margin: 0 auto;
  }

  /* Styles for the category tabs */
  .category-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .category-tab {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    background: white;
    cursor: pointer;
    border-radius: 4px;
  }

  /* Highlight the active tab */
  .category-tab.active {
    background: #007bff;
    color: white;
  }

  /* Grid layout for ingredients */
  .ingredients-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.5rem;
  }

  /* Style for each ingredient checkbox item */
  .ingredient-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #eee;
    border-radius: 4px;
    cursor: pointer;
  }

  /* Hover effect for ingredient items */
  .ingredient-item:hover {
    background: #f8f9fa;
  }
</style>
