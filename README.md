# Student Election Voting System

A secure, anonymous voting platform for student elections with one-time token authentication.

## Features

- **Anonymous Voting**: No student identities stored with ballots
- **One-Time Tokens**: Enforce one vote per student
- **Mobile-First UI**: Optimized for mobile devices
- **Admin Dashboard**: Create elections, manage candidates, generate tokens
- **CSV Eligibility**: Upload student lists for token generation
- **Rate Limiting & CAPTCHA**: Prevent abuse with Cloudflare Turnstile
- **Real-time Results**: First-Past-The-Post counting with optional delayed reveal

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL (Neon free tier)
- **Auth**: JWT for admin users
- **CAPTCHA**: Cloudflare Turnstile
- **Hosting**: Vercel (frontend) + Render/Railway (backend)

## Project Structure

```
student-election-voting/
├── backend/          # Node.js API server
├── frontend/         # React Vite app
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Cloudflare Turnstile account (optional but recommended)

### Setup

1. **Clone and setup directories:**
   ```bash
   cd student-election-voting
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database URL and secrets
   npx prisma migrate dev
   npx prisma db seed
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your API base URL
   npm run dev
   ```

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
TURNSTILE_SECRET_KEY="your-turnstile-secret-key"
NODE_ENV="development"
```

#### Frontend (.env)
```env
VITE_API_BASE="http://localhost:3001"
VITE_TURNSTILE_SITE_KEY="your-turnstile-site-key"
```

## Admin Usage

1. **Create Admin Account:**
   ```bash
   cd backend
   node scripts/create-admin.js your-email@school.edu your-password
   ```

2. **Create Election:**
   - Login to admin dashboard
   - Create new election with title, description, and voting window
   - Add races (President, Secretary, etc.)
   - Add candidates for each race

3. **Generate Tokens:**
   - Upload CSV of eligible students (email or ID)
   - Generate one-time tokens
   - Download tokens CSV for distribution

## Student Voting

1. **Get Voting Code:**
   - Visit election page
   - Complete CAPTCHA verification
   - Receive one-time voting token

2. **Cast Vote:**
   - Enter voting token
   - Select candidates for each race
   - Confirm and submit vote

## Deployment

### Database (Neon)
1. Create free Neon account
2. Create new PostgreSQL database
3. Copy connection string to backend .env

### Backend (Render/Railway)
1. Connect GitHub repository
2. Set environment variables
3. Deploy with `npm start` command

### Frontend (Vercel)
1. Connect GitHub repository
2. Set environment variables
3. Deploy with `npm run build` command

## Security Features

- **Anonymous Ballots**: No identity stored with votes
- **One-Time Tokens**: Prevent multiple voting
- **Rate Limiting**: Throttle token requests
- **CAPTCHA**: Prevent automated abuse
- **JWT Authentication**: Secure admin access
- **Database Transactions**: Ensure vote integrity

## License

MIT License
