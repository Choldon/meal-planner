# Two-Way Google Calendar Sync - Architecture & Implementation Plan

## Overview

This document outlines the architecture and implementation plan for bidirectional synchronization between the Meal Planner app and Google Calendar.

## Current State (One-Way Sync)

**What Works:**
- ✅ Meal Planner → Google Calendar sync
- ✅ Events created with format: `* Lunch: Recipe Name` or `Dinner: Recipe Name`
- ✅ Event descriptions include who it's for and link to meal planner
- ✅ All-day events
- ✅ Duplicate prevention via `calendar_event_id` tracking

**Limitations:**
- ❌ No sync from Google Calendar → Meal Planner
- ❌ Manual edits in Google Calendar don't reflect in Meal Planner
- ❌ Events added directly to Google Calendar aren't imported

## Proposed Feature: Two-Way Sync

### User Story

**As a user, I want to:**
1. Add meal events directly in Google Calendar
2. Have them automatically appear in my Meal Planner
3. Match events to existing recipes automatically
4. Be prompted to create new recipes for unmatched events
5. Keep both calendars in sync bidirectionally

### Use Cases

**UC1: Import Existing Google Calendar Events**
- User clicks "Import from Google Calendar" button
- System fetches events matching meal pattern
- System matches events to recipes
- User reviews and confirms import

**UC2: Auto-Sync New Google Calendar Events**
- User adds event in Google Calendar with format `Lunch: Pasta`
- System detects new event (polling or webhook)
- System matches to recipe or prompts user
- Event appears in Meal Planner

**UC3: Handle Unknown Recipes**
- Event title: `Dinner: Thai Green Curry`
- Recipe not in database
- System shows notification: "Recipe 'Thai Green Curry' not found"
- User can: Create recipe, Link to existing recipe, or Ignore

**UC4: Sync Edits**
- User edits event in Google Calendar
- Changes sync to Meal Planner
- Vice versa

**UC5: Sync Deletions**
- User deletes event in Google Calendar
- Meal removed from Meal Planner
- Vice versa

## Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Meal Planner App                        │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Calendar   │◄────────┤  Sync Engine │                │
│  │  Component   │────────►│              │                │
│  └──────────────┘         └──────┬───────┘                │
│                                   │                         │
│  ┌──────────────┐                │                         │
│  │   Recipes    │                │                         │
│  │  Component   │◄───────────────┘                         │
│  └──────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ API Calls
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Google Calendar API                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Events     │  │   Create     │  │   Update     │    │
│  │   List       │  │   Event      │  │   Event      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Store
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Database                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    meals     │  │   recipes    │  │  sync_log    │    │
│  │              │  │              │  │              │    │
│  │ + calendar_  │  │              │  │ + event_id   │    │
│  │   event_id   │  │              │  │ + sync_time  │    │
│  │ + last_sync  │  │              │  │ + direction  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

#### 1. Sync Engine (`src/utils/syncEngine.js`)

**Responsibilities:**
- Orchestrate bidirectional sync
- Detect conflicts
- Resolve sync issues
- Maintain sync state

**Key Functions:**
```javascript
// Fetch events from Google Calendar
fetchGoogleCalendarEvents(startDate, endDate)

// Parse event title to extract meal type and recipe name
parseEventTitle(eventTitle)

// Match event to existing recipe
matchEventToRecipe(recipeName, recipes)

// Import events from Google Calendar
importFromGoogleCalendar(events, recipes)

// Sync changes bidirectionally
syncBidirectional()

// Handle conflict resolution
resolveConflict(localMeal, remoteMeal)
```

#### 2. Event Parser (`src/utils/eventParser.js`)

**Responsibilities:**
- Parse Google Calendar event titles
- Extract meal type (Lunch/Dinner)
- Extract recipe name
- Validate event format

**Pattern Matching:**
```javascript
// Patterns to match:
// "* Lunch: Recipe Name"
// "Lunch: Recipe Name"
// "Dinner: Recipe Name"

const MEAL_PATTERN = /^(\*\s*)?(Lunch|Dinner):\s*(.+)$/i;
```

#### 3. Recipe Matcher (`src/utils/recipeMatcher.js`)

**Responsibilities:**
- Fuzzy match recipe names
- Handle variations (case, spacing, punctuation)
- Suggest similar recipes
- Calculate match confidence

**Matching Strategy:**
```javascript
// Exact match (case-insensitive)
// Fuzzy match (Levenshtein distance)
// Partial match (contains)
// Suggest alternatives if no match
```

#### 4. Sync UI Components

**New Components:**
- `ImportModal.js` - UI for importing Google Calendar events
- `RecipeMatchModal.js` - UI for matching unknown recipes
- `SyncStatusIndicator.js` - Shows sync status
- `ConflictResolutionModal.js` - Resolves sync conflicts

### Database Schema Changes

#### Update `meals` table:
```sql
ALTER TABLE meals ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS sync_source TEXT DEFAULT 'meal_planner';
-- sync_source: 'meal_planner' | 'google_calendar'
```

#### Create `sync_log` table:
```sql
CREATE TABLE sync_log (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL,
  meal_id BIGINT REFERENCES meals(id) ON DELETE CASCADE,
  sync_direction TEXT NOT NULL, -- 'to_google' | 'from_google' | 'bidirectional'
  sync_status TEXT NOT NULL, -- 'success' | 'failed' | 'conflict'
  sync_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  metadata JSONB
);

CREATE INDEX idx_sync_log_event_id ON sync_log(event_id);
CREATE INDEX idx_sync_log_meal_id ON sync_log(meal_id);
CREATE INDEX idx_sync_log_sync_time ON sync_log(sync_time);
```

#### Create `unmatched_events` table:
```sql
CREATE TABLE unmatched_events (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_title TEXT NOT NULL,
  event_date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'matched' | 'ignored'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_recipe_id BIGINT REFERENCES recipes(id)
);
```

## Implementation Plan

### Phase 1: Database Schema Updates ✅ READY FOR TESTING

**Status:** Migration scripts created, ready to apply in Supabase

**Branch Strategy:**
```bash
# Feature branch created
git checkout -b feature/two-way-calendar-sync
```

**Completed Tasks:**
- [x] Create feature branch
- [x] Design database schema updates
- [x] Create migration script (`database/migrations/002_two_way_sync_schema.sql`)
- [x] Create migration documentation (`database/migrations/README.md`)

**Migration Includes:**
- [x] Added `last_synced_at` and `sync_source` columns to `meals` table
- [x] Created `sync_log` table for tracking sync operations
- [x] Created `unmatched_events` table for events without matching recipes
- [x] Created helper functions (`get_unmatched_events_count`, `log_sync_operation`)
- [x] Created views (`recent_sync_activity`, `pending_unmatched_events`)
- [x] Enabled Row Level Security (RLS) on new tables
- [x] Added indexes for optimal performance

**Next Step:** Apply migration in Supabase Dashboard (see `database/migrations/README.md`)

### Phase 2: Core Sync Engine

**Files to Create:**
- `src/utils/syncEngine.js`
- `src/utils/eventParser.js`
- `src/utils/recipeMatcher.js`
- `src/utils/conflictResolver.js`

**Tasks:**
- [ ] Implement Google Calendar event fetching
- [ ] Implement event title parsing
- [ ] Implement recipe matching algorithm
- [ ] Implement conflict detection
- [ ] Add comprehensive error handling
- [ ] Write unit tests

### Phase 3: Import Functionality

**Files to Create:**
- `src/components/ImportModal.js`
- `src/components/RecipeMatchModal.js`
- `src/styles/ImportModal.css`

**Files to Modify:**
- `src/components/Calendar.js` - Add "Import from Google Calendar" button
- `src/utils/googleCalendar.js` - Add fetch functions

**Tasks:**
- [ ] Create import UI
- [ ] Implement event fetching
- [ ] Implement recipe matching UI
- [ ] Handle unmatched recipes
- [ ] Add import confirmation
- [ ] Test import flow

### Phase 4: Automatic Sync

**Sync Strategies:**

**Option A: Polling (Simpler)**
- Poll Google Calendar every N minutes
- Compare with local meals
- Sync differences

**Option B: Webhooks (More Complex)**
- Set up Google Calendar push notifications
- Requires server endpoint
- Real-time updates

**Recommendation:** Start with Option A (Polling)

**Tasks:**
- [ ] Implement polling mechanism
- [ ] Add sync interval configuration
- [ ] Implement change detection
- [ ] Handle sync conflicts
- [ ] Add sync status indicator
- [ ] Test automatic sync

### Phase 5: Conflict Resolution

**Conflict Scenarios:**
1. Same meal edited in both places
2. Meal deleted in one place, edited in another
3. Different recipes for same slot

**Resolution Strategies:**
- Last-write-wins (with timestamp)
- User choice (show conflict modal)
- Merge strategies (combine data)

**Tasks:**
- [ ] Implement conflict detection
- [ ] Create conflict resolution UI
- [ ] Implement resolution strategies
- [ ] Test conflict scenarios
- [ ] Document conflict handling

### Phase 6: UI/UX Enhancements

**New UI Elements:**
- Sync status indicator (syncing/synced/error)
- Import button in calendar header
- Unmatched recipes notification badge
- Sync settings panel

**Tasks:**
- [ ] Design sync UI components
- [ ] Implement sync status indicator
- [ ] Add import button
- [ ] Create settings panel
- [ ] Add loading states
- [ ] Implement error messages

### Phase 7: Testing & Refinement

**Test Scenarios:**
1. Import events from Google Calendar
2. Match events to existing recipes
3. Handle unmatched recipes
4. Sync edits bidirectionally
5. Handle deletions
6. Resolve conflicts
7. Handle API errors
8. Test with multiple users

**Tasks:**
- [ ] Write integration tests
- [ ] Test all sync scenarios
- [ ] Test error handling
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Fix bugs
- [ ] Optimize performance

### Phase 8: Documentation & Deployment

**Documentation:**
- Update user guide
- Add sync troubleshooting guide
- Document API usage
- Create developer guide

**Tasks:**
- [ ] Write user documentation
- [ ] Update README
- [ ] Create troubleshooting guide
- [ ] Merge feature branch to main
- [ ] Deploy to production
- [ ] Monitor for issues

## Technical Considerations

### API Rate Limits

**Google Calendar API:**
- Free tier: 1,000,000 requests/day
- Quota per user: 1,000 requests/100 seconds
- Recommended: Cache events, batch requests

**Strategy:**
- Fetch events once per sync cycle
- Cache for 5-10 minutes
- Use incremental sync (only fetch changes)

### Performance

**Optimization Strategies:**
- Lazy load sync engine
- Debounce sync operations
- Use background workers for sync
- Implement pagination for large datasets
- Cache recipe matches

### Security

**Considerations:**
- Validate all event data
- Sanitize recipe names
- Prevent injection attacks
- Rate limit sync operations
- Log all sync activities

### Error Handling

**Error Categories:**
1. Network errors (API unavailable)
2. Authentication errors (token expired)
3. Permission errors (calendar access denied)
4. Data errors (invalid event format)
5. Conflict errors (sync conflicts)

**Handling Strategy:**
- Graceful degradation
- User-friendly error messages
- Retry logic with exponential backoff
- Error logging and monitoring

## User Experience Flow

### Import Flow

```
1. User clicks "Import from Google Calendar"
   ↓
2. System fetches events from Google Calendar
   ↓
3. System parses event titles
   ↓
4. System matches events to recipes
   ↓
5. Show import preview modal:
   - Matched events (green checkmark)
   - Unmatched events (yellow warning)
   ↓
6. User reviews and confirms
   ↓
7. For unmatched events:
   - Show recipe match modal
   - User can: Create recipe, Link existing, or Skip
   ↓
8. Import confirmed events
   ↓
9. Show success message with summary
```

### Auto-Sync Flow

```
1. Background sync runs every 10 minutes
   ↓
2. Fetch recent Google Calendar changes
   ↓
3. Compare with local meals
   ↓
4. Detect changes:
   - New events → Import
   - Modified events → Update
   - Deleted events → Remove
   ↓
5. If conflicts detected:
   - Show notification
   - User resolves via modal
   ↓
6. Apply changes
   ↓
7. Update sync status indicator
```

## Future Enhancements

### Phase 9+: Advanced Features

1. **Smart Recipe Suggestions**
   - ML-based recipe matching
   - Learn from user corrections
   - Suggest similar recipes

2. **Bulk Operations**
   - Import entire month
   - Batch recipe matching
   - Mass conflict resolution

3. **Sync History**
   - View sync log
   - Undo sync operations
   - Audit trail

4. **Multiple Calendars**
   - Sync with multiple Google Calendars
   - Calendar-specific settings
   - Calendar selection UI

5. **Webhook Support**
   - Real-time sync via webhooks
   - Instant updates
   - Reduced API calls

## Success Metrics

**Key Performance Indicators:**
- Sync success rate > 95%
- Average sync time < 5 seconds
- Conflict rate < 5%
- User satisfaction score > 4/5
- API error rate < 1%

## Risks & Mitigation

### Risk 1: API Rate Limits
**Mitigation:** Implement caching, batch requests, use incremental sync

### Risk 2: Sync Conflicts
**Mitigation:** Clear conflict resolution UI, last-write-wins default

### Risk 3: Data Loss
**Mitigation:** Comprehensive logging, backup before sync, undo functionality

### Risk 4: Performance Issues
**Mitigation:** Background sync, lazy loading, pagination

### Risk 5: User Confusion
**Mitigation:** Clear UI, helpful error messages, comprehensive documentation

## Conclusion

This two-way sync feature will significantly enhance the meal planner by:
- ✅ Allowing flexible meal planning in either app
- ✅ Keeping both calendars automatically in sync
- ✅ Reducing manual data entry
- ✅ Improving user experience

**Estimated Development Time:** 3-4 weeks
**Complexity:** High
**Priority:** Medium (nice-to-have enhancement)

**Recommendation:** Implement in phases, starting with manual import (Phase 3) before automatic sync (Phase 4).

---

## Next Steps

1. **Review this architecture** with stakeholders
2. **Create Git branch** for feature development
3. **Start with Phase 1** (Database setup)
4. **Implement Phase 2-3** (Core engine + Import)
5. **Test thoroughly** before moving to automatic sync
6. **Iterate based on feedback**

---

*Document Version: 1.0*
*Last Updated: 2025-11-11*
*Author: Roo (AI Assistant)*