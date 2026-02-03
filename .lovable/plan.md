

# FitKits Admin App - Complete Deployment Readiness Plan

## Executive Summary

This plan covers all remaining work to deploy the FitKits Admin App to the Apple App Store and Google Play Store, organized into actionable phases.

---

## Phase 1: Fix Routing Issues

### 1.1 Profile Menu Route Mismatches

**File**: `src/pages/Profile.tsx` (lines 12-19)

| Current Route | Expected Route | Status |
|---------------|----------------|--------|
| `/settings/edit-profile` | `/settings/edit-profile` | OK |
| `/notifications` | `/notifications` | OK |
| `/payment-methods` | `/payment-methods` | OK |
| `/security` | `/security` | OK |
| `/settings` | Should be `/app-settings` | BROKEN |
| `/support/help` | Should be `/help` | BROKEN |

**Fix Required**:
```typescript
const menuItems = [
  { icon: User, label: "Edit Profile", href: "/settings/edit-profile" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: CreditCard, label: "Payment Methods", href: "/payment-methods" },
  { icon: Shield, label: "Security", href: "/security" },
  { icon: Settings, label: "Settings", href: "/app-settings" },      // FIX
  { icon: HelpCircle, label: "Help & Support", href: "/help" },      // FIX
];
```

### 1.2 Delete Unused Index.tsx

**File**: `src/pages/Index.tsx`

This file displays "Welcome to Your Blank App" - default boilerplate that should be removed. It's not referenced in the router but exists in the codebase.

**Action**: Delete file entirely.

---

## Phase 2: Placeholder Features Inventory

### Complete List of Placeholder Features

| Feature | File | Line | Current Behavior | Recommendation |
|---------|------|------|------------------|----------------|
| **Two-Factor Auth** | `Security.tsx` | 51 | Shows "coming soon" toast | Remove toggle OR hide section |
| **Two-Factor Auth** | `AppSettings.tsx` | 140-144 | Toggle exists but does nothing | Remove toggle OR hide section |
| **Payment Methods** | `PaymentMethods.tsx` | 10 | Shows "coming soon" toast | Hide from Profile menu |
| **Call Feature** | `Bookings.tsx` | 129 | Shows "coming soon" toast | Implement `tel:` link or remove button |
| **Cancel Booking** | `Bookings.tsx` | 134 | "Contact support" message | Acceptable (intentional) |
| **Multi-language** | `AppSettings.tsx` | 117-121 | 5 languages listed, only English works | Remove non-English options |
| **Contact Form** | `ContactUs.tsx` | 30 | Simulates API with setTimeout | Acceptable (or connect to backend) |
| **Help Centre Search** | `HelpCentre.tsx` | 57-62 | Search input does nothing | Make functional or remove |
| **Help Categories** | `HelpCentre.tsx` | 69-88 | Buttons don't navigate anywhere | Add article pages or remove counts |
| **About Stats** | `AboutUs.tsx` | 28-33 | Hardcoded "500+ Venues, 50K+ Bookings" | Replace with real data or remove |

### Recommended Actions

**Must Fix (Store Rejection Risk)**:
1. Remove Two-Factor Auth toggle from both Security.tsx and AppSettings.tsx
2. Remove non-English language options from AppSettings.tsx
3. Hide Payment Methods from Profile menu (or implement)

**Should Fix (Poor UX)**:
4. Implement Call button with actual `tel:` link using user's phone
5. Make Help Centre search functional or remove the input
6. Remove article counts from Help categories (they're not clickable)

**Nice to Have**:
7. Replace hardcoded About stats with real database counts
8. Connect Contact form to actual email backend

---

## Phase 3: Native Assets Requirements

### 3.1 Current Assets (Missing)

**Directory**: `public/`

| Asset | Current | Required |
|-------|---------|----------|
| `favicon.ico` | Exists | Update to FitKits icon |
| `placeholder.svg` | Exists | Can remove (not used) |
| App Icon (iOS) | Missing | 1024x1024 PNG |
| App Icon (Android) | Missing | 512x512 PNG |
| Splash Screen (iOS) | Missing | Multiple sizes |
| Splash Screen (Android) | Missing | Multiple sizes |
| OG Image | Missing (uses Lovable) | 1200x630 PNG |

### 3.2 iOS App Icon Requirements

Must provide via Xcode Asset Catalog:

| Size | Scale | Pixels | Usage |
|------|-------|--------|-------|
| 20pt | 2x | 40x40 | Notifications |
| 20pt | 3x | 60x60 | Notifications |
| 29pt | 2x | 58x58 | Settings |
| 29pt | 3x | 87x87 | Settings |
| 40pt | 2x | 80x80 | Spotlight |
| 40pt | 3x | 120x120 | Spotlight |
| 60pt | 2x | 120x120 | Home Screen |
| 60pt | 3x | 180x180 | Home Screen |
| 1024pt | 1x | 1024x1024 | App Store |

### 3.3 Android App Icon Requirements

| Density | Size | Location |
|---------|------|----------|
| mdpi | 48x48 | `android/app/src/main/res/mipmap-mdpi/` |
| hdpi | 72x72 | `android/app/src/main/res/mipmap-hdpi/` |
| xhdpi | 96x96 | `android/app/src/main/res/mipmap-xhdpi/` |
| xxhdpi | 144x144 | `android/app/src/main/res/mipmap-xxhdpi/` |
| xxxhdpi | 192x192 | `android/app/src/main/res/mipmap-xxxhdpi/` |
| Play Store | 512x512 | Upload separately |

### 3.4 Splash Screen Requirements

**iOS** (via Xcode):
- Single vector or high-res image
- Use LaunchScreen.storyboard

**Android** (via `android/app/src/main/res/`):
- `drawable-land-hdpi/` through `drawable-port-xxxhdpi/`
- Use `@capacitor/splash-screen` plugin for configuration

### 3.5 Web Assets to Add to `/public`

```text
public/
├── favicon.ico (update with FitKits icon)
├── apple-touch-icon.png (180x180)
├── icon-192.png (for PWA)
├── icon-512.png (for PWA)
├── og-image.png (1200x630 for social sharing)
└── splash/ (optional for PWA)
```

---

## Phase 4: Native Build Configuration

### 4.1 Capacitor Config Update

**File**: `capacitor.config.ts`

**Current** (Development Mode - Hot Reload):
```typescript
const config: CapacitorConfig = {
  appId: 'com.fitkits.admin',
  appName: 'FitKits',
  webDir: 'dist',
  server: {
    url: 'https://68412e49-c447-42d0-9ba8-f057430cb0a6.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};
```

**Production** (Bundled App - Required for Store):
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitkits.admin',
  appName: 'FitKits',
  webDir: 'dist',
  // REMOVE server block for production builds
  // The app will use the bundled dist/ folder instead
};

export default config;
```

### 4.2 Local Build Process

After exporting to GitHub:

```text
1. git clone <your-repo>
2. npm install
3. npm run build
4. npx cap add ios          (first time only)
5. npx cap add android      (first time only)
6. npx cap sync
7. npx cap open ios         (opens Xcode)
8. npx cap open android     (opens Android Studio)
```

### 4.3 iOS-Specific Configuration

In Xcode after opening:

1. **Bundle Identifier**: Verify `com.fitkits.admin`
2. **Signing**: Add Apple Developer Team
3. **App Icons**: Drag 1024x1024 to Asset Catalog
4. **Splash Screen**: Configure LaunchScreen.storyboard
5. **Version**: Set to 1.0.0 (build 1)
6. **Minimum iOS**: 13.0 (Capacitor default)

### 4.4 Android-Specific Configuration

In Android Studio after opening:

1. **Package Name**: Verify `com.fitkits.admin`
2. **Signing**: Create or add release keystore
3. **App Icons**: Add to `res/mipmap-*` folders
4. **Splash Screen**: Configure via plugin or drawable
5. **Version**: Set versionCode=1, versionName="1.0.0"
6. **Minimum SDK**: 22 (Capacitor default)

---

## Phase 5: Branding & Metadata Updates

### 5.1 Update index.html

**File**: `index.html`

Replace Lovable images with FitKits assets:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FitKits - Venue Management</title>
    <meta name="description" content="Manage your sports venues, bookings, and analytics with FitKits" />
    <meta name="author" content="FitKits" />
    
    <!-- PWA meta tags -->
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="theme-color" content="#10b981" />
    
    <!-- Open Graph - UPDATE IMAGES -->
    <meta property="og:title" content="FitKits - Venue Management" />
    <meta property="og:description" content="Manage your sports venues, bookings, and analytics with FitKits" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="/og-image.png" />
    
    <!-- Twitter - UPDATE IMAGES -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@FitKits" />
    <meta name="twitter:image" content="/og-image.png" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 5.2 Assets Needed

| Asset | Dimensions | Purpose | Format |
|-------|------------|---------|--------|
| App Icon Master | 1024x1024 | Source for all icons | PNG (no alpha for iOS) |
| OG Image | 1200x630 | Social media sharing | PNG/JPG |
| Apple Touch Icon | 180x180 | iOS home screen | PNG |
| Favicon | 32x32 or ICO | Browser tab | ICO/PNG |
| Feature Graphic | 1024x500 | Play Store header | PNG/JPG |

### 5.3 Design Recommendations

Based on current branding in `AboutUs.tsx`:
- **Logo**: "FK" text in white on primary color background
- **Primary Color**: Green (`#10b981` - success/emerald)
- **Style**: Modern, rounded corners (2xl radius)

---

## Phase 6: Store Submission Checklist

### 6.1 Apple App Store Requirements

| Item | Status | Action |
|------|--------|--------|
| Apple Developer Account ($99/yr) | Unknown | User must purchase |
| App Icon 1024x1024 | Missing | Create |
| Screenshots (6.7", 6.5", 5.5") | Missing | Capture after fixes |
| Privacy Policy URL | Ready | `https://<domain>/privacy-policy` |
| Support URL | Ready | `https://<domain>/contact` |
| App Description | Not written | Write 4000 char max |
| Keywords | Not defined | Research relevant terms |
| Age Rating | Not submitted | Complete questionnaire |
| App Review Guidelines | Needs check | Test all features work |

### 6.2 Google Play Store Requirements

| Item | Status | Action |
|------|--------|--------|
| Google Play Developer ($25 one-time) | Unknown | User must purchase |
| App Icon 512x512 | Missing | Create |
| Feature Graphic 1024x500 | Missing | Create |
| Screenshots (phone + 7" + 10" tablet) | Missing | Capture |
| Short Description (80 chars) | Not written | Write |
| Full Description (4000 chars) | Not written | Write |
| Privacy Policy URL | Ready | Add to listing |
| Content Rating | Not completed | Complete IARC |
| Target Audience | Not declared | Select 18+ |
| Data Safety Form | Not completed | Complete form |

---

## Implementation Summary

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Profile.tsx` | Fix 2 route paths |
| `src/pages/settings/Security.tsx` | Remove 2FA toggle |
| `src/pages/settings/AppSettings.tsx` | Remove 2FA toggle + non-English languages |
| `src/pages/Bookings.tsx` | Implement Call button with tel: link or remove |
| `capacitor.config.ts` | Remove server block for production |
| `index.html` | Replace OG images, add PWA meta tags |

### Files to Delete

| File | Reason |
|------|--------|
| `src/pages/Index.tsx` | Unused boilerplate |

### Files to Create

| File | Purpose |
|------|---------|
| `public/og-image.png` | Social sharing image |
| `public/apple-touch-icon.png` | iOS home screen icon |
| `public/icon-192.png` | PWA icon |
| `public/icon-512.png` | PWA icon |

### Optional: Hide Incomplete Features

If Payment Methods integration isn't ready, hide it from Profile menu:
```typescript
// In Profile.tsx, remove this line from menuItems:
{ icon: CreditCard, label: "Payment Methods", href: "/payment-methods" },
```

---

## Timeline Estimate

| Phase | Work | Time |
|-------|------|------|
| Phase 1: Route Fixes | 2 file edits | 15 min |
| Phase 2: Placeholder Cleanup | 4 file edits | 30 min |
| Phase 3: Asset Creation | Design work | 2-4 hours |
| Phase 4: Build Config | 1 file edit + local setup | 30 min |
| Phase 5: Branding | 1 file edit + assets | 30 min |
| Phase 6: Store Prep | Screenshots, descriptions | 2-3 hours |
| **Total** | | **6-9 hours** |

