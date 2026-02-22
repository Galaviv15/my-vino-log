# Phase 2: Feature Implementation Roadmap

**Status**: Frontend scaffolding complete, ready for backend & feature development  
**Target**: Full wine management system with all CRUD operations  
**Estimated Timeline**: 2-3 weeks of focused development

---

## 📋 Phase 2 Tasks (Priority Order)

### Week 1: Backend Foundation & Authentication

#### Task 1.1: Create Repository Layer
```java
// Create interfaces for data access
UserRepository extends JpaRepository<User, Long>
WineRepository extends JpaRepository<Wine, Long>
UserPreferenceRepository extends JpaRepository<UserPreference, Long>
FridgeLayoutRepository extends JpaRepository<FridgeLayout, Long>
WinePositionRepository extends JpaRepository<WinePosition, Long>
```
**Deliverables:**
- [ ] 5 repository interfaces
- [ ] Custom query methods
- [ ] Unit tests for repositories

#### Task 1.2: Create Service Layer
```java
// Create business logic services
UserService (register, login, update)
WineService (CRUD operations)
PreferenceService (manage preferences)
FridgeService (manage cellar layout)
AuthService (token management)
```
**Deliverables:**
- [ ] 5 service classes
- [ ] Business logic implementation
- [ ] Error handling
- [ ] Service layer tests

#### Task 1.3: Create DTOs (Data Transfer Objects)
```java
// Request DTOs
LoginRequest { email, password }
RegisterRequest { username, email, password, firstName, lastName }
WineRequest { name, type, vintage, winery, ... }
PreferenceRequest { wineType, favoriteWinery, grapeVariety, kosher }

// Response DTOs
AuthResponse { user, accessToken, refreshToken }
WineResponse { id, name, type, ... }
UserResponse { id, username, email, ... }
```
**Deliverables:**
- [ ] 15+ DTO classes
- [ ] Validation annotations
- [ ] Serialization setup

#### Task 1.4: Create Auth Controller
```java
@RestController
@RequestMapping("/api/auth")
class AuthController {
    POST /register - Register new user
    POST /login - Login user
    POST /refresh - Refresh access token
    POST /logout - Logout user
}
```
**Deliverables:**
- [ ] AuthController implementation
- [ ] Input validation
- [ ] Error responses
- [ ] Integration tests

### Week 2: Wine CRUD & Profile Management

#### Task 2.1: Create Wine Controller
```java
@RestController
@RequestMapping("/api/wines")
class WineController {
    GET / - Get all user's wines
    GET /{id} - Get single wine
    POST / - Add new wine
    PUT /{id} - Update wine
    DELETE /{id} - Delete wine
    GET /upcoming - Get wines to drink soon
}
```
**Deliverables:**
- [ ] Complete CRUD endpoints
- [ ] Pagination support
- [ ] Filtering & sorting
- [ ] Proper HTTP status codes

#### Task 2.2: Create Preference Controller
```java
@RestController
@RequestMapping("/api/preferences")
class PreferenceController {
    GET / - Get user preferences
    POST / - Add preference
    PUT /{id} - Update preference
    DELETE /{id} - Remove preference
}
```
**Deliverables:**
- [ ] Preference endpoints
- [ ] Validation
- [ ] Tests

#### Task 2.3: Create Fridge Controller
```java
@RestController
@RequestMapping("/api/fridge")
class FridgeController {
    GET / - Get fridge layout
    PUT / - Update fridge dimensions
    GET /positions - Get wine positions
    PUT /positions/{wineId} - Update wine position
}
```
**Deliverables:**
- [ ] Fridge management endpoints
- [ ] Position validation
- [ ] Grid collision detection

#### Task 2.4: Add Exception Handling
```java
GlobalExceptionHandler.java
├── Handle ValidationException
├── Handle ResourceNotFoundException
├── Handle AuthenticationException
├── Handle Generic exceptions
└── Return proper error responses
```
**Deliverables:**
- [ ] Custom exception classes
- [ ] Global exception handler
- [ ] Consistent error format

### Week 3: Frontend Integration & UI Implementation

#### Task 3.1: Implement Auth Pages
```tsx
// RegisterPage.tsx - Complete implementation
- Form with all fields
- Validation feedback
- Loading state
- Error messages
- Success redirect

// LoginPage.tsx - Add login logic
- Form submission to /api/auth/login
- JWT token storage
- Auto-redirect to dashboard
- Error handling
```
**Deliverables:**
- [ ] Working register form
- [ ] Working login form
- [ ] Form validation
- [ ] Error displays

#### Task 3.2: Implement Dashboard
```tsx
// DashboardPage.tsx
- Total wines count
- Wines to drink soon
- Recent additions (list)
- Quick add wine button
- Recommendations preview
- Stats cards
```
**Deliverables:**
- [ ] Dashboard layout
- [ ] API integration
- [ ] Data display
- [ ] Loading states

#### Task 3.3: Implement Wine Management
```tsx
// WineFormModal.tsx - Add/Edit wine
- Form fields (name, type, vintage, etc.)
- Image upload preview
- Form validation
- Submit handler

// WineListComponent.tsx
- Table or card view
- Sorting/filtering
- Delete confirmation
- Edit button
```
**Deliverables:**
- [ ] Wine form component
- [ ] Wine list component
- [ ] API integration
- [ ] CRUD operations

#### Task 3.4: Implement Cellar Grid
```tsx
// CellarGridComponent.tsx
- Visual grid layout
- Drag & drop repositioning
- Empty slot handling
- Wine details popup
- Add wine to slot
- Remove wine button
```
**Deliverables:**
- [ ] Grid visualization
- [ ] Drag-and-drop logic
- [ ] Position updates
- [ ] Interactive UI

#### Task 3.5: Implement Onboarding
```tsx
// OnboardingFlow.tsx
Step 1: Welcome
Step 2: Wine Preferences
Step 3: Fridge Setup
Step 4: Complete
```
**Deliverables:**
- [ ] Multi-step form
- [ ] Progress indicator
- [ ] Preference selection
- [ ] Fridge setup

#### Task 3.6: Implement Profile Page
```tsx
// ProfilePage.tsx
- User info display
- Edit profile button
- Language preference
- Theme toggle
- Fridge settings
- Preferences editor
- Change password
- Logout
```
**Deliverables:**
- [ ] Profile display
- [ ] Edit functionality
- [ ] Settings management
- [ ] Preferences update

---

## 🔧 Technical Implementation Details

### Backend Setup

#### Environment Variables Needed
```env
JWT_SECRET=<256-bit-secure-key>
OPENAI_API_KEY=<if-using-ai-phase-2>
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/vindex_db
```

#### Database Connection
```yaml
# application.yml
spring:
  jpa:
    hibernate:
      ddl-auto: validate  # Use Flyway, not Hibernate
```

#### Testing Strategy
```
- Unit tests for services
- Integration tests for controllers
- Repository tests with H2 in-memory DB
- AuthenticationFilter tests
- Error handling tests
```

### Frontend Setup

#### API Service Pattern
```typescript
// Use axios with interceptors
// Token refresh on 401
// Proper error handling
// Request/response logging
```

#### State Management
```typescript
// Zustand stores for:
- Authentication (done)
- Wine list (new)
- Preferences (new)
- UI state (loading, filters)
- Notifications (new)
```

#### Form Handling
```typescript
// Use React state + validation
// Display errors near inputs
// Loading state during submission
// Success confirmation
```

---

## 📝 Testing Plan

### Backend Tests
```bash
# Unit tests for all services
mvn test -Dtest=WineServiceTest

# Integration tests for controllers
mvn test -Dtest=WineControllerTest

# Overall test coverage
mvn test jacoco:report
```

### Frontend Tests
```bash
# Component tests (when added)
npm test

# E2E tests (Phase 3)
npm run test:e2e
```

---

## 🚀 Deployment Checklist

Before going live:
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] API documentation updated
- [ ] Environment variables secured
- [ ] Database backups configured
- [ ] Error logging enabled
- [ ] Performance optimized
- [ ] Security audit completed

---

## 📊 Success Metrics

### Backend
- [ ] All 20+ endpoints implemented
- [ ] 100% test coverage for services
- [ ] <100ms average response time
- [ ] Proper error handling
- [ ] Security validated

### Frontend
- [ ] All 6 pages functional
- [ ] <3s initial load time
- [ ] Mobile responsive
- [ ] Accessibility tested
- [ ] Performance optimized

### Overall
- [ ] Full wine CRUD working
- [ ] User authentication complete
- [ ] Cellar grid functional
- [ ] Multi-language support active
- [ ] PWA installable

---

## 🛠️ Tools & Libraries

### Backend
- Spring Boot 3.x (framework)
- Spring Data JPA (ORM)
- Flyway (migrations)
- JUnit 5 (testing)
- Mockito (mocking)
- Swagger/OpenAPI (docs)

### Frontend
- React 18 (UI)
- React Router 6 (navigation)
- Axios (HTTP)
- React Query (data fetching)
- React Hook Form (forms)
- Vitest/Jest (testing)

---

## 📚 Documentation to Update

- [ ] API documentation (Swagger)
- [ ] Database schema diagram
- [ ] Component documentation
- [ ] Setup guide
- [ ] Deployment guide
- [ ] Troubleshooting guide

---

## 🎯 Phase 2 Definition of Done

✅ All backend endpoints functional  
✅ All frontend pages implemented  
✅ Database integration complete  
✅ Authentication working  
✅ CRUD operations working  
✅ Error handling robust  
✅ Tests passing (>80% coverage)  
✅ Documentation updated  
✅ Performance optimized  
✅ Ready for Phase 3  

---

## 📞 Development Notes

### Key Files to Create/Modify

**Backend:**
```
src/main/java/com/vindex/
├── repository/           (5 new files)
├── service/              (5 new files)
├── controller/           (5 new files)
├── dto/                  (15+ new files)
├── exception/            (3 new files)
└── util/                 (2 new files)
```

**Frontend:**
```
src/
├── pages/                (5 files to complete)
├── components/           (10+ new files)
├── hooks/                (5 new files)
├── store/                (3 new files)
├── api/                  (2 files to extend)
└── types/                (1 new file)
```

---

## 🎓 Learning Resources

- Spring Boot docs: https://spring.io/projects/spring-boot
- React Router: https://reactrouter.com/
- REST API best practices
- JWT implementation patterns
- Testing strategies

---

**Ready to start Phase 2? Let's build!** 🚀

Last Updated: February 22, 2026
