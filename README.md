# Amazon-Inspired E-Commerce Platform

Full-stack Amazon clone assignment built with React, FastAPI, and MariaDB/MySQL-style relational design.

## Tech Stack
- Frontend: React + Vite
- Backend: FastAPI + SQLAlchemy
- Database: MariaDB/MySQL (`SQLite` fallback for local dev)
- Auth: JWT + bcrypt/argon2

## Features
- Product listing with search and category filters
- Product detail page with image gallery, description, and specifications
- Cart add/update/remove with summary
- Checkout with shipping address form and order review
- Order placement, confirmation page, and order history
- Amazon-inspired responsive UI
- Demo user auto-login as `Charlie` on first visit
- Optional order confirmation email via SMTP env vars

## Demo User
- Name: `Charlie`
- Email: `charlie@amazonclone.dev`
- Password: `charlie123`

Charlie is auto-logged in by default on first load. If you log out, the login/signup pages are still available for manual testing.

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Tests
Backend tests live in `backend/tests`.

Run them with:
```bash
cd backend
pytest
```

Validation performed:
- 7/7 tests passed

## Environment Notes
- `DATABASE_URL`: MariaDB/MySQL connection string
- `CORS_ORIGINS`: comma-separated frontend origins
- `DEMO_USER_*`: default demo account details
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_USE_TLS`: optional order email settings

## Main API Routes
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products`
- `GET /api/products/{id}`
- `GET /api/products/{id}/similar`
- `GET /api/search/suggest`
- `GET /api/cart`
- `POST /api/cart/add`
- `PUT /api/cart/{id}`
- `DELETE /api/cart/{id}`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/{id}`

## Assumptions
- Sample products are seeded automatically when the database is empty.
- Order emails are best-effort and only send when SMTP env vars are configured.
- The demo user is intended for assignment flow testing.
