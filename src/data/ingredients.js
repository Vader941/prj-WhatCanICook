/**
 * Data file containing predefined ingredient categories and items
 * Organized as a dictionary/object with category names as keys and arrays of ingredients as values
 * Used to populate the ingredient selection dropdown and provide structure for ingredient management
 */

// Make sure this is exported correctly
export const ingredientCategories = {
  // Basic cooking staples and pantry items
  "Staples": [
    "salt",
    "pepper",
    "olive oil",
    "butter",
    "brown sugar",
    "flour",
    "self rising flour"
  ],
  "Dairy and Eggs": [
    "milk",
    "shredded cheese",
    "egg",
    "sour cream",
    "cheddar cheese",
    "mozzarella",
    "greek yogurt",
    "cheese"
    ],
  "Proteins": [
    "cooked bacon bits",
    "tuna",
    "sausage links",
    "ground beef",
    "chicken breast"
  ],
  "Vegetables": [
    "medium russet potato",
    "black beans",
    "tomato",
    "red onion",
    "spinach",
    "shredded carrots",
    "cucumber",
    "kidney beans",
    "diced tomatoes",
    "cherry tomatoes",
    "bell pepper",
    "onion",
    "mixed vegetables",
    "broccoli",
    "coleslaw mix",
    "garlic",
    "avocado"
  ],
  "Fruits": [
    "apple",
    "dried fruit",
    "berries",
    "juice of lime",
    "banana",
    "fruit",
    "juice of lemon",
    "lemon"
  ],
  "Herbs & Spices": [
    "soy sauce",
    "sriracha",
    "cumin",
    "cinnamon",
    "fresh basil",
    "bagel seasoning",
    "red pepper flakes",
    "chili powder",
    "italian seasoning",
    "garlic powder",
    "dried herbs",
    "ginger",
    "cilantro"
  ],
  "Grains & Cereals": [
    "elbow macaroni",
    "packet instant ramen",
    "instant rice",
    "pasta",
    "pretzels",
    "bread",
    "granola",
    "rolled oats",
    "tortilla",
    "macaroni",
    "white rice",
    "oats",
    "breadcrumbs"
  ],
  "Condiments & Sauces": [
    "salsa",
    "mayonnaise",
    "marinara sauce",
    "balsamic glaze",
    "pesto",
    "tomato sauce",
    "soy sauce",
    "honey",
    "hummus",
    "capers",
    "crushed tomatoes"
  ],
  "Frozen": [
    "frozen peas and carrots"
  ],
  "Pantry": [
    "tortilla chips",
    "parmesan cheese",
    "nuts",
    "chocolate chips",
    "chia seeds"
  ]
};

// Add this check to verify the module loads correctly
console.log("Ingredients data loaded with categories:", Object.keys(ingredientCategories));