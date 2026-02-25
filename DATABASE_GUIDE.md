# How to View and Manage the PostgreSQL Database on Mac

There are several ways to view and interact with your PostgreSQL database on Mac. Here are the options from easiest to most advanced:

## Option 1: Using psql (Command Line) - Built-in

The `psql` command-line tool comes with PostgreSQL and is the most direct way to interact with your database.

### Connect to the Database

```bash
psql -d gadget_store
```

Or if you need to specify a user:
```bash
psql -U robi -d gadget_store
```

### Basic Commands Once Connected

```sql
-- List all tables
\dt

-- View table structure
\d products
\d orders
\d categories
\d order_items

-- View all products
SELECT * FROM products;

-- View products with their categories
SELECT p.name, p.price, c.name as category 
FROM products p 
JOIN categories c ON p.category_id = c.id;

-- View all orders
SELECT * FROM orders;

-- Count products by category
SELECT c.name, COUNT(p.id) as product_count 
FROM categories c 
LEFT JOIN products p ON c.id = p.category_id 
GROUP BY c.name;

-- View recent orders with customer info
SELECT id, customer_name, customer_email, total_amount, status, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Exit psql
\q
```

### Useful psql Commands

```bash
\l              # List all databases
\dt             # List all tables in current database
\d table_name   # Describe a table structure
\du             # List all users
\c database     # Connect to a different database
\?              # Help with psql commands
\h              # Help with SQL commands
\q              # Quit psql
```

## Option 2: Using Postgres.app (If Installed)

If you installed Postgres.app:

1. **Open Postgres.app**
2. **Double-click** on the `gadget_store` database
3. This opens a `psql` terminal connected to your database
4. Use the SQL commands from Option 1

## Option 3: pgAdmin (GUI Tool) - Recommended for Beginners

pgAdmin is a free, powerful GUI tool for PostgreSQL.

### Install pgAdmin

**Using Homebrew:**
```bash
brew install --cask pgadmin4
```

**Or download from:** https://www.pgadmin.org/download/pgadmin-4-macos/

### Setup pgAdmin

1. **Open pgAdmin 4**
2. **Create a new server connection:**
   - Right-click "Servers" → "Register" → "Server"
   - **General tab:**
     - Name: `Local Gadget Store`
   - **Connection tab:**
     - Host: `localhost`
     - Port: `5432`
     - Database: `gadget_store`
     - Username: `robi` (your Mac username)
     - Password: (leave empty if no password set)
3. **Click Save**

### Using pgAdmin

- **Browse tables:** Servers → Local Gadget Store → Databases → gadget_store → Schemas → public → Tables
- **View data:** Right-click a table → "View/Edit Data" → "All Rows"
- **Run queries:** Click "Query Tool" icon
- **Export data:** Right-click table → "Import/Export"

## Option 4: DBeaver (Universal Database Tool)

DBeaver is a free, universal database tool that works with many databases.

### Install DBeaver

```bash
brew install --cask dbeaver-community
```

Or download from: https://dbeaver.io/download/

### Setup DBeaver

1. **Open DBeaver**
2. **New Connection:**
   - Click "New Database Connection" (plug icon)
   - Select "PostgreSQL"
   - Click "Next"
3. **Connection Settings:**
   - Host: `localhost`
   - Port: `5432`
   - Database: `gadget_store`
   - Username: `robi`
   - Password: (leave empty)
4. **Test Connection** → **Finish**

### Using DBeaver

- **Browse tables:** Navigate in left sidebar
- **View data:** Double-click a table
- **Run queries:** Right-click database → "SQL Editor" → "New SQL Script"
- **ER Diagram:** Right-click database → "View Diagram"

## Option 5: TablePlus (Premium, Beautiful UI)

TablePlus is a modern, native Mac database client (paid, but has free trial).

Download from: https://tableplus.com/

Setup is similar to DBeaver with a more polished interface.

## Option 6: VS Code Extension

You can view the database directly in VS Code!

### Install PostgreSQL Extension

1. Open VS Code
2. Go to Extensions (Cmd+Shift+X)
3. Search for "PostgreSQL" by Chris Kolkman
4. Click Install

### Connect to Database

1. Click the PostgreSQL icon in the sidebar
2. Click "+" to add connection
3. Enter connection details:
   - Host: `localhost`
   - User: `robi`
   - Password: (leave empty)
   - Port: `5432`
   - Database: `gadget_store`
4. Click "Connect"

### Use the Extension

- Browse tables in sidebar
- Right-click table → "Select Top 1000"
- Write and run SQL queries
- View results in VS Code

## Common SQL Queries for Your Database

### View All Products with Stock

```sql
SELECT 
    p.id,
    p.name,
    p.price,
    p.stock_quantity,
    c.name as category
FROM products p
JOIN categories c ON p.category_id = c.id
ORDER BY p.name;
```

### View Products Running Low on Stock

```sql
SELECT name, stock_quantity, price
FROM products
WHERE stock_quantity < 30
ORDER BY stock_quantity;
```

### View All Orders with Details

```sql
SELECT 
    o.id,
    o.customer_name,
    o.customer_email,
    o.total_amount,
    o.status,
    o.created_at,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id
ORDER BY o.created_at DESC;
```

### View Order Details with Products

```sql
SELECT 
    o.id as order_id,
    o.customer_name,
    p.name as product_name,
    oi.quantity,
    oi.price,
    (oi.quantity * oi.price) as subtotal
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.id = 1;  -- Change to your order ID
```

### Sales Summary by Category

```sql
SELECT 
    c.name as category,
    COUNT(DISTINCT oi.order_id) as orders,
    SUM(oi.quantity) as units_sold,
    SUM(oi.quantity * oi.price) as revenue
FROM categories c
JOIN products p ON c.id = p.category_id
JOIN order_items oi ON p.id = oi.product_id
GROUP BY c.name
ORDER BY revenue DESC;
```

### Top Selling Products

```sql
SELECT 
    p.name,
    SUM(oi.quantity) as units_sold,
    SUM(oi.quantity * oi.price) as revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name
ORDER BY units_sold DESC
LIMIT 10;
```

## Modifying Data

### Add a New Product

```sql
INSERT INTO products (name, description, price, category_id, image_url, stock_quantity)
VALUES (
    'New Gadget',
    'Amazing new gadget description',
    299.99,
    1,  -- category_id (1 = Smartphones)
    'https://via.placeholder.com/300x300?text=New+Gadget',
    100
);
```

### Update Product Price

```sql
UPDATE products
SET price = 899.99
WHERE id = 1;
```

### Update Stock Quantity

```sql
UPDATE products
SET stock_quantity = stock_quantity + 50
WHERE id = 1;
```

### Delete a Product

```sql
DELETE FROM products
WHERE id = 10;
```

### Update Order Status

```sql
UPDATE orders
SET status = 'shipped'
WHERE id = 1;
```

## Database Backup and Restore

### Backup Database

```bash
# Backup entire database
pg_dump -U robi gadget_store > backup.sql

# Backup with timestamp
pg_dump -U robi gadget_store > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
# Drop and recreate database
dropdb gadget_store
createdb gadget_store

# Restore from backup
psql -U robi -d gadget_store < backup.sql
```

### Backup Specific Table

```bash
pg_dump -U robi -t products gadget_store > products_backup.sql
```

## Database Maintenance

### View Database Size

```sql
SELECT 
    pg_size_pretty(pg_database_size('gadget_store')) as database_size;
```

### View Table Sizes

```sql
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Vacuum Database (Cleanup)

```sql
VACUUM ANALYZE;
```

## Quick Reference Card

```bash
# Connect to database
psql -d gadget_store

# Inside psql:
\dt                          # List tables
\d products                  # Describe products table
SELECT * FROM products;      # View all products
\q                          # Quit

# Backup
pg_dump gadget_store > backup.sql

# Restore
psql -d gadget_store < backup.sql

# Check if PostgreSQL is running
brew services list
```

## Troubleshooting

### Can't connect to database

```bash
# Check if PostgreSQL is running
brew services list

# Start PostgreSQL
brew services start postgresql@15

# Check if database exists
psql -l
```

### Permission denied

```bash
# Try connecting with your Mac username
psql -U robi -d gadget_store

# Or check your .env file settings
```

### Database doesn't exist

```bash
# Create it
createdb gadget_store

# Then run setup
npm run setup-db
```

## Recommended Setup for Development

**For beginners:** Use pgAdmin or DBeaver (GUI tools)
**For developers:** Use psql command line + VS Code extension
**For quick checks:** Use psql command line

## Next Steps

1. Install a GUI tool (pgAdmin or DBeaver)
2. Connect to your database
3. Browse the tables and data
4. Try running some of the SQL queries above
5. Experiment with adding/modifying data

Remember: You can always reset your database by running:
```bash
npm run setup-db
```

This will drop all tables and recreate them with fresh sample data.