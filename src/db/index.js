import { createClient } from '@libsql/client';

const db = createClient({
  url: 'file:marketplace.db',
});

export async function getUser(email) {
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email]
  });
  return result.rows[0];
}

export async function createUser(userData) {
  const {
    email, password, role, name, companyName, vatNumber,
    street, city, state, country, postalCode
  } = userData;

  const result = await db.execute({
    sql: `
      INSERT INTO users (
        email, password, role, name, company_name, vat_number,
        street, city, state, country, postal_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      email, password, role, name, companyName, vatNumber,
      street, city, state, country, postalCode
    ]
  });

  return result.lastInsertRowid;
}

export async function getAuthorizedProducts(userId) {
  const result = await db.execute({
    sql: `
      SELECT p.*, v.name as variety_name
      FROM products p
      LEFT JOIN product_varieties v ON v.product_id = p.id
      INNER JOIN authorized_products ap ON ap.product_id = p.id
      WHERE ap.user_id = ?
    `,
    args: [userId]
  });
  return result.rows;
}

export async function createOffer(offerData) {
  const {
    producerId,
    weekNumber,
    description,
    status,
    products
  } = offerData;

  // Start a transaction
  await db.transaction(async (tx) => {
    // Insert main offer
    const offerResult = await tx.execute({
      sql: `
        INSERT INTO offers (
          producer_id, week_number, description, status
        ) VALUES (?, ?, ?, ?)
      `,
      args: [producerId, weekNumber, description, status]
    });

    const offerId = offerResult.lastInsertRowid;

    // Insert each product and its daily quantities
    for (const product of products) {
      const productResult = await tx.execute({
        sql: `
          INSERT INTO offer_products (
            offer_id, product_id, variety, price, total_quantity
          ) VALUES (?, ?, ?, ?, ?)
        `,
        args: [
          offerId,
          product.produceName,
          product.variety,
          product.price,
          product.totalQuantity
        ]
      });

      const productId = productResult.lastInsertRowid;

      // Insert daily quantities
      for (const [day, quantity] of Object.entries(product.dailyQuantities)) {
        await tx.execute({
          sql: `
            INSERT INTO daily_quantities (
              offer_product_id, day_of_week, quantity
            ) VALUES (?, ?, ?)
          `,
          args: [productId, day, quantity]
        });
      }
    }
  });
}

export async function getOffers(filters = {}) {
  let sql = `
    SELECT 
      o.*,
      u.company_name as producer_name,
      json_group_array(
        json_object(
          'id', op.id,
          'produceName', op.product_id,
          'variety', op.variety,
          'price', op.price,
          'totalQuantity', op.total_quantity,
          'dailyQuantities', (
            SELECT json_group_object(day_of_week, quantity)
            FROM daily_quantities
            WHERE offer_product_id = op.id
          )
        )
      ) as products
    FROM offers o
    INNER JOIN users u ON u.id = o.producer_id
    LEFT JOIN offer_products op ON op.offer_id = o.id
  `;

  const conditions = [];
  const args = [];

  if (filters.producerId) {
    conditions.push('o.producer_id = ?');
    args.push(filters.producerId);
  }

  if (filters.status) {
    conditions.push('o.status = ?');
    args.push(filters.status);
  }

  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' GROUP BY o.id ORDER BY o.created_at DESC';

  const result = await db.execute({ sql, args });
  return result.rows.map(offer => ({
    ...offer,
    products: JSON.parse(offer.products)
  }));
}

export async function updateOfferStatus(offerId, status, feedback = null) {
  return db.execute({
    sql: `
      UPDATE offers 
      SET status = ?, feedback = ?, reviewed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
    args: [status, feedback, offerId]
  });
}

export async function deleteOffer(offerId) {
  return db.execute({
    sql: 'DELETE FROM offers WHERE id = ?',
    args: [offerId]
  });
}