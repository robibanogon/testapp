# PostgreSQL Installation Guide

Since you don't have PostgreSQL installed, here are the easiest ways to install it on macOS:

## Option 1: Postgres.app (Recommended - Easiest)

This is the simplest way to get PostgreSQL running on macOS.

1. **Download Postgres.app**
   - Visit: https://postgresapp.com/
   - Download the latest version
   - Move it to your Applications folder

2. **Launch Postgres.app**
   - Open Postgres.app from Applications
   - Click "Initialize" to create a new server
   - The app will start automatically

3. **Add to PATH**
   - Open Terminal
   - Edit your shell profile:
     ```bash
     nano ~/.zshrc
     ```
   - Add this line at the end:
     ```bash
     export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
     ```
   - Save (Ctrl+O, Enter, Ctrl+X)
   - Reload your shell:
     ```bash
     source ~/.zshrc
     ```

4. **Verify Installation**
   ```bash
   psql --version
   ```

## Option 2: Install Homebrew First, Then PostgreSQL

1. **Install Homebrew** (if not installed)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install PostgreSQL**
   ```bash
   brew install postgresql@15
   ```

3. **Start PostgreSQL**
   ```bash
   brew services start postgresql@15
   ```

4. **Add to PATH**
   ```bash
   echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

## Option 3: Official PostgreSQL Installer

1. Download from: https://www.postgresql.org/download/macosx/
2. Run the installer
3. Follow the installation wizard
4. Remember the password you set for the postgres user

## After Installing PostgreSQL

Once PostgreSQL is installed, return to the main README.md and follow the setup instructions.

### Quick Setup (After PostgreSQL is installed)

```bash
# 1. Install Node.js dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL password

# 3. Setup database (automated)
npm run setup-db

# 4. Start the server
npm start
```

Then visit: http://localhost:3000

## Troubleshooting

### "psql: command not found" after installation

Make sure you've added PostgreSQL to your PATH and reloaded your shell:
```bash
source ~/.zshrc
```

### Connection refused

Make sure PostgreSQL is running:
- **Postgres.app**: Check if the app is running
- **Homebrew**: Run `brew services list` to check status

### Permission denied

You may need to create a postgres user or use your system username:
```bash
# In .env file, try using your macOS username instead of 'postgres'
DB_USER=your_mac_username
```

## Need Help?

If you're still having issues:
1. Check if PostgreSQL is running
2. Verify your .env configuration
3. Try the automated setup script: `npm run setup-db`