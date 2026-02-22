#!/bin/bash
# Development setup script

echo "🍷 Setting up Vindex Wine Cellar..."

# Create necessary directories
mkdir -p backend/src/main/java/com/vindex/{config,entity,repository,service,controller,dto,security}
mkdir -p backend/src/main/resources/db/migration
mkdir -p frontend/src/{components,pages,services,store,i18n/locales}
mkdir -p frontend/public

echo "✅ Directory structure created"

# Backend setup
cd backend
echo "📦 Installing backend dependencies..."
mvn clean install -q 2>/dev/null || echo "Note: Maven not installed, will use Docker"
cd ..

# Frontend setup
cd frontend
echo "📦 Installing frontend dependencies..."
npm install 2>/dev/null || echo "Note: Node not installed, will use container"
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start development:"
echo ""
echo "Option 1 (Docker - Recommended):"
echo "  docker-compose up -d"
echo ""
echo "Option 2 (Local - requires Java 21, Maven, Node 18+):"
echo "  Terminal 1: cd backend && mvn spring-boot:run"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "📖 For more info, see README.md"
