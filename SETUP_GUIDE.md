# Step-by-Step Setup Guide

Follow these steps to install PostgreSQL and set up the Gadget Store application.

## Step 1: Install Homebrew

Open Terminal and run this command:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Important:** 
- You'll be prompted for your password
- Follow the on-screen instructions
- After installation, you may need to add Homebrew to your PATH (the installer will tell you how)

To verify Homebrew is installed:
```bash
brew --version
```

## Step 2: Install PostgreSQL

Once Homebrew is installed, run:

```bash
brew install postgresql@15
```

## Step 3: Start PostgreSQL

Start the PostgreSQL service:

```bash
brew services start postgresql@15
```

## Step 4: Add PostgreSQL to PATH

Add PostgreSQL to your PATH so you can use `psql` command:

```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Verify it works:
```bash
psql --version
```

## Step 5: Install Node.js Dependencies

Navigate to the project directory and install dependencies:

```bash
cd /Users/robi/Documents/GitHub/testapp
npm install
```

## Step 6: Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file (you can use `nano .env` or any text editor):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gadget_store
DB_USER=robi
DB_PASSWORD=

PORT=3000
```

**Note:** 
- Use your macOS username (robi) as DB_USER
- Leave DB_PASSWORD empty (Homebrew PostgreSQL doesn't require a password by default)

## Step 7: Setup Database

Run the automated setup script:

```bash
npm run setup-db
```

This will:
- Create the `gadget_store` database
- Create all tables
- Insert sample data

## Step 8: Start the Application

Start the server:

```bash
npm start
```

## Step 9: Access the Application

Open your browser and go to:

```
http://localhost:3000
```

You should see the Gadget Store homepage!

## Troubleshooting

### If Homebrew installation fails

Try installing Postgres.app instead (easier, no terminal needed):
1. Download from https://postgresapp.com/
2. Move to Applications folder
3. Open and click "Initialize"
4. Add to PATH: `export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"`

### If "psql: command not found" after installation

Make sure you've added PostgreSQL to your PATH and reloaded your shell:
```bash
source ~/.zshrc
```

### If database connection fails

Check if PostgreSQL is running:
```bash
brew services list
```

If it's not running, start it:
```bash
brew services start postgresql@15
```

### If setup-db script fails

Try creating the database manually:
```bash
createdb gadget_store
psql -d gadget_store -f database/schema.sql
```

## Quick Commands Reference

```bash
# Check PostgreSQL status
brew services list

# Start PostgreSQL
brew services start postgresql@15

# Stop PostgreSQL
brew services stop postgresql@15

# Restart PostgreSQL
brew services restart postgresql@15

# Connect to database
psql -d gadget_store

# Start the app
npm start

# Start the app with auto-reload (development)
npm run dev
```

## Need Help?

If you encounter any issues:
1. Make sure PostgreSQL is running: `brew services list`
2. Check your `.env` file configuration
3. Verify Node.js is installed: `node --version`
4. Check the error messages carefully - they usually indicate what's wrong