# Deployment Guide

This guide covers deploying the Student Election Voting System to production.

## Architecture Overview

- **Frontend**: React + Vite (deployed to Vercel)
- **Backend**: Node.js + Express (deployed to Render/Railway/Fly)
- **Database**: PostgreSQL (Neon free tier)
- **CAPTCHA**: Cloudflare Turnstile (optional but recommended)

## Database Setup (Neon)

1. **Create Neon Account**
   - Sign up at https://neon.tech
   - Create a new project
   - Choose the free tier

2. **Get Connection String**
   - Go to Dashboard → Connection Details
   - Copy the connection string
   - Format: `postgresql://username:password@host:port/database`

## Backend Deployment (Render)

1. **Prepare Repository**
   - Push your code to GitHub
   - Ensure all environment variables are set

2. **Create Render Service**
   - Go to https://render.com
   - Connect your GitHub repository
   - Create a new "Web Service"

3. **Configuration**
   ```
   Name: student-election-api
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Instance Type: Free (or paid for production)
   ```

4. **Environment Variables**
   ```
   DATABASE_URL: your-neon-connection-string
   JWT_SECRET: your-super-secret-jwt-key
   PORT: 3001
   TURNSTILE_SECRET_KEY: your-turnstile-secret-key
   NODE_ENV: production
   ```

5. **Deploy**
   - Push changes to trigger deployment
   - Monitor build logs
   - Test the deployed API

## Frontend Deployment (Vercel)

1. **Prepare Repository**
   - Ensure frontend is in its own subdirectory or separate repo
   - Update `vite.config.ts` for production

2. **Create Vercel Project**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Set root directory to `frontend`

3. **Configuration**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Environment Variables**
   ```
   VITE_API_BASE: your-backend-url
   VITE_TURNSTILE_SITE_KEY: your-turnstile-site-key
   ```

5. **Deploy**
   - Vercel will automatically deploy on push
   - Get your Vercel URL

## Cloudflare Turnstile Setup (Optional)

1. **Create Cloudflare Account**
   - Go to https://dash.cloudflare.com
   - Sign up for free account

2. **Add Site**
   - Add your frontend domain
   - Complete DNS setup

3. **Configure Turnstile**
   - Go to Turnstile in sidebar
   - Add new site
   - Get Site Key and Secret Key

4. **Update Environment**
   - Add `VITE_TURNSTILE_SITE_KEY` to frontend
   - Add `TURNSTILE_SECRET_KEY` to backend

## Production Checklist

### Security
- [ ] Change default admin password
- [ ] Use strong JWT secret
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Set up rate limiting
- [ ] Configure CAPTCHA

### Database
- [ ] Use production database (Neon)
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed with production data if needed

### Monitoring
- [ ] Set up error monitoring (optional)
- [ ] Configure logs
- [ ] Set up alerts for downtime

### Performance
- [ ] Enable caching headers
- [ ] Optimize images
- [ ] Monitor response times

## Environment Variables Summary

### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
TURNSTILE_SECRET_KEY="your-turnstile-secret-key"
NODE_ENV="production"
```

### Frontend (.env)
```env
VITE_API_BASE="https://your-backend-url.onrender.com"
VITE_TURNSTILE_SITE_KEY="your-turnstile-site-key"
```

## Testing Production Deployment

1. **API Health Check**
   ```bash
   curl https://your-backend-url.onrender.com/api/health
   ```

2. **Frontend Access**
   - Visit your Vercel URL
   - Test admin login
   - Create test election
   - Test voting flow

3. **Database Verification**
   - Check data persistence
   - Verify token generation
   - Test vote casting

## Cost Summary (Free Tier)

- **Neon Database**: Free (up to 3GB)
- **Render Backend**: Free (with limits)
- **Vercel Frontend**: Free (with limits)
- **Cloudflare**: Free (up to limits)

**Total Cost**: $0/month for basic usage

## Scaling Considerations

When scaling beyond free tiers:

1. **Database**: Upgrade Neon plan for more storage/connections
2. **Backend**: Upgrade Render for more CPU/memory
3. **Frontend**: Vercel Pro for more bandwidth
4. **CDN**: Cloudflare for better performance
5. **Monitoring**: Add error tracking and analytics

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check connection string
   - Verify Neon is running
   - Check IP allowlist

2. **CORS Errors**
   - Update CORS origins
   - Check API base URL

3. **Build Failures**
   - Check package.json scripts
   - Verify all dependencies
   - Review build logs

4. **Environment Variables**
   - Double-check names and values
   - Ensure no trailing spaces
   - Verify sensitive data

### Debug Commands

```bash
# Check backend logs
curl https://your-backend-url.onrender.com/api/health

# Test database connection
npx prisma db pull --schema=./prisma/schema.prisma

# Verify frontend build
cd frontend && npm run build
```

## Support

- **Neon**: https://neon.tech/docs
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **Cloudflare**: https://developers.cloudflare.com/turnstile/
