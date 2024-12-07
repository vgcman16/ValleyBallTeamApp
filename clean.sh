#!/bin/bash

echo "Cleaning React Native iOS build..."

# Kill any existing Metro processes
echo "Killing any existing Metro processes..."
pkill -f "react-native start" || true
pkill -f "metro" || true

# Clean Xcode derived data
echo "Cleaning Xcode derived data..."
rm -rf ~/Library/Developer/Xcode/DerivedData/VolleyballTeamApp-*

# Clean React Native caches
echo "Cleaning React Native caches..."
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf ~/Library/Caches/com.facebook.ReactNativeBuild
rm -rf "$PWD/../node_modules/.cache"
rm -rf "$PWD/build"

# Clean Pod cache
echo "Cleaning Pod cache..."
rm -rf "$PWD/Pods"
rm -f "$PWD/Podfile.lock"

# Clean Metro bundler cache
echo "Cleaning Metro bundler cache..."
rm -rf "$PWD/../node_modules/.cache/metro"
rm -rf "$PWD/../node_modules/.cache/metro-*"
rm -rf "$PWD/../node_modules/.cache/babel-loader"

# Reinstall pods
echo "Reinstalling pods..."
pod deintegrate
pod cache clean --all
pod install

echo "Clean complete. Please rebuild your project in Xcode."
