/**
 * Data file containing kitchen appliance categories
 * Used for the user profile to track which appliances are available
 * This affects which recipes can be suggested based on required equipment
 */
export const applianceCategories = {
  // Basic kitchen equipment most homes have
  "Basic Equipment": [
    "Stove",   // For stovetop cooking
    "Oven",          // For baking and roasting
    "Microwave",     // For quick heating and defrosting
    "Refrigerator",  // For cold storage
    "Freezer"        // For frozen storage
  ],
  
  // Smaller countertop appliances
  "Small Appliances": [
    "Toaster",        // For toasting bread
    "Blender",        // For pureeing and smoothies
    "Food Processor", // For chopping and mixing
    "Stand Mixer",    // For baking and dough
    "Hand Mixer",     // Portable alternative to stand mixer
    "Coffee Maker",   // For brewing coffee
    "Electric Kettle", // For boiling water quickly
    "Hot Plate"        // For additional cooking surface
  ],
  
  // Less common specialized appliances
  "Specialty Appliances": [
    "Crock Pot",     // For slow, low-heat cooking
    "Pressure Cooker", // For fast pressure cooking
    "Air Fryer",                  // For oil-free "frying"
    "Rice Cooker",                // For perfect rice
    "Waffle Maker",               // For waffles
    "Bread Machine",              // For homemade bread
    "Juicer"                      // For extracting juice
  ],
  
  // Cookware items for different cooking methods
  "Cookware": [
    "Frying Pan/Skillet", // For sautéing and frying
    "Saucepan",           // For sauces and small batches
    "Dutch Oven",         // For stews and braises
    "Baking Sheet",       // For cookies and roasting
    "Casserole Dish",     // For baked dishes
    "Grill Pan"           // For indoor grilling
  ],
  
  // Essential kitchen tools
  "Tools": [
    "Chef's Knife",        // For general cutting
    "Cutting Board",       // For food preparation
    "Measuring Cups/Spoons", // For precise measurements
    "Mixing Bowls",        // For combining ingredients
    "Whisk",               // For beating and blending
    "Spatula",             // For turning and scraping
    "Tongs"                // For gripping and flipping
  ]
};
