# Vindex – Smart Wine Cellar PWA

A professional, mobile-first Progressive Web App (PWA) for managing a personal wine collection. Features visual fridge mapping, AI-powered bottle scanning, and personalized recommendations based on user preferences.

## 📋 Project Structure

```
my-vino-log/
├── backend/                    # Spring Boot 3.x Java Backend
│   ├── src/main/java/com/vindex/
│   │   ├── VindexApplication.java
│   │   ├── config/            # Configuration classes
│   │   │   ├── JwtTokenProvider.java
│   │   │   └── SecurityConfig.java
│   │   ├── entity/            # JPA Entities
│   │   │   ├── User.java
│   │   │   ├── Wine.java
│   │   │   ├── UserPreference.java
│   │   │   ├── FridgeLayout.java
│   │   │   └── WinePosition.java
│   │   ├── security/          # Security filters & auth
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   └── JwtAuthenticationEntryPoint.java
│   │   ├── repository/        # Data access layer (to be added)
│   │   ├── service/           # Business logic (to be added)
│   │   ├── controller/        # REST endpoints (to be added)
│   │   └── dto/               # Data transfer objects (to be added)
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/
│   │       └── V1__Initial_schema.sql
│   └── pom.xml
├── frontend/                   # React 18 TypeScript Frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css          # Tailwind styles
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Header.tsx
│   │   │   └── PrivateRoute.tsx
│   │   ├── pages/             # Page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── OnboardingPage.tsx
│   │   │   ├── CellarGridPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── services/
│   │   │   └── api.ts         # Axios HTTP client
│   │   ├── store/
│   │   │   └── authStore.ts   # Zustand auth state
│   │   └── i18n/
│   │       ├── config.ts      # i18next configuration
│   │       └── locales/
│   │           ├── en.json
│   │           └── he.json
│   ├── public/
│   │   └── manifest.json      # PWA manifest
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── spec.md                    # Project specification
└── README.md                  # This file
```

## 🚀 Phase 1 Deliverables

### ✅ Backend Foundation
- **Spring Boot 3.x** with Java 21
- **Spring Security** with JWT + HttpOnly Cookies
- **Flyway** database migrations
- **MySQL 8.0** (Local installation)
- **Database Schema**: Users, Wines, FridgeLayouts, UserPreferences, WinePositions
- **Configurable JWT**: 1-hour access token, 30-day refresh token

### ✅ Frontend Scaffold
- **React 18** with TypeScript
- **Tailwind CSS** with Wine/Cream color theme
- **i18next** with Hebrew (RTL) and English (LTR) support
- **Zustand** for auth state management
- **Axios** HTTP client with auto-refresh token interceptor
- **Vite** build tool for fast development
- **PWA Ready**: Manifest, icons, app shortcuts

### ✅ Security Architecture
- JWT-based authentication
- HttpOnly cookies for token storage
- CORS configuration
- Protected routes on frontend and backend
- Password encryption with BCrypt

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend Framework** | Spring Boot | 3.2.0 |
| **JDK** | Java | 21 |
| **Database** | MySQL | 8.0 |
| **Database Migrations** | Flyway | Latest |
| **Security** | Spring Security + JWT | JJWT 0.12.3 |
| **Frontend Framework** | React | 18.2.0 |
| **Language** | TypeScript | 5.3.0 |
| **Build Tool** | Vite | 5.0.0 |
| **Styling** | Tailwind CSS | 3.3.0 |
| **State Management** | Zustand | 4.4.0 |
| **Localization** | i18next | 23.7.0 |
| **HTTP Client** | Axios | 1.6.0 |
| **Build Tool (Backend)** | Maven | 3.9+ |

## 📦 Prerequisites

- **Node.js** 18+ (for frontend development)
- **Maven** 3.9+ (for backend development)
- **Java 21 JDK** (for backend development)
- **MySQL 8.0** (local installation)

## 🏃 Quick Start

### Setup MySQL Database

```bash
# Start MySQL service (macOS)
brew services start mysql

# Create database
mysql -u root -p
CREATE DATABASE vino_log;
```

### Local Development

#### Backend Setup

```bash
cd backend

# Set environment variables
export JWT_SECRET="your-secure-secret-key-256-bits-minimum"
export OPENAI_API_KEY="your-openai-key-if-using-ai"

# Build with Maven
mvn clean package

# Run Spring Boot
mvn spring-boot:run
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the project root:

```env
JWT_SECRET=your-256-bit-secret-key-here
SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/vino_log?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=12345678
SERPER_API_KEY=your-serper-api-key
SPRING_AI_GOOGLE_GENAI_API_KEY=your-google-genai-key
```

### Frontend Configuration

The frontend automatically detects language from browser locale and can be overridden in settings. Language preference is stored in `localStorage`.

## 📚 API Endpoints (Phase 1)

### Authentication

- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login (returns JWT + refresh token)
- **POST** `/api/auth/refresh` - Refresh access token

(Additional endpoints for Wines, Preferences, and FridgeLayout coming in next phase)

## 🎨 UI/UX Features

### Color Scheme
- **Deep Wine Red**: Primary actions and branding
- **Cream**: Background, high contrast for readability
- **White**: Cards and modals

### Mobile-First Design
- Optimized for 375px-768px viewport
- Touch-friendly buttons (min 44px tap target)
- Responsive grid layout
- Swipe gestures ready (Phase 2)

### Localization
- Full RTL support for Hebrew
- Currency and date formatting ready
- Wine terminology translations included

## 🧪 Testing

Tests coming in Phase 2. Structure prepared:

```bash
# Backend tests
mvn test

# Frontend tests
npm run test
```

## 📱 PWA Features

- ✅ Installable on iOS/Android home screen
- ✅ Works offline (service worker coming Phase 2)
- ✅ Web manifest configured
- ✅ App shortcuts defined
- ✅ Standalone display mode

## 🔐 Security Considerations

### Current Implementation
- ✅ JWT tokens with 1-hour expiry
- ✅ Refresh token with 30-day expiry
- ✅ HttpOnly cookies (configurable)
- ✅ CORS configured for localhost
- ✅ Password hashing with BCrypt
- ✅ Protected API endpoints

### Future Enhancements (Phase 2+)
- OAuth2/Social login
- Rate limiting
- Request signing
- API versioning
- Audit logging

## 🚢 Running the Application

### Start Backend

```bash
cd backend
set -a && source ../.env && set +a
mvn spring-boot:run
```

### Start Frontend

```bash
cd frontend
npm run dev
```

### Production Considerations

1. Change `JWT_SECRET` to a secure, random 256-bit key
2. Update CORS origins from localhost
3. Use environment-specific configs
4. Enable HTTPS/TLS
5. Configure database backups
6. Set up monitoring and logging

## 📊 Database Schema

### Users Table
```sql
- id (PK)
- username (UNIQUE)
- email (UNIQUE)
- password (hashed)
- preferred_language (EN/HE)
- refresh_token
- refresh_token_expiry
- created_at, updated_at
```

### Wines Table
```sql
- id (PK)
- user_id (FK)
- wine_name
- wine_type (RED, WHITE, SPARKLING, etc.)
- vintage_year
- winery, region, country
- grape_variety
- alcohol_percentage
- is_kosher
- optimal_drink_by
- notes
- quantity, price
- image_url
- created_at, updated_at
```

### Other Tables
- `user_preferences` - Wine type preferences, favorite wineries, kosher flag
- `fridge_layouts` - Cellar dimensions (shelves × bottles per shelf)
- `wine_positions` - Grid placement mapping

## 🔄 Next Steps (Phase 2)

- [ ] Spring AI integration with OpenAI for label scanning
- [ ] Complete CRUD endpoints for wines
- [ ] Dashboard with analytics
- [ ] Cellar grid UI with drag-and-drop
- [ ] Preference bubbles onboarding flow
- [ ] External API integration (Open Food Facts, Vivino)
- [ ] Service worker for offline support
- [ ] Unit & integration tests
- [ ] E2E tests with Cypress/Playwright
- [ ] Performance optimization (image lazy-loading, code splitting)

## 📖 Development Workflow

1. **Backend Changes**: Modify entity → update Flyway migration → update controller → test with Postman
2. **Frontend Changes**: Update components → test in dev server → build for production
3. **Database Changes**: Create new V{N}__migration_name.sql in `backend/src/main/resources/db/migration/`

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8080 (backend)
lsof -ti:8080 | xargs kill -9

# Kill process on port 3306 (MySQL)
lsof -ti:3306 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Database Connection Issues
```bash
# Check MySQL container
docker-compose logs mysql

# Restart services
docker-compose down && docker-compose up -d
```

### Frontend API Connection Issues
1. Verify backend is running: `curl http://localhost:8080/api/health`
2. Check browser console for CORS errors
3. Verify JWT token in localStorage
4. Check Network tab in DevTools

## 📄 License

Proprietary - Personal Project

## 👨‍💻 Author

Built with ❤️ for wine enthusiasts.

---

**Current Phase**: Phase 1 - Foundation ✅
**Next Phase**: Phase 2 - Feature Implementation
**Status**: Ready for development 🚀
