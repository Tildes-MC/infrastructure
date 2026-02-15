#!/bin/bash
set -e

echo "Starting deployment..."

# Navigate to app directory
cd "$(dirname -- "$0")"

# Pull latest code
echo "Pulling latest code from git..."
git fetch origin
git reset --hard origin/main

# Install dependencies
echo "Installing dependencies..."
yarn install

# Build the application
echo "Building Next.js application..."
yarn build

# Restart the systemd service
echo "Restarting Next.js service..."
sudo /bin/systemctl restart nextjs

echo "Deployment completed successfully!"
