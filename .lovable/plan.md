

# Production Readiness Plan: Replace Mock Data and Prepare for App Store Submission

## Overview

This plan addresses all remaining work needed to make the application production-ready for App Store and Play Store submission. The work is organized into 4 phases.

---

## Phase 1: Session Stability Fix

**Goal**: Prevent random user switching in the preview environment

### Changes

**File: `src/lib/supabase.ts`**
- Add a unique `storageKey` to isolate Supabase sessions from Lovable preview tokens

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'fitkits-admin-auth', // Isolates session from preview
  }
});
```

---

## Phase 2: Profile Page - Real User Data

**Goal**: Replace hardcoded "John Doe" with authenticated user data

### Changes

**File: `src/pages/Profile.tsx`**

1. Import `useAuth` hook and `useQuery` from TanStack Query
2. Get real user email and display name from `user` object
3. Fetch real statistics (venues count, bookings count, revenue) from Supabase
4. Add working navigation for menu items (Edit Profile, Settings, etc.)
5. Implement actual logout functionality using `signOut`

| Element | Current (Mock) | After (Real) |
|---------|---------------|--------------|
| Avatar initials | "JD" | First letter of user email/name |
| Name | "John Doe" | `user.user_metadata.display_name` or email |
| Email | "john.doe@example.com" | `user.email` |
| Venues count | "3" | Query `venues` table for owner_id |
| Bookings count | "156" | Query `bookings` table for owner's venues |
| Revenue | "$12.5k" | Sum `price` from `bookings` for owner's venues |
| Logout button | No action | Calls `signOut()` and navigates to login |

---

## Phase 3: Edit Profile - Actual Save Functionality

**Goal**: Make the profile update actually save to Supabase

### Changes

**File: `src/pages/settings/EditProfile.tsx`**

1. Replace simulated API call with actual Supabase `updateUser`:
```typescript
const { error } = await supabase.auth.updateUser({
  data: {
    display_name: formData.displayName,
    phone: formData.phone,
  }
});
```

2. Handle errors properly and show toast feedback

---

## Phase 4: App Branding and Store Configuration

**Goal**: Update all branding and metadata for production

### Changes

**File: `capacitor.config.ts`**
```typescript
const config: CapacitorConfig = {
  appId: 'com.fitkits.admin',  // Production app ID
  appName: 'FitKits',          // Real app name
  webDir: 'dist',
  // Remove or update server URL for production builds
};
```

**File: `index.html`**
- Update `<title>` to "FitKits - Venue Management"
- Update `og:title` and `og:description` meta tags
- Update `description` meta tag
- Update author to your company name

---

## Technical Details

### Profile Page Data Fetching

A new query will be added to fetch profile statistics:

```typescript
// In src/pages/Profile.tsx
const { user, signOut } = useAuth();

// Fetch owner stats
const { data: stats, isLoading } = useQuery({
  queryKey: ['profile-stats', user?.id],
  queryFn: async () => {
    if (!user) return { venuesCount: 0, bookingsCount: 0, totalRevenue: 0 };
    
    // Get venues count
    const { count: venuesCount } = await supabase
      .from('venues')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id);
    
    // Get venue IDs for bookings query
    const { data: venues } = await supabase
      .from('venues')
      .select('id')
      .eq('owner_id', user.id);
    
    const venueIds = venues?.map(v => v.id) || [];
    
    if (venueIds.length === 0) {
      return { venuesCount: venuesCount || 0, bookingsCount: 0, totalRevenue: 0 };
    }
    
    // Get bookings stats
    const { data: bookings } = await supabase
      .from('bookings')
      .select('price')
      .in('venue_id', venueIds)
      .neq('status', 'cancelled');
    
    return {
      venuesCount: venuesCount || 0,
      bookingsCount: bookings?.length || 0,
      totalRevenue: bookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0,
    };
  },
  enabled: !!user,
});
```

### Currency Formatting

Revenue will be formatted in INR (Indian Rupees):

```typescript
const formatCurrency = (amount: number) => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`; // Lakhs
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }
  return `₹${amount}`;
};
```

---

## Files to be Modified

| File | Changes |
|------|---------|
| `src/lib/supabase.ts` | Add storageKey for session isolation |
| `src/pages/Profile.tsx` | Replace mock data with real user data, add navigation, add logout |
| `src/pages/settings/EditProfile.tsx` | Implement actual Supabase profile update |
| `capacitor.config.ts` | Update appId and appName |
| `index.html` | Update meta tags and title |

---

## Items NOT Addressed (Require Manual Steps)

These items cannot be done through code and require action in external systems:

1. **App Icons**: You need to create a 1024x1024 source icon and generate all required sizes for iOS (29x29 to 1024x1024) and Android (mdpi to xxxhdpi)

2. **Splash Screens**: Generate splash screen images for all device sizes

3. **Native Build**: After code changes, you must:
   - Export to GitHub
   - Clone repository locally
   - Run `npx cap add ios` and `npx cap add android`
   - Build in Xcode (iOS) and Android Studio (Android)

4. **App Store Assets**: 
   - Screenshots for all device sizes
   - App description
   - Privacy policy URL
   - Support URL

5. **Apple Developer Account**: Required for App Store submission ($99/year)

6. **Google Play Console Account**: Required for Play Store submission ($25 one-time)

---

## Summary

This plan transforms the application from a prototype with mock data to a production-ready app with:

- Stable authentication sessions
- Real user profile data from Supabase
- Working profile update functionality  
- Proper app branding and metadata
- Clean separation of demo vs. production configuration

