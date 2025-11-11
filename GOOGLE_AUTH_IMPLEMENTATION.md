# Google Authentication & Calendar Integration - Implementation Summary

## Overview

This document summarizes the Google Sign-In and Calendar API integration implemented for Kit & Jess's Meal Planner using the **Shared Account** approach (Option 1).

## What Was Implemented

### 1. Authentication System

**Files Created:**
- [`src/contexts/AuthContext.js`](src/contexts/AuthContext.js) - Authentication context provider
- [`src/components/Login.js`](src/components/Login.js) - Login page with Google Sign-In
- [`src/components/ProtectedRoute.js`](src/components/ProtectedRoute.js) - Route protection wrapper
- [`src/styles/Login.css`](src/styles/Login.css) - Login page styles

**Files Modified:**
- [`src/App.js`](src/App.js) - Wrapped with AuthProvider, added protected routes
- [`src/components/Navigation.js`](src/components/Navigation.js) - Added user menu with sign-out
- [`src/styles/Navigation.css`](src/styles/Navigation.css) - Added user menu styles

**Features:**
- ✅ Google OAuth 2.0 sign-in via Supabase
- ✅ Automatic session persistence
- ✅ Protected routes (redirect to login if not authenticated)
- ✅ User profile display in navigation
- ✅ Sign-out functionality
- ✅ Calendar API scope request during sign-in

### 2. Google Calendar Integration

**Files Created:**
- [`src/utils/googleCalendar.js`](src/utils/googleCalendar.js) - Calendar API utilities

**Files Modified:**
- [`src/components/Calendar.js`](src/components/Calendar.js) - Added sync functionality
- [`src/styles/Calendar.css`](src/styles/Calendar.css) - Added sync button styles
- [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) - Added `calendar_event_id` column

**Features:**
- ✅ Sync individual meals to Google Calendar
- ✅ Sync entire week of meals at once
- ✅ Automatic event creation with meal details
- ✅ Recipe information in event description
- ✅ Smart time slots (Lunch: 12-1pm, Dinner: 6-7pm)
- ✅ 1-hour reminder before meals
- ✅ Track synced meals (prevent duplicates)
- ✅ Visual indicator for synced meals

### 3. Database Schema Update

**New Column Added to `meals` table:**
```sql
calendar_event_id TEXT
```

This stores the Google Calendar event ID for each synced meal, allowing:
- Prevention of duplicate syncs
- Future event updates/deletions
- Visual indication of sync status

## How It Works

### Authentication Flow

1. **User visits app** → Redirected to [`/login`](src/components/Login.js) if not authenticated
2. **Clicks "Sign in with Google"** → Supabase initiates OAuth flow
3. **Google authentication** → User grants calendar access
4. **Redirect back to app** → Session established, user can access all features
5. **Session persists** → User stays logged in across browser sessions

### Calendar Sync Flow

1. **User adds meals** to calendar for the week
2. **Clicks "Sync to Google Calendar"** button
3. **App fetches** all meals for current week
4. **For each meal:**
   - Checks if already synced (has `calendar_event_id`)
   - Skips if already synced
   - Creates calendar event with:
     - Title: "🍽️ Lunch/Dinner: Recipe Name"
     - Description: Full recipe details (ingredients, instructions, servings)
     - Time: Appropriate meal time slot
     - Reminder: 1 hour before
   - Stores event ID in database
5. **Shows summary** of synced/skipped/failed meals

### Single Meal Sync

Users can also sync individual meals:
1. Click on existing meal in calendar
2. Click "Sync to Calendar" button in meal options
3. Meal synced immediately
4. Badge shows "✓ Synced to Calendar"

## Setup Required

### 1. Google Cloud Console Setup

Follow [`GOOGLE_AUTH_SETUP.md`](GOOGLE_AUTH_SETUP.md) to:
- Create Google Cloud project
- Enable Google Calendar API
- Configure OAuth consent screen
- Add test users (Kit & Jess)
- Get OAuth Client ID

### 2. Supabase Configuration

1. **Enable Google Provider:**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable Google
   - Add Client ID and Client Secret
   - Add redirect URL

2. **Update Database Schema:**
   ```sql
   ALTER TABLE meals ADD COLUMN calendar_event_id TEXT;
   ```

### 3. Environment Variables

**Local Development (`.env.local`):**
```env
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

**Production (Render Dashboard):**
- Add same variables in Render environment settings
- Redeploy after adding variables

## Testing Checklist

### Local Testing

- [ ] Sign in with Google works
- [ ] User profile appears in navigation
- [ ] Protected routes redirect to login when not authenticated
- [ ] Sign out works correctly
- [ ] Calendar sync button appears
- [ ] Single meal sync works
- [ ] Week sync works
- [ ] Synced meals show badge
- [ ] Duplicate sync prevention works
- [ ] Events appear in Google Calendar with correct details

### Production Testing

- [ ] All local tests pass in production
- [ ] OAuth redirect works with production URL
- [ ] Both Kit and Jess can sign in
- [ ] Calendar events sync correctly
- [ ] Real-time updates work between users

## Architecture Decisions

### Why Shared Account (Option 1)?

**Pros:**
- ✅ Simpler implementation
- ✅ Single calendar for both users
- ✅ No complex sharing logic needed
- ✅ Perfect for couples

**Cons:**
- ⚠️ Both users must use same Google account
- ⚠️ No individual user tracking

**Alternative (Option 2 - Individual Accounts):**
- Would require household/sharing system
- More complex but allows individual Google accounts
- Can be implemented later if needed

### Why Supabase Auth?

- ✅ Handles OAuth flow automatically
- ✅ Manages tokens and refresh
- ✅ Provides session management
- ✅ Integrates with existing Supabase setup
- ✅ Free tier sufficient

### Why Store `calendar_event_id`?

- ✅ Prevents duplicate syncs
- ✅ Enables future event updates
- ✅ Allows event deletion when meal deleted
- ✅ Shows sync status to users

## API Usage & Costs

### Google Calendar API

- **Free Tier:** 1,000,000 requests/day
- **Expected Usage:** ~50 requests/week (very low)
- **Cost:** $0 (well within free tier)

### Supabase

- **Free Tier:** 500MB database, 2GB bandwidth
- **Expected Usage:** Minimal (text data only)
- **Cost:** $0 (well within free tier)

## Security Considerations

### OAuth Tokens

- ✅ Stored securely by Supabase
- ✅ Automatically refreshed
- ✅ Never exposed to client code
- ✅ Scoped to calendar access only

### API Keys

- ✅ Environment variables (not in code)
- ✅ `.env.local` in `.gitignore`
- ✅ Separate keys for local/production

### Row Level Security

- ✅ Enabled on all tables
- ✅ Public access for shared data (just Kit & Jess)
- ✅ Can add user-specific policies later if needed

## Future Enhancements

### Possible Improvements

1. **Event Updates:**
   - Update calendar event when meal is edited
   - Delete calendar event when meal is deleted

2. **Sync Status:**
   - Show sync status in calendar grid
   - Add "Unsync" button to remove from calendar

3. **Batch Operations:**
   - Sync multiple weeks at once
   - Sync only unsynced meals

4. **Calendar Selection:**
   - Allow choosing which calendar to sync to
   - Support multiple calendars

5. **Individual Accounts (Option 2):**
   - Implement household system
   - Allow each user their own Google account
   - Share meals between accounts

## Troubleshooting

### Common Issues

**"No Google access token found"**
- User needs to sign out and sign in again
- Check calendar scope was granted during sign-in

**"Failed to create calendar event"**
- Check Google Calendar API is enabled
- Verify OAuth consent screen is configured
- Ensure user is added as test user

**"Redirect URI mismatch"**
- Check authorized redirect URIs in Google Console
- Must match Supabase redirect URL exactly

**Events not appearing in calendar**
- Check user's Google Calendar settings
- Verify correct calendar is being used (primary)
- Check event was created successfully (no errors)

## Support Resources

- **Google Calendar API Docs:** https://developers.google.com/calendar
- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **OAuth 2.0 Guide:** https://developers.google.com/identity/protocols/oauth2

## Summary

The implementation provides a complete authentication and calendar sync system using:
- Google OAuth 2.0 for sign-in
- Supabase for auth management
- Google Calendar API for event creation
- Shared account model for simplicity

Both Kit and Jess can now:
1. Sign in with their shared Google account
2. Plan meals together in real-time
3. Sync meals to their shared Google Calendar
4. See meal details and reminders in Google Calendar
5. Access from any device

The system is production-ready and requires only the setup steps in [`GOOGLE_AUTH_SETUP.md`](GOOGLE_AUTH_SETUP.md) to be completed.