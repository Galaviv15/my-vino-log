#!/bin/bash
###Run this script from root directory with: ./scripts/start-frontend.sh


echo "⚛️  Starting React Frontend..."

# Check if port 5173 is in use
PORT=5173
PID=$(lsof -ti:$PORT)

if [ ! -z "$PID" ]; then
    echo "⚠️  Port $PORT is in use by process $PID"
    echo "🔄 Killing process on port $PORT..."
    kill -9 $PID
    sleep 2
    echo "✅ Port $PORT is now available"
else
    echo "✅ Port $PORT is available"
fi

# Navigate to frontend directory (adjust path as needed)
cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in frontend directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🚀 Starting development server on port $PORT..."
npm run dev