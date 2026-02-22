# Quick Reference Guide - Vindex Development

## 🚀 Getting Started (5 Minutes)

### Using Docker (Easiest)
```bash
cd /Users/galaviv15/Desktop/my-vino-log
docker-compose up -d
# Open http://localhost:5173 in your browser
```

### Local Development
```bash
# Terminal 1: Backend
cd backend
mvn spring-boot:run

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

---

## 📁 Key Directories

```
Backend:
├── src/main/java/com/vindex/
│   ├── config/        → Security & JWT config
│   ├── entity/        → Database models
│   ├── security/      → Auth filters
│   └── [repo/service/controller] → Coming Phase 2

Frontend:
├── src/
│   ├── components/    → Reusable UI
│   ├── pages/         → Page components
│   ├── services/      → API calls
│   ├── store/         → State management (Zustand)
│   └── i18n/          → Translations
```

---

## 🔧 Common Development Tasks

### Add a New Page Component

1. Create file: `frontend/src/pages/MyNewPage.tsx`
```tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function MyNewPage() {
  const { t } = useTranslation();
  return <div>{t('key.from.translation')}</div>;
}
```

2. Add route in `frontend/src/App.tsx`:
```tsx
<Route path="/mynew" element={<PrivateRoute><MyNewPage /></PrivateRoute>} />
```

3. Add translation in `frontend/src/i18n/locales/en.json` and `he.json`:
```json
{
  "mypage": {
    "title": "My New Page"
  }
}
```

### Add a New Backend Entity

1. Create entity file: `backend/src/main/java/com/vindex/entity/MyEntity.java`
```java
@Entity
@Table(name = "my_entities")
@Data
@NoArgsConstructor
public class MyEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // Add fields...
}
```

2. Create migration: `backend/src/main/resources/db/migration/V2__Add_my_entity.sql`
```sql
CREATE TABLE my_entities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    -- columns...
    INDEX idx_col_name (col_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

3. Create repository (Phase 2):
```java
@Repository
public interface MyEntityRepository extends JpaRepository<MyEntity, Long> {}
```

### Add a New Translation Key

1. Edit `frontend/src/i18n/locales/en.json`:
```json
{
  "section": {
    "key": "English text"
  }
}
```

2. Edit `frontend/src/i18n/locales/he.json`:
```json
{
  "section": {
    "key": "טקסט בעברית"
  }
}
```

3. Use in component:
```tsx
const { t } = useTranslation();
<h1>{t('section.key')}</h1>
```

### Change Language Programmatically

```tsx
const { i18n } = useTranslation();

// Change to Hebrew
i18n.changeLanguage('he');
localStorage.setItem('language', 'he');
document.documentElement.dir = 'rtl';

// Change to English
i18n.changeLanguage('en');
localStorage.setItem('language', 'en');
document.documentElement.dir = 'ltr';
```

---

## 🎨 Tailwind CSS Quick Reference

### Wine Color Palette
```css
bg-wine-50    /* #faf5f3 - Very light */
bg-wine-100   /* #f5ebe7 - Light */
bg-wine-200   /* #ead7cf */
bg-wine-300   /* #dfc3b7 */
bg-wine-500   /* #a8515d - Medium */
bg-wine-600   /* #8b3f48 - Primary */
bg-wine-700   /* #6b2e36 */
bg-wine-800   /* #4b1f25 */
bg-wine-900   /* #2b1118 - Dark */
```

### Common Components
```tsx
// Primary button
<button className="btn-primary">Click me</button>

// Secondary button
<button className="btn-secondary">Click me</button>

// Card container
<div className="card">Content here</div>

// Mobile-safe margin
<div className="p-4">Content</div>  // Padding all sides
<div className="px-4 py-2">Content</div>  // Padding X & Y
```

---

## 🔐 Authentication Flow

### Login
```
1. User fills email + password
2. POST /api/auth/login
3. Response: { user, accessToken, refreshToken }
4. Store in localStorage & Zustand
5. Redirect to /dashboard
```

### API Request with Token
```
1. useAuthStore() gets accessToken
2. axios interceptor adds: Authorization: Bearer {token}
3. If 401 response:
   - POST /api/auth/refresh with refreshToken
   - Get new accessToken
   - Retry original request
```

### Logout
```
1. useAuthStore().logout()
2. Clears localStorage & state
3. Redirect to /login
```

---

## 📱 Responsive Design Breakpoints

```css
Mobile:   0px - 640px   (default)
Tablet:   641px - 1024px (md:)
Desktop:  1025px+       (lg:)
```

Use Tailwind responsive prefixes:
```tsx
<div className="text-sm md:text-base lg:text-lg">
  Responsive text size
</div>
```

---

## 🧪 Testing Commands

```bash
# Backend
mvn test

# Frontend (when tests are added)
npm test
```

---

## 🚨 Common Issues & Solutions

### Port Already in Use
```bash
# Kill processes
lsof -ti:8080 | xargs kill -9    # Backend
lsof -ti:5173 | xargs kill -9    # Frontend
lsof -ti:3306 | xargs kill -9    # MySQL
```

### MySQL Connection Error
```bash
docker-compose down
docker volume rm my-vino-log_mysql_data  # Optional: clear DB
docker-compose up -d
```

### Frontend Not Connecting to Backend
1. Check backend running: `curl http://localhost:8080/api/health`
2. Check CORS in browser console
3. Verify JWT in localStorage

### TypeScript Type Errors
```bash
cd frontend
npm run type-check
```

---

## 📚 Useful URLs (Local Development)

```
Frontend:     http://localhost:5173
Backend API:  http://localhost:8080/api
MySQL:        localhost:3306
```

---

## 🔑 Environment Variables

Create `.env` file:
```
JWT_SECRET=your-secure-key-256-bits-minimum
OPENAI_API_KEY=sk-...
```

Or use defaults in `docker-compose.yml`

---

## 📖 Documentation Files

- `README.md` - Full project documentation
- `PHASE_1_SUMMARY.md` - What's been built
- `spec.md` - Original project specification
- This file - Quick reference

---

## 🎯 Phase 2 Priorities

1. ✅ **Repositories** - Data access layer for all entities
2. ✅ **Services** - Business logic 
3. ✅ **Controllers** - REST endpoints
4. ✅ **Frontend Pages** - Complete all page functionality
5. ✅ **Spring AI** - Label scanning with OpenAI
6. ✅ **Tests** - Unit & integration tests

---

## 💡 Pro Tips

- Use VS Code REST extension to test endpoints
- Keep components small and reusable
- Use TypeScript for type safety
- Check browser DevTools Network tab for API calls
- Commit often with clear messages
- Use `git branch` for feature development

---

**Need Help?** Check the README.md or PHASE_1_SUMMARY.md files.

Last Updated: February 22, 2026
