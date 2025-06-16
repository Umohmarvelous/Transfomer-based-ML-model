#!/bin/bash
echo "Starting build process..."
echo "Current directory: $(pwd)"
echo "Listing contents:"
ls -la

echo "Installing dependencies..."
npm install

echo "Running build..."
npm run build

echo "Build process completed." 