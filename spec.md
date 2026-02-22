Project Specification: Vindex – Smart Wine Cellar PWA
1. Project Overview
A professional, mobile-first Progressive Web App (PWA) for managing a personal wine collection. It features visual fridge mapping, AI-powered bottle scanning, and personalized recommendations based on user preferences.

2. Technical Stack

Backend: Java 21, Spring Boot 3.x, Spring Data JPA.

Security: Spring Security, JWT with Refresh Token (30-day expiry), and HttpOnly Cookies.


Database: MySQL 8.0 (Dockerized).


Frontend: React (TypeScript), Tailwind CSS.

AI Integration: Spring AI for label recognition (OCR/Vision) and personalized recommendations.

Localization: i18next for full Hebrew (RTL) and English (LTR) support.

3. Core Modules & Features
A. Authentication & Onboarding
Secure Login: JWT-based auth with long-term session persistence.

Preference Bubbles: Post-login setup to select preferred wine types (Red, White, Sparkling, etc.), favorite wineries, grape varieties, and Kosher requirements.

Fridge Profile: User defines cellar dimensions (number of shelves, bottles per shelf).

B. Visual Cellar Management (UX Focus)
Visual Grid: A dynamic UI representing the fridge layout.

CRUD Operations: Add, Edit, Delete, and View bottles.

Quick Scan: Use mobile camera to scan labels; Spring AI extracts wine details and auto-fills the form.

Manual Entry: Fallback to manual input if the bottle isn't found in external APIs (Open Food Facts/Vivino).

C. UI/UX & Personalization
Themes: Toggle between "Deep Wine Red & White" and "Classic Blue & White".

Dashboard: Highlights "Optimal Drink-by Dates" and personalized suggestions based on the user's "Preference Bubbles".

Profile Area: Edit fridge dimensions and wine preferences.

4. Infrastructure

Docker Compose: Orchestrating Spring Boot and MySQL containers.


PWA Manifest: Ensuring the app can be installed on iOS/Android home screens.