# How the Gadget Store E-commerce Website Works on Mac

## Overview

This is a full-stack e-commerce website that runs locally on your Mac. Here's how all the pieces work together:

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Your Mac                              │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐    ┌─────────────┐ │
│  │   Browser    │◄────►│ Node.js      │◄──►│ PostgreSQL  │ │
│  │ (Frontend)   │      │ Server       │    │ Database    │ │
│  │ localhost:   │      │ (Backend)    │    │             │ │
│  │   3000       │      │ Express.js   │    │ Port 5432   │ │
│  └──────────────┘      └──────────────┘    └─────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components Explained

### 1. **PostgreSQL Database** (Data Storage)

**What it does:**
- Stores all product information (name, price, description, stock)
- Stores customer orders
- Manages product categories
- Keeps track of order items

**How it works on Mac:**
- Runs as a background service (daemon)
- Listens on port 5432
- Stores data in files on your Mac's hard drive
- Can be accessed via command-line (`psql`) or GUI tools

**Database Tables:**
- `categories` - Product categories (Smartphones, Laptops, etc.)
- `products` - All products with prices and stock
- `orders` - Customer orders with shipping info
- `order_items` - Individual items in each order

### 2. **Node.js + Express Server** (Backend)

**What it does:**
- Handles requests from the browser
- Communicates with the PostgreSQL database
- Provides API endpoints for products, categories, and orders
- Serves the HTML/CSS/JS files to the browser

**How it works:**
- Runs on port 3000 (http://localhost:3000)
- Written in JavaScript using Express.js framework
- Processes HTTP requests (GET, POST)
- Returns JSON data or HTML pages

**API Endpoints:**
```
GET  /api/products          → Get all products
GET  /api/products/:id      → Get single product
GET  /api/categories        → Get all categories
POST /api/orders            → Create new order
GET  /api/orders/:id        → Get order details
```

### 3. **Frontend** (What You See)

**What it does:**
- Displays products in a nice layout
- Handles shopping cart (stored in browser)
- Allows filtering by category
- Processes checkout form

**Technologies:**
- HTML - Structure of pages
- CSS - Styling and layout
- JavaScript - Interactivity and API calls

**Pages:**
- `index.html` - Home page with featured products
- `products.html` - All products with category filter
- `cart.html` - Shopping cart
- `checkout.html` - Order form

## How Data Flows

### Example: Adding a Product to Cart

```
1. User clicks "Add to Cart" button
   ↓
2. JavaScript function addToCart() runs
   ↓
3. Product info saved to browser's localStorage
   ↓
4. Cart count updates in navigation bar
   ↓
5. Notification appears confirming addition
```

### Example: Placing an Order

```
1. User fills out checkout form
   ↓
2. JavaScript sends POST request to /api/orders
   ↓
3. Express server receives the request
   ↓
4. Server validates the data
   ↓
5. Server checks product stock in PostgreSQL
   ↓
6. Server creates order in database
   ↓
7. Server updates product stock quantities
   ↓
8. Server sends success response
   ↓
9. Browser shows success message
   ↓
10. Cart is cleared
```

## File Structure Explained

```
testapp/
├── server.js              # Main server file - starts Express
├── package.json           # Lists all dependencies
├── .env                   # Configuration (database password, etc.)
│
├── database/
│   ├── db.js             # Database connection setup
│   └── schema.sql        # Database structure + sample data
│
├── public/               # Frontend files (served to browser)
│   ├── index.html        # Home page
│   ├── products.html     # Products listing
│   ├── cart.html         # Shopping cart
│   ├── checkout.html     # Checkout form
│   ├── styles.css        # All styling
│   └── app.js            # Cart management functions
│
└── setup-database.js     # Automated database setup script
```

## How to Run It on Mac

### Step 1: Install Prerequisites

You need three things installed:

1. **Node.js** - JavaScript runtime
   - Check: `node --version`
   - Install: Download from nodejs.org

2. **PostgreSQL** - Database
   - Check: `psql --version`
   - Install: Use Homebrew or Postgres.app

3. **npm** - Package manager (comes with Node.js)
   - Check: `npm --version`

### Step 2: Install Dependencies

```bash
cd /Users/robi/Documents/GitHub/testapp
npm install
```

This installs:
- `express` - Web server framework
- `pg` - PostgreSQL client for Node.js
- `cors` - Allows cross-origin requests
- `dotenv` - Loads environment variables
- `body-parser` - Parses request bodies

### Step 3: Configure Database

```bash
cp .env.example .env
nano .env  # or use any text editor
```

Set your database credentials:
```
DB_USER=robi          # Your Mac username
DB_PASSWORD=          # Leave empty for local setup
DB_NAME=gadget_store
```

### Step 4: Create and Setup Database

```bash
npm run setup-db
```

This script:
1. Connects to PostgreSQL
2. Creates `gadget_store` database
3. Creates 4 tables
4. Inserts 5 categories
5. Inserts 10 sample products

### Step 5: Start the Server

```bash
npm start
```

You'll see:
```
Server is running on http://localhost:3000
Connected to PostgreSQL database
```

### Step 6: Open in Browser

Go to: http://localhost:3000

## What Happens When You Visit the Site

1. **Browser requests** `http://localhost:3000`
2. **Express server** receives the request
3. **Server sends** `public/index.html` file
4. **Browser loads** HTML, CSS, and JavaScript
5. **JavaScript makes** API call to `/api/categories`
6. **Server queries** PostgreSQL database
7. **Database returns** category data
8. **Server sends** JSON response to browser
9. **JavaScript displays** categories on page
10. **Same process** repeats for products

## Shopping Cart Explained

The shopping cart uses **localStorage** (browser storage):

```javascript
// Cart is stored as JSON in browser
localStorage.setItem('cart', JSON.stringify([
  { id: 1, name: "iPhone 15 Pro", price: 999.99, quantity: 1 },
  { id: 3, name: "MacBook Pro", price: 1999.99, quantity: 1 }
]));
```

**Benefits:**
- No database needed for cart
- Persists across page refreshes
- Fast and simple
- Works offline

**Limitations:**
- Stored only in your browser
- Cleared if you clear browser data
- Not shared across devices

## Order Processing Flow

When you place an order:

1. **Validation** - Server checks all required fields
2. **Stock Check** - Verifies products are in stock
3. **Transaction** - Uses database transaction for safety
4. **Create Order** - Inserts order record
5. **Add Items** - Inserts order items
6. **Update Stock** - Decreases product quantities
7. **Commit** - Saves all changes
8. **Response** - Sends order confirmation

If anything fails, the entire transaction is rolled back (nothing is saved).

## Development vs Production

**Current Setup (Development):**
- Runs on localhost
- Database on your Mac
- No security (no HTTPS)
- Sample data included

**For Production (Real Website):**
- Would need a hosting service
- Remote database server
- HTTPS encryption
- Payment gateway integration
- User authentication
- Email notifications

## Troubleshooting on Mac

### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### PostgreSQL Not Running
```bash
# Check status
brew services list

# Start it
brew services start postgresql@15
```

### Can't Connect to Database
```bash
# Test connection
psql -d gadget_store

# If it works, check your .env file
```

### Changes Not Showing
- Hard refresh browser: `Cmd + Shift + R`
- Clear browser cache
- Restart the server

## Security Notes

**Current Setup:**
- No user authentication
- No password hashing
- No input sanitization
- No HTTPS

**This is fine for local development but NOT for production!**

## Next Steps

To make this production-ready, you'd need:
1. User authentication (login/signup)
2. Password encryption
3. Payment gateway (Stripe, PayPal)
4. Email notifications
5. Admin panel
6. Deploy to cloud (Heroku, AWS, etc.)
7. Use environment-specific configs
8. Add security middleware
9. Implement rate limiting
10. Add logging and monitoring

## Questions?

- Check [`SETUP_GUIDE.md`](SETUP_GUIDE.md) for installation help
- Check [`README.md`](README.md) for general documentation
- Check [`INSTALL_POSTGRESQL.md`](INSTALL_POSTGRESQL.md) for PostgreSQL setup