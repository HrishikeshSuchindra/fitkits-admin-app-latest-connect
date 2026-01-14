import { supabase, FUNCTIONS_URL } from './supabase';

async function callAdminApi<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${FUNCTIONS_URL}/${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (response.status === 403) throw new Error('Admin access required');
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API request failed' }));
    throw new Error(error.message || 'API request failed');
  }
  
  return response.json();
}

// Users API
export interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  role?: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UserParams {
  search?: string;
  status?: 'active' | 'inactive';
  role?: 'admin' | 'moderator' | 'user';
  page?: number;
  limit?: number;
}

// Bookings API
export interface Booking {
  id: string;
  user_id: string;
  venue_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  total_amount: number;
  created_at: string;
  user?: { full_name: string; email: string };
  venue?: { name: string };
}

export interface BookingsResponse {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
}

export interface BookingParams {
  status?: string;
  venueId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Venues API
export interface Venue {
  id: string;
  name: string;
  category: string;
  sport: string;
  location: string;
  address: string;
  price_per_hour: number;
  is_active: boolean;
  image_url: string | null;
  amenities: string[];
  created_at: string;
}

export interface VenuesResponse {
  venues: Venue[];
  total: number;
  page: number;
  limit: number;
}

export interface VenueParams {
  category?: string;
  sport?: string;
  active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// Events API
export interface Event {
  id: string;
  title: string;
  sport: string;
  event_type: string;
  host_id: string;
  venue_id: string;
  start_date: string;
  end_date: string;
  status: string;
  max_participants: number;
  is_featured: boolean;
  created_at: string;
  host?: { full_name: string };
  venue?: { name: string };
}

export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

export interface EventParams {
  status?: string;
  sport?: string;
  type?: string;
  hostId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Analytics API
export interface AnalyticsOverview {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  activeVenues: number;
  userGrowth: number;
  bookingGrowth: number;
  revenueGrowth: number;
}

export interface AnalyticsData {
  overview?: AnalyticsOverview;
  revenue?: { date: string; amount: number }[];
  users?: { date: string; count: number }[];
  bookings?: { date: string; count: number }[];
}

// Audit Log
export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
  admin?: { full_name: string; email: string };
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

function buildQueryString(params: object): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const adminApi = {
  // Users
  getUsers: (params: UserParams = {}) => 
    callAdminApi<UsersResponse>(`admin-users${buildQueryString(params)}`),
  
  deactivateUser: (userId: string, reason: string) => 
    callAdminApi('admin-users', {
      method: 'PATCH',
      body: JSON.stringify({ userId, action: 'deactivate', reason })
    }),
  
  reactivateUser: (userId: string) => 
    callAdminApi('admin-users', {
      method: 'PATCH',
      body: JSON.stringify({ userId, action: 'reactivate' })
    }),
  
  setUserRole: (userId: string, role: 'admin' | 'moderator' | 'user') => 
    callAdminApi('admin-users', {
      method: 'PATCH',
      body: JSON.stringify({ userId, action: 'set_role', role })
    }),

  // Bookings
  getBookings: (params: BookingParams = {}) => 
    callAdminApi<BookingsResponse>(`admin-bookings${buildQueryString(params)}`),
  
  cancelBooking: (bookingId: string, reason: string) => 
    callAdminApi('admin-bookings', {
      method: 'PATCH',
      body: JSON.stringify({ bookingId, action: 'cancel', reason })
    }),
  
  refundBooking: (bookingId: string, reason: string) => 
    callAdminApi('admin-bookings', {
      method: 'PATCH',
      body: JSON.stringify({ bookingId, action: 'refund', reason })
    }),

  // Venues
  getVenues: (params: VenueParams = {}) => 
    callAdminApi<VenuesResponse>(`admin-venues${buildQueryString(params)}`),
  
  createVenue: (venue: Partial<Venue>) => 
    callAdminApi('admin-venues', {
      method: 'POST',
      body: JSON.stringify(venue)
    }),
  
  updateVenue: (venueId: string, updates: Partial<Venue>) => 
    callAdminApi('admin-venues', {
      method: 'PATCH',
      body: JSON.stringify({ venueId, ...updates })
    }),
  
  deleteVenue: (venueId: string) => 
    callAdminApi(`admin-venues?venueId=${venueId}`, {
      method: 'DELETE'
    }),

  // Events
  getEvents: (params: EventParams = {}) => 
    callAdminApi<EventsResponse>(`admin-events${buildQueryString(params)}`),
  
  cancelEvent: (eventId: string, reason: string) => 
    callAdminApi('admin-events', {
      method: 'PATCH',
      body: JSON.stringify({ eventId, action: 'cancel', reason })
    }),
  
  toggleEventFeatured: (eventId: string) => 
    callAdminApi('admin-events', {
      method: 'PATCH',
      body: JSON.stringify({ eventId, action: 'toggle_featured' })
    }),
  
  deleteEvent: (eventId: string) => 
    callAdminApi(`admin-events?eventId=${eventId}`, {
      method: 'DELETE'
    }),

  // Analytics
  getAnalytics: (type: 'overview' | 'revenue' | 'users' | 'bookings', period: '7d' | '30d' | '90d' | '365d' = '30d') => 
    callAdminApi<AnalyticsData>(`admin-analytics?type=${type}&period=${period}`),

  // Audit Logs
  getAuditLogs: (params: { page?: number; limit?: number } = {}) => 
    callAdminApi<AuditLogsResponse>(`admin-audit-logs${buildQueryString(params)}`),
};
