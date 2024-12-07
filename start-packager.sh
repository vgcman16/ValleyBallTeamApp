#!/bin/bash

# Exit on error
set -e

# Check if node_modules directory exists
if [ ! -d "$PROJECT_DIR/../node_modules" ]; then
  echo "Error: node_modules directory not found. Please run 'yarn install' or 'npm install' first."
  exit 1
fi

# Set Metro port
METRO_PORT=8081

# Function to check if port is in use
check_port() {
  if lsof -i :$1 > /dev/null 2>&1; then
    return 0  # Port is in use
  else
    return 1  # Port is free
  fi
}

# Check if Metro is already running on the correct port
if check_port $METRO_PORT; then
  METRO_PID=$(lsof -i :$METRO_PORT -t)
  echo "Metro is already running on port $METRO_PORT (PID: $METRO_PID)"
  
  # Verify it's actually Metro and not another process
  if ps -p $METRO_PID | grep -q "node"; then
    echo "Confirmed Metro process is running"
    exit 0
  else
    echo "Warning: Port $METRO_PORT is in use by another process. Attempting to kill it..."
    kill -9 $METRO_PID || true
    sleep 2
  fi
fi

# Set up the path to Metro
export NODE_BINARY="${NODE_BINARY:-node}"
export REACT_NATIVE_PATH="$PROJECT_DIR/../node_modules/react-native"
CLI_PATH="$PROJECT_DIR/../node_modules/react-native/cli.js"
METRO_CONFIG="$PROJECT_DIR/../metro.config.js"

# Start Metro in the background
echo "Starting Metro Bundler on port $METRO_PORT..."
"$NODE_BINARY" "$CLI_PATH" start --port $METRO_PORT --config "$METRO_CONFIG" &

# Wait and verify Metro has started
MAX_RETRIES=10
RETRY_COUNT=0

while ! check_port $METRO_PORT; do
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "Error: Metro failed to start after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Waiting for Metro to start..."
  sleep 1
  RETRY_COUNT=$((RETRY_COUNT + 1))
done

echo "Metro Bundler is running on port $METRO_PORT"
