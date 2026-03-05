

# Event Logs Feature -- Master Admin Only

## Overview

Build an "Event Logs" page querying the `event_logs` table directly (separate from the existing `admin_audit_log`-based Audit Log). Restricted to master admin only. Includes all 15 event types: the original 11 plus the 4 new ones (`booking_cancelled_user`, `user_signup`, `event_registration`, `host_event_request_submitted`).

## Changes

### 1. Add Event Log types and query function to `src/lib/directApi.ts`

- Add `EventLog` interface: `id`, `event_type`, `actor_id`, `target_id`, `target_type`, `metadata` (Record), `created_at`
- Add `EventLogParams` with optional filters: `eventType`, `targetType`, `startDate`, `endDate`, `page`, `limit`
- Add `getEventLogs` function querying `event_logs` table with ordering, filtering, and pagination
- Add `getActorProfiles` helper that batch-fetches `profiles.full_name` for an array of actor_ids

### 2. Create `src/pages/admin/EventLogs.tsx`

New page using `AdminLayout`, matching the existing AuditLog card-based style:

- **Filter bar**: Event type select (all 15 types), target type select (`booking`, `venue`, `event`, `user`, `slot`, `payment`, `host_request`), date range with two date inputs
- **Log cards**: Icon by target_type, color-coded badge for event_type (destructive for cancels/deletes/deactivations, success for creates/confirms/signups/registrations), actor name resolved from profiles, timestamp
- **Expandable metadata**: Collapsible section on each card showing formatted key-value pairs from the JSONB metadata field
- **Pagination**: Same Previous/Next pattern as AuditLog
- **Empty state**: Icon + message

All 15 event types supported:
`booking_confirmed`, `payment_initiated`, `payment_completed`, `booking_cancelled_admin`, `booking_cancelled_user`, `venue_created`, `venue_updated`, `event_cancelled`, `event_deleted`, `user_deactivated`, `user_signup`, `slot_blocked`, `slot_unblocked`, `event_registration`, `host_event_request_submitted`

### 3. Update `src/App.tsx`

- Import `EventLogs` page
- Add `/event-logs` route inside the `isMasterAdmin` block (alongside `/manage-owners`), in both route definition blocks

### 4. Update `src/components/layout/AdminLayout.tsx`

- Import `Activity` icon from lucide-react
- Add "Event Logs" link in the Master Admin sidebar section (next to "Manage Owners"), visible only when `isMasterAdmin` is true

## Files Modified

| File | Change |
|------|--------|
| `src/lib/directApi.ts` | Add EventLog types, getEventLogs, getActorProfiles |
| `src/pages/admin/EventLogs.tsx` | New page |
| `src/App.tsx` | Add route |
| `src/components/layout/AdminLayout.tsx` | Add sidebar link |

