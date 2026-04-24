import { Router } from 'express'
import { dbSchema, pool } from '../db.js'

const router = Router()

function mapProduct(row) {
  return {
    id: row.product_id,
    name: row.product_name,
    category: row.category,
    unit: row.unit,
    description: row.description || '',
    items: Number(row.quantity || 0),
    updates: row.last_update || 'Recently added product',
    imageUrl: row.image_url || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

router.get('/', async (_req, res) => {
  const result = await pool.query(
    `SELECT product_id, product_name, category, unit, quantity, description, last_update, image_url, created_at, updated_at
     FROM ${dbSchema}.products
     ORDER BY created_at DESC, product_id DESC`,
  )

  res.json({ products: result.rows.map(mapProduct) })
})

router.post('/', async (req, res) => {
  const { name, category, unit, items, description, updates, imageUrl } = req.body

  const result = await pool.query(
    `INSERT INTO ${dbSchema}.products
      (product_name, category, unit, quantity, description, last_update, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING product_id, product_name, category, unit, quantity, description, last_update, image_url, created_at, updated_at`,
    [name, category, unit, Number(items || 0), description || '', updates || 'Recently added product', imageUrl || ''],
  )

  res.status(201).json({ product: mapProduct(result.rows[0]) })
})

router.put('/:id', async (req, res) => {
  const { name, category, unit, items, description, updates, imageUrl } = req.body

  const result = await pool.query(
    `UPDATE ${dbSchema}.products
     SET product_name = $1,
         category = $2,
         unit = $3,
         quantity = $4,
         description = $5,
         last_update = $6,
         image_url = $7,
         updated_at = CURRENT_TIMESTAMP
     WHERE product_id = $8
     RETURNING product_id, product_name, category, unit, quantity, description, last_update, image_url, created_at, updated_at`,
    [name, category, unit, Number(items || 0), description || '', updates || 'Product updated', imageUrl || '', Number(req.params.id)],
  )

  if (!result.rows.length) {
    return res.status(404).json({ message: 'Product not found' })
  }

  res.json({ product: mapProduct(result.rows[0]) })
})

router.delete('/:id', async (req, res) => {
  const result = await pool.query(
    `DELETE FROM ${dbSchema}.products
     WHERE product_id = $1
     RETURNING product_id`,
    [Number(req.params.id)],
  )

  if (!result.rows.length) {
    return res.status(404).json({ message: 'Product not found' })
  }

  res.json({ success: true })
})

export default router
