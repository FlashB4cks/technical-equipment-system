#!/bin/bash

# Oracle Cloud Server Setup Script
# Tested on Ubuntu 22.04 LTS (Ampere/AMD)
# Usage: ./setup_oci_server.sh on the REMOTE SERVER

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting Server Setup...${NC}"

# 1. Update System
echo -e "${GREEN}[1/5] Updating and Upgrading System...${NC}"
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential libssl-dev nginx postgresql postgresql-contrib ufw

# 2. Install Node.js via NVM
echo -e "${GREEN}[2/5] Installing Node.js 20...${NC}"
if [ ! -d "$HOME/.nvm" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

nvm install 20
nvm use 20
nvm alias default 20

# Install PM2 globally
npm install -g pm2

# 3. Configure Firewall
echo -e "${GREEN}[3/5] Configuring Firewall (UFW)...${NC}"
echo "Allowing Nginx Full and OpenSSH..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
# Note: We won't enable UFW automatically to prevent accidental lockout if SSH isn't allowed properly.
# The user should enable it manually after verification.
echo "UFW rules added. Please enable UFW manually with 'sudo ufw enable' after verifying SSH access."

# 4. Configure PostgreSQL
echo -e "${GREEN}[4/5] Setting up PostgreSQL...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Automated Setup for DB User and Database
DB_USER="flashback"
DB_NAME="technical_equipment"

echo -e "${BLUE}Please enter a password for the new database user '$DB_USER':${NC}"
read -s DB_PASSWORD
echo ""

# Check if user exists
if sudo -u postgres psql -t -c '\du' | cut -d \| -f 1 | grep -qw $DB_USER; then
    echo "User '$DB_USER' already exists."
else
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
    echo "User '$DB_USER' created."
fi

# Check if DB exists
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "Database '$DB_NAME' already exists."
else
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    echo "Database '$DB_NAME' created."
fi

sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

# 5. Application Directory Setup
echo -e "${GREEN}[5/5] Setting up Application Directory...${NC}"
mkdir -p ~/app

echo -e "${BLUE}Setup Complete!${NC}"
echo -e "Node Version: $(node -v)"
echo -e "NPM Version: $(npm -v)"
echo -e "PM2 Version: $(pm2 -v)"
echo -e "PostgreSQL Status: $(systemctl is-active postgresql)"
echo -e "Nginx Status: $(systemctl is-active nginx)"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Upload your project code to ~/app (e.g., using scp or git)"
echo "2. Create/Update .env file in ~/app with DATABASE_URL='postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME'"
echo "3. Run 'npm install' and 'npm run build'"
echo "4. Start with 'pm2 start npm --name \"technical-equipment\" -- start'"
