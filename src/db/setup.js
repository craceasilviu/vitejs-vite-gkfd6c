import { createClient } from '@libsql/client';

const db = createClient({
  url: 'file:marketplace.db',
});

// Create tables
await db.execute(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    company_name TEXT,
    vat_number TEXT,
    street TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Products table
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    box_size TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Product varieties
  CREATE TABLE IF NOT EXISTS product_varieties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  -- Authorized products for producers
  CREATE TABLE IF NOT EXISTS authorized_products (
    user_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    authorized_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  -- Certifications
  CREATE TABLE IF NOT EXISTS certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    number TEXT NOT NULL,
    valid_until DATE NOT NULL,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Offers
  CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producer_id INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    FOREIGN KEY (producer_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Offer products
  CREATE TABLE IF NOT EXISTS offer_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    offer_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    variety TEXT,
    price DECIMAL(10,2) NOT NULL,
    total_quantity DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  -- Daily quantities for offer products
  CREATE TABLE IF NOT EXISTS daily_quantities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    offer_product_id INTEGER NOT NULL,
    day_of_week TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (offer_product_id) REFERENCES offer_products(id) ON DELETE CASCADE
  );
`);