import { writable } from 'svelte/store';

// Function to parse CSV content
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const products = new Map(); // Use Map to handle duplicates
  
  for (let i = 1; i < lines.length; i++) {
    const [name, category, unit] = lines[i].split(',').map(s => s.trim());
    
    // Skip empty lines
    if (!name) continue;

    // Create a unique ID from the name
    const id = name.toLowerCase()
      .replace(/\([^)]*\)/g, '') // Remove parentheses and their contents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes

    // If product already exists, update it instead of creating duplicate
    if (products.has(id)) {
      const existing = products.get(id);
      // Merge any new information if needed
      products.set(id, {
        ...existing,
        varieties: [...new Set([...existing.varieties, name])]
      });
    } else {
      products.set(id, {
        id,
        name: name.split('(')[0].trim(), // Remove variety info from name
        category: category.toLowerCase(),
        unit: unit.toLowerCase(),
        boxSize: unit.includes('kg') ? null : '1 piece',
        varieties: [name] // Store full name including variety as a variety
      });
    }
  }

  return Array.from(products.values());
}

// Example CSV content - Replace this with your data
const csvContent = `Name,Category,Unit
Product1,fruits,kg
Product2,vegetables,piece
`; // You'll replace this with your actual data

// Parse and export products
export const allProducts = parseCSV(csvContent);

// Create and export the store
export const productsStore = writable(allProducts);

// Log the total number of unique products
console.log(`Imported ${allProducts.length} unique products`);