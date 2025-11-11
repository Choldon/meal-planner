# Google Authentication & Calendar API Setup Guide

This guide will walk you through setting up Google Sign-In and Google Calendar API integration for your meal planner.

## Prerequisites

- ✅ Supabase project set up
- ✅ App deployed on Render
- ✅ Google account (for development and shared use)

## Part 1: Google Cloud Console Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Project name: `Meal Planner`
4. Click "Create"
5. Wait for project creation (30 seconds)

### Step 2: Enable Required APIs

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for and enable these APIs:
   - **Google Calendar API** - Click "Enable"
   - **Google+ API** - Click "Enable" (needed for sign-in)

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. **User Type:** Choose **"External"** ✅ (this is correct even for personal use)
3. Click **"Create"**

#### Page 1: App Information

Fill in the following:

- **App name:** `Kit & Jess's Meal Planner`
- **User support email:** Your email address
- **App logo:** (Optional - skip for now)

**App Domain (Optional but recommended):**
- **Application home page:** `https://meal-planner-d1es.onrender.com` (or your Render URL)
- **Application privacy policy link:** Leave blank for now
- **Application terms of service link:** Leave blank for now

- **Authorized domains:** Leave blank for now
- **Developer contact information:** Your email address

Click **"Save and Continue"**

#### Page 2: Scopes (Data Access)

**Note:** Google may call this page "Scopes" or "Data Access" depending on your console version.

This is where you grant permissions for your app:

1. Click **"Add or Remove Scopes"** button
2. In the filter/search box, find and select these scopes:
   - ✅ `.../auth/userinfo.email` - View your email address
   - ✅ `.../auth/userinfo.profile` - See your personal info
   - ✅ `https://www.googleapis.com/auth/calendar` - See, edit, share, and permanently delete all calendars
3. Click **"Update"** at the bottom
4. Verify all 3 scopes are listed in the table
5. Click **"Save and Continue"**

**Alternative:** If you see a "Data Access" menu item in the left sidebar instead:
- Click **"Data Access"** in the left menu
- Click **"Add or Remove Scopes"**
- Follow the same steps above

#### Page 3: Test Users (IMPORTANT!)

While your app is in testing mode, only these users can sign in:

1. Click **"Add Users"** button
2. Add email addresses (one per line):
   - Kit's email address
   - Jess's email address
   - Any shared Google account email
3. Click **"Add"**
4. Click **"Save and Continue"**

#### Page 4: Summary

Review your settings and click **"Back to Dashboard"**

**Important:** Your app will stay in "Testing" mode - this is perfect for personal use!

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `Meal Planner Web Client`

**Authorized JavaScript origins:**
```
http://localhost:3000
https://meal-planner-d1es.onrender.com
```

**Authorized redirect URIs:**
```
http://localhost:3000
https://meal-planner-d1es.onrender.com
https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
```

Replace `YOUR_SUPABASE_PROJECT` with your actual Supabase project URL.

5. Click **"Create"**
6. **IMPORTANT:** Copy these values:
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `xxxxx`

---

## Part 2: Supabase Configuration

### Step 1: Enable Google Auth in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **"Authentication"** → **"Providers"**
4. Find **"Google"** in the list and click to expand it
5. Toggle **"Enable Sign in with Google"** to ON

### Step 2: Add Google Credentials

You'll see a form with several fields. Fill them in:

**Google Client ID (OAuth):**
- Paste your Client ID from Google Cloud Console
- Format: `xxxxx.apps.googleusercontent.com`

**Google Client Secret (OAuth):**
- Paste your Client Secret from Google Cloud Console
- Format: `xxxxx`

**Additional Scopes (Optional):**
- Scroll down to find this field (it may be collapsed/hidden)
- Click to expand if needed
- Add this scope:
```
https://www.googleapis.com/auth/calendar
```
- This gives your app permission to access Google Calendar

**Skip URL Allowlist:**
- Leave as default (unchecked)

Click **"Save"** at the bottom

**Note:** The "Additional Scopes" field might be at the bottom of the Google provider settings, below the Client ID and Secret fields. You may need to scroll down to see it.

### Step 3: Get Supabase Redirect URL

Copy the **Redirect URL** shown in Supabase (looks like):
```
https://YOUR_PROJECT.supabase.co/auth/v1/callback
```

Go back to Google Cloud Console and make sure this URL is in your **Authorized redirect URIs**.

---

## Part 3: Update Environment Variables

### Local Development

Update your `.env.local` file:

```env
# Existing Supabase variables
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# New Google API variables
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### Production (Render)

1. Go to your Render dashboard
2. Select your meal-planner site
3. Go to **"Environment"** tab
4. Add new environment variable:
   - Key: `REACT_APP_GOOGLE_CLIENT_ID`
   - Value: Your Google Client ID
5. Click **"Save"**

---

## Part 4: Testing

### Test Google Sign-In

1. Run your app locally: `npm start`
2. Click "Sign in with Google"
3. You should see Google's consent screen
4. Grant permissions:
   - View email and profile
   - Access Google Calendar
5. You should be redirected back to your app
6. Check that you're signed in

### Test Calendar Access

After signing in, try:
1. Adding a meal to your calendar
2. Click "Sync to Google Calendar"
3. Check your Google Calendar - the event should appear!

---

## Troubleshooting

### Error: "Access blocked: This app's request is invalid"

**Solution:** Make sure you added your email to "Test Users" in OAuth consent screen.

### Error: "redirect_uri_mismatch"

**Solution:** 
1. Check that your redirect URI in Google Cloud Console matches exactly
2. Include both localhost and production URLs
3. Include the Supabase callback URL

### Error: "Invalid client"

**Solution:**
1. Double-check Client ID and Secret in Supabase
2. Make sure you copied them correctly (no extra spaces)

### Calendar API not working

**Solution:**
1. Verify Google Calendar API is enabled in Google Cloud Console
2. Check that calendar scope is added in Supabase
3. Make sure user granted calendar permission during sign-in

---

## Security Notes

1. **Never commit** `.env.local` to Git (it's in `.gitignore`)
2. **Client ID is public** - it's safe to expose in your app
3. **Client Secret is private** - only store in Supabase, never in your code
4. **Test users only** - Your app is in testing mode, only listed users can sign in
5. **Publishing** - To allow anyone to sign in, you'll need to verify your app with Google (optional)

---

## Next Steps

After setup is complete:

1. ✅ Test sign-in locally
2. ✅ Test sign-in on production
3. ✅ Test calendar sync
4. ✅ Share credentials with Jess
5. ✅ Both sign in with shared account

---

## Shared Account Setup

### Option A: Create New Shared Account

1. Create new Gmail: `kitandjess@gmail.com` (or similar)
2. Add to Google Cloud Console test users
3. Both Kit and Jess use this account to sign in

### Option B: Use Existing Account

1. Use Kit's or Jess's existing Google account
2. Add to test users
3. Share credentials between you

---

## Support

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google Calendar API Documentation](https://developers.google.com/calendar/api)

---

Ready to implement! Follow the steps above, then we'll add the authentication code to your app.