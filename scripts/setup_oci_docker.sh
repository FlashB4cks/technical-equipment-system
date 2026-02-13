#!/bin/bash

# Oracle Cloud Docker Server Setup Script
# Tested on Ubuntu 22.04 LTS (Ampere/AMD)
# Usage: ./setup_oci_docker.sh on the REMOTE SERVER

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting Docker Server Setup...${NC}"

# 1. Update System
echo -e "${GREEN}[1/4] Updating System...${NC}"
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git ufw

# 2. Install Docker
echo -e "${GREEN}[2/4] Installing Docker...${NC}"
# Add Docker's official GPG key:
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update

# Install Docker packages
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group (avoid sudo for docker commands)
sudo usermod -aG docker $USER
echo "User added to docker group. You may need to log out and back in for this to take effect."

# 3. Configure Firewall
echo -e "${GREEN}[3/4] Configuring Firewall...${NC}"
# Allow SSH
sudo ufw allow OpenSSH
# Allow HTTP/HTTPS (if you plan to use a reverse proxy or expose ports)
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
# Don't enable automatically to prevent lockout
echo "UFW configured. Run 'sudo ufw enable' manually after verifying SSH access."

# 4. Application Directory Setup
echo -e "${GREEN}[4/4] Setting up Application Directory...${NC}"
mkdir -p ~/app

echo -e "${BLUE}Setup Complete!${NC}"
echo -e "Docker Version: $(docker --version)"
echo -e "Docker Compose Version: $(docker compose version)"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Log out and log back in to apply docker group changes."
echo "2. Upload project code to ~/app"
echo "3. Create .env file in ~/app"
echo "4. Run 'docker compose up -d --build'"
