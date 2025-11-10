# Deployment Guide - Render

This guide will walk you through deploying your meal planner app to Render's free tier.

## Prerequisites

- ✅ Git repository set up
- ✅ Code pushed to GitHub
- ✅ Supabase project configured
- ✅ `.env.local` file with Supabase credentials (locally)

## Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure your code is committed and pushed to GitHub:

```bash
# Check git status
git status

# Add any uncommitted changes
git add .

# Commit
git commit -m "Prepare for Render deployment"

# Push to GitHub
git push origin main
```

### 2. Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with your GitHub account
4. Authorize Render to access your repositories

### 3. Create a New Static Site

1. From your Render dashboard, click **"New +"**
2. Select **"Static Site"**
3. Connect your GitHub account if not already connected
4. Find and select your `meal-planner` repository
5. Click **"Connect"**

### 4. Configure Build Settings

On the configuration page, enter the following:

**Basic Settings:**
- **Name**: `meal-planner` (or your preferred name)
- **Branch**: `main`
- **Root Directory**: Leave blank (or enter `meal-planner` if it's in a subdirectory)

**Build Settings:**
- **Build Command**: `npm run build`
- **Publish Directory**: `build`

**Advanced Settings (Optional):**
- **Auto-Deploy**: Yes (recommended - deploys automatically on git push)

### 5. Add Environment Variables

This is **CRITICAL** - your app won't work without these!

1. Scroll down to **"Environment Variables"**
2. Click **"Add Environment Variable"**
3. Add the following variables:

| Key | Value |
|-----|-------|
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL (from `.env.local`) |
| `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase anon key (from `.env.local`) |

**Where to find these values:**
- Open your local `.env.local` file
- Copy the values exactly (including `https://` for the URL)
- Or get them from your Supabase dashboard → Settings → API

### 6. Deploy

1. Click **"Create Static Site"**
2. Render will start building your app
3. Watch the build logs in real-time
4. Wait 2-3 minutes for the build to complete

### 7. Verify Deployment

Once the build succeeds:

1. Click on your site URL (e.g., `https://meal-planner-xyz.onrender.com`)
2. Test the following:
   - ✅ App loads correctly
   - ✅ Can view calendar
   - ✅ Can add a meal
   - ✅ Can view recipes
   - ✅ Can add to shopping basket
   - ✅ Changes sync to Supabase

### 8. Set Up Custom Domain (Optional)

If you have a custom domain:

1. Go to your site's **Settings** → **Custom Domains**
2. Click **"Add Custom Domain"**
3. Enter your domain (e.g., `meals.yourdomain.com`)
4. Follow the DNS configuration instructions
5. Wait for DNS propagation (can take up to 48 hours)

## Troubleshooting

### Build Fails

**Error: "Command failed: npm run build"**
- Check that `package.json` has a `build` script
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

**Solution:**
```bash
# Test build locally first
npm run build

# If it works locally, commit and push
git add .
git commit -m "Fix build configuration"
git push origin main
```

### App Loads But Features Don't Work

**Symptoms:**
- App loads but can't add meals
- No data appears
- Console shows Supabase errors

**Solution:**
1. Check environment variables are set correctly
2. Verify Supabase URL and key are correct
3. Check Supabase dashboard for API errors
4. Ensure Supabase project is not paused (free tier pauses after 7 days of inactivity)

### Environment Variables Not Working

**Symptoms:**
- `undefined` errors in console
- Can't connect to Supabase

**Solution:**
1. Environment variables must start with `REACT_APP_`
2. Rebuild the site after adding variables:
   - Go to **Manual Deploy** → **Clear build cache & deploy**
3. Check for typos in variable names

### Slow First Load

**This is normal for Render's free tier:**
- Free tier services "spin down" after 15 minutes of inactivity
- First visit after inactivity takes 30-60 seconds to load
- Subsequent visits are fast
- Upgrade to paid tier ($7/month) for always-on service

## Automatic Deployments

Render automatically deploys when you push to GitHub:

```bash
# Make changes locally
# Test locally with npm start

# Commit and push
git add .
git commit -m "Add new feature"
git push origin main

# Render automatically:
# 1. Detects the push
# 2. Runs npm run build
# 3. Deploys the new version
# 4. Live in 2-3 minutes
```

## Monitoring

### View Logs

1. Go to your site in Render dashboard
2. Click **"Logs"** tab
3. See real-time deployment and runtime logs

### Check Build Status

1. Go to **"Events"** tab
2. See history of all deployments
3. Click any deployment to see detailed logs

### Set Up Notifications

1. Go to **Settings** → **Notifications**
2. Add email or Slack webhook
3. Get notified of:
   - Successful deployments
   - Failed builds
   - Service issues

## Updating Your App

### Regular Updates

```bash
# Make changes
# Test locally
git add .
git commit -m "Description of changes"
git push origin main
# Render auto-deploys
```

### Rollback to Previous Version

If something breaks:

1. Go to **"Events"** tab
2. Find the last working deployment
3. Click **"Redeploy"**
4. Or use Git:
   ```bash
   git revert HEAD
   git push origin main
   ```

## Cost Management

### Free Tier Limits

- ✅ Unlimited static sites
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Custom domains
- ⚠️ Services spin down after 15 min inactivity

### When to Upgrade

Consider upgrading ($7/month) if:
- You want always-on service (no spin-down)
- You need more than 100 GB bandwidth
- You want faster builds
- You need priority support

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Use environment variables** - Set in Render dashboard
3. **Rotate keys regularly** - Update in Supabase and Render
4. **Enable Supabase RLS** - Row-level security for data protection
5. **Monitor access logs** - Check Render and Supabase logs

## Next Steps

After successful deployment:

1. ✅ Share the URL with Jess
2. ✅ Test on mobile devices
3. ✅ Set up monitoring/alerts
4. ✅ Plan next features (authentication, Google Calendar, etc.)
5. ✅ Consider custom domain

## Support

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Supabase Docs**: https://supabase.com/docs

---

🎉 Congratulations! Your meal planner is now live!