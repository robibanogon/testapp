const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// API Routes

// Get all categories
app.get('/api/categories', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categories ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get all products or filter by category
app.get('/api/products', async (req, res) => {
    try {
        const { category_id } = req.query;
        let query = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
        `;
        let params = [];
        
        if (category_id) {
            query += ' WHERE p.category_id = $1';
            params.push(category_id);
        }
        
        query += ' ORDER BY p.created_at DESC';
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get single product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `SELECT p.*, c.name as category_name 
             FROM products p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE p.id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Create a new order
app.post('/api/orders', async (req, res) => {
    const client = await db.pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { customer_name, customer_email, customer_phone, shipping_address, items } = req.body;
        
        // Validate input
        if (!customer_name || !customer_email || !shipping_address || !items || items.length === 0) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Calculate total amount
        let total_amount = 0;
        for (const item of items) {
            const productResult = await client.query(
                'SELECT price, stock_quantity FROM products WHERE id = $1',
                [item.product_id]
            );
            
            if (productResult.rows.length === 0) {
                throw new Error(`Product ${item.product_id} not found`);
            }
            
            const product = productResult.rows[0];
            
            if (product.stock_quantity < item.quantity) {
                throw new Error(`Insufficient stock for product ${item.product_id}`);
            }
            
            total_amount += product.price * item.quantity;
        }
        
        // Create order
        const orderResult = await client.query(
            `INSERT INTO orders (customer_name, customer_email, customer_phone, shipping_address, total_amount, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [customer_name, customer_email, customer_phone, shipping_address, total_amount, 'pending']
        );
        
        const order = orderResult.rows[0];
        
        // Create order items and update stock
        for (const item of items) {
            const productResult = await client.query(
                'SELECT price FROM products WHERE id = $1',
                [item.product_id]
            );
            
            const price = productResult.rows[0].price;
            
            await client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price)
                 VALUES ($1, $2, $3, $4)`,
                [order.id, item.product_id, item.quantity, price]
            );
            
            // Update stock
            await client.query(
                'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }
        
        await client.query('COMMIT');
        res.status(201).json({ message: 'Order created successfully', order });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message || 'Failed to create order' });
    } finally {
        client.release();
    }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const orderResult = await db.query(
            'SELECT * FROM orders WHERE id = $1',
            [id]
        );
        
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const order = orderResult.rows[0];
        
        const itemsResult = await db.query(
            `SELECT oi.*, p.name as product_name, p.image_url
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = $1`,
            [id]
        );
        
        order.items = itemsResult.rows;
        
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Made with Bob
