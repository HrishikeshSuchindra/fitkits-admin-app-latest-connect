import { supabase } from './supabase';

// ============= Types =============
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

// ============= Direct API Functions =============

export const directApi = {
  // ============= USERS =============
  getUsers: async (params: UserParams = {}): Promise<UsersResponse> => {
    const { search, status, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    const { data: profiles, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    // Get roles for each user
    const userIds = profiles?.map(p => p.id) || [];
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

    const users: User[] = (profiles || []).map(p => ({
      id: p.id,
      full_name: p.full_name || '',
      email: p.email || '',
      avatar_url: p.avatar_url,
      phone: p.phone,
      is_active: p.is_active ?? true,
      created_at: p.created_at,
      role: roleMap.get(p.id) || 'user',
    }));

    return {
      users,
      total: count || 0,
      page,
      limit,
    };
  },

  deactivateUser: async (userId: string, reason: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', userId);

    if (error) throw new Error(error.message);

    // Log action
    await directApi.logAuditAction('deactivate_user', 'user', userId, { reason });

    return { success: true };
  },

  reactivateUser: async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: true })
      .eq('id', userId);

    if (error) throw new Error(error.message);

    await directApi.logAuditAction('reactivate_user', 'user', userId, {});

    return { success: true };
  },

  setUserRole: async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    // Remove existing roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Insert new role
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role });

    if (error) throw new Error(error.message);

    await directApi.logAuditAction('set_role', 'user', userId, { role });

    return { success: true };
  },

  // ============= BOOKINGS =============
  getBookings: async (params: BookingParams = {}): Promise<BookingsResponse> => {
    const { status, venueId, userId, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        user:profiles(full_name, email),
        venue:venues(name)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (venueId) {
      query = query.eq('venue_id', venueId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    const bookings: Booking[] = (data || []).map(b => ({
      id: b.id,
      user_id: b.user_id,
      venue_id: b.venue_id,
      booking_date: b.booking_date,
      start_time: b.start_time,
      end_time: b.end_time,
      status: b.status,
      total_amount: b.total_amount || 0,
      created_at: b.created_at,
      user: b.user,
      venue: b.venue,
    }));

    return {
      bookings,
      total: count || 0,
      page,
      limit,
    };
  },

  cancelBooking: async (bookingId: string, reason: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) throw new Error(error.message);

    await directApi.logAuditAction('cancel_booking', 'booking', bookingId, { reason });

    return { success: true };
  },

  refundBooking: async (bookingId: string, reason: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'refunded' })
      .eq('id', bookingId);

    if (error) throw new Error(error.message);

    await directApi.logAuditAction('refund_booking', 'booking', bookingId, { reason });

    return { success: true };
  },

  // ============= VENUES =============
  getVenues: async (params: VenueParams = {}): Promise<VenuesResponse> => {
    const { category, search, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('venues')
      .select('*', { count: 'exact' });

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    const venues: Venue[] = (data || []).map(v => ({
      id: v.id,
      name: v.name,
      category: v.category || '',
      sport: v.sport || '',
      location: v.location || '',
      address: v.address || '',
      price_per_hour: v.price_per_hour || 0,
      is_active: v.is_active ?? true,
      image_url: v.image_url,
      amenities: v.amenities || [],
      created_at: v.created_at,
    }));

    return {
      venues,
      total: count || 0,
      page,
      limit,
    };
  },

  createVenue: async (venue: Partial<Venue>) => {
    const { data, error } = await supabase
      .from('venues')
      .insert({
        name: venue.name,
        category: venue.category,
        sport: venue.sport,
        location: venue.location,
        address: venue.address,
        price_per_hour: venue.price_per_hour,
        is_active: venue.is_active ?? true,
        image_url: venue.image_url,
        amenities: venue.amenities || [],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await directApi.logAuditAction('create_venue', 'venue', data.id, { name: venue.name });

    return data;
  },

  updateVenue: async (venueId: string, updates: Partial<Venue>) => {
    const { id, created_at, ...updateData } = updates as Venue;
    
    const { error } = await supabase
      .from('venues')
      .update(updateData)
      .eq('id', venueId);

    if (error) throw new Error(error.message);

    await directApi.logAuditAction('update_venue', 'venue', venueId, updates);

    return { success: true };
  },

  deleteVenue: async (venueId: string) => {
    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('id', venueId);

    if (error) throw new Error(error.message);

    await directApi.logAuditAction('delete_venue', 'venue', venueId, {});

    return { success: true };
  },

  // ============= EVENTS =============
  getEvents: async (params: EventParams = {}): Promise<EventsResponse> => {
    const { status, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('events')
      .select(`
        *,
        host:profiles(full_name),
        venue:venues(name)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    const events: Event[] = (data || []).map(e => ({
      id: e.id,
      title: e.title,
      sport: e.sport || '',
      event_type: e.event_type || '',
      host_id: e.host_id,
      venue_id: e.venue_id,
      start_date: e.start_date,
      end_date: e.end_date,
      status: e.status || 'upcoming',
      max_participants: e.max_participants || 0,
      is_featured: e.is_featured ?? false,
      created_at: e.created_at,
      host: e.host,
      venue: e.venue,
    }));

    return {
      events,
      total: count || 0,
      page,
      limit,
    };
  },

  cancelEvent: async (eventId: string, reason: string) => {
    const { error } = await supabase
      .from('events')
      .update({ status: 'cancelled' })
      .eq('id', eventId);

    if (error) throw new Error(error.message);

    await directApi.logAuditAction('cancel_event', 'event', eventId, { reason });

    return { success: true };
  },

  toggleEventFeatured: async (eventId: string) => {
    // Get current featured status
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('is_featured')
      .eq('id', eventId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const { error } = await supabase
      .from('events')
      .update({ is_featured: !event.is_featured })
      .eq('id', eventId);

    if (error) throw new Error(error.message);

    await directApi.logAuditAction('toggle_featured', 'event', eventId, { is_featured: !event.is_featured });

    return { success: true };
  },

  deleteEvent: async (eventId: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw new Error(error.message);

    await directApi.logAuditAction('delete_event', 'event', eventId, {});

    return { success: true };
  },

  // ============= ANALYTICS =============
  getAnalytics: async (type: 'overview' | 'revenue' | 'users' | 'bookings', period: '7d' | '30d' | '90d' | '365d' = '30d'): Promise<AnalyticsData> => {
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
    const days = daysMap[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    const prevStartDate = new Date();
    prevStartDate.setDate(prevStartDate.getDate() - (days * 2));
    const prevEndDate = new Date();
    prevEndDate.setDate(prevEndDate.getDate() - days);

    if (type === 'overview') {
      // Get current period stats
      const [usersResult, bookingsResult, venuesResult, prevBookingsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id, total_amount', { count: 'exact' }).gte('created_at', startDateStr),
        supabase.from('venues').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('bookings').select('id, total_amount', { count: 'exact' })
          .gte('created_at', prevStartDate.toISOString())
          .lt('created_at', prevEndDate.toISOString()),
      ]);

      const totalUsers = usersResult.count || 0;
      const totalBookings = bookingsResult.count || 0;
      const totalRevenue = bookingsResult.data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const activeVenues = venuesResult.count || 0;

      const prevBookings = prevBookingsResult.count || 0;
      const prevRevenue = prevBookingsResult.data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

      const bookingGrowth = prevBookings > 0 ? ((totalBookings - prevBookings) / prevBookings) * 100 : 0;
      const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

      return {
        overview: {
          totalUsers,
          totalBookings,
          totalRevenue,
          activeVenues,
          userGrowth: 0, // Would need historical user data
          bookingGrowth,
          revenueGrowth,
        },
      };
    }

    if (type === 'revenue') {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('created_at, total_amount')
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: true });

      // Group by date
      const revenueByDate = new Map<string, number>();
      bookings?.forEach(b => {
        const date = new Date(b.created_at).toISOString().split('T')[0];
        revenueByDate.set(date, (revenueByDate.get(date) || 0) + (b.total_amount || 0));
      });

      const revenue = Array.from(revenueByDate.entries()).map(([date, amount]) => ({
        date,
        amount,
      }));

      return { revenue };
    }

    if (type === 'bookings') {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('created_at')
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: true });

      // Group by date
      const bookingsByDate = new Map<string, number>();
      bookings?.forEach(b => {
        const date = new Date(b.created_at).toISOString().split('T')[0];
        bookingsByDate.set(date, (bookingsByDate.get(date) || 0) + 1);
      });

      const bookingsData = Array.from(bookingsByDate.entries()).map(([date, count]) => ({
        date,
        count,
      }));

      return { bookings: bookingsData };
    }

    return {};
  },

  // ============= AUDIT LOGS =============
  getAuditLogs: async (params: { page?: number; limit?: number } = {}): Promise<AuditLogsResponse> => {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from('admin_audit_log')
      .select(`
        *,
        admin:profiles(full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      // If table doesn't exist, return empty
      if (error.code === '42P01') {
        return { logs: [], total: 0, page, limit };
      }
      throw new Error(error.message);
    }

    const logs: AuditLog[] = (data || []).map(l => ({
      id: l.id,
      admin_id: l.admin_id,
      action: l.action,
      target_type: l.target_type,
      target_id: l.target_id,
      details: l.details || {},
      created_at: l.created_at,
      admin: l.admin,
    }));

    return {
      logs,
      total: count || 0,
      page,
      limit,
    };
  },

  logAuditAction: async (action: string, targetType: string, targetId: string, details: Record<string, unknown>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('admin_audit_log')
        .insert({
          admin_id: user.id,
          action,
          target_type: targetType,
          target_id: targetId,
          details,
        });
    } catch {
      // Silently fail if audit log table doesn't exist
      console.warn('Audit log insert failed - table may not exist');
    }
  },
};
