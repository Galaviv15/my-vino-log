#!/bin/bash
###Run this script from root directory with: ./scripts/start-backend.sh


echo "🚀 Starting Spring Boot Backend..."

# Load environment variables from .env file
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env..."
    export $(grep -v '^#' .env | xargs)
    echo "✅ Environment variables loaded"
else
    echo "⚠️  No .env file found in current directory"
fi

# Check if port 8080 is in use
PORT=8080
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

# Navigate to backend directory (adjust path as needed)
cd backend

# Check if mvnw exists, otherwise use mvn
if [ -f "./mvnw" ]; then
    echo "📦 Starting application with Maven Wrapper..."
    ./mvnw spring-boot:run
else
    echo "📦 Starting application with Maven..."
    mvn spring-boot:run
fi