import { supabase } from './supabase';

function buildQueryString(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    qs.append(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

// Types
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  role?: string;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  category: string;
  sport: string;
  location: string;
  address: string;
  price_per_hour: number;
  image_url: string | null;
  gallery_urls?: string[];
  is_active: boolean;
  owner_id: string;
  opening_time?: string;
  closing_time?: string;
  courts_count?: number;
  min_booking_duration?: number;
  description?: string;
  amenities?: string[];
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  venue_id: string;
  // Backend field names (may differ from legacy)
  slot_date?: string;
  slot_time?: string;
  duration_minutes?: number;
  price?: number;
  // Legacy field names (some backends may use these)
  booking_date?: string;
  start_time?: string;
  end_time?: string;
  total_amount?: number;
  // Common fields
  status: string;
  created_at: string;
  court_number?: number;
  player_count?: number;
  cancelled_at?: string;
  cancellation_reason?: string;
  // Nested objects from backend (newer format)
  venue_name?: string;
  venue_address?: string;
  venue_image?: string;
  user_profile?: {
    user_id: string;
    display_name: string;
    username?: string;
    avatar_url?: string;
    phone_number?: string;
  };
  // Legacy nested format
  user?: {
    full_name: string | null;
    email: string;
    phone: string | null;
    avatar_url?: string;
  };
  venue?: {
    name: string;
    location: string;
  };
}

export interface SlotBlock {
  id: string;
  venue_id: string;
  slot_date: string;
  slot_time: string;
  reason: string | null;
  created_at: string;
  created_by: string;
}

export interface SlotAvailability {
  time: string;
  booked_courts: number;
  is_blocked: boolean;
  block_reason?: string;
}

export interface VenuesResponse {
  venues: Venue[];
  total: number;
  page: number;
  limit: number;
}

export interface BookingsResponse {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
}

export interface SlotBlocksResponse {
  blocks: SlotBlock[];
  total: number;
  page: number;
  limit: number;
}

export interface SlotAvailabilityResponse {
  slots: SlotAvailability[];
}

export interface BlockedDaysResponse {
  dates: string[];
}

export interface BookedDaysResponse {
  dates: string[];
}

// Edge Function API using supabase.functions.invoke()
export const edgeFunctionApi = {
  // ==================== VENUES (via Edge Function) ====================
  async getVenues(params: {
    owner_id?: string;
    category?: string;
    sport?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<VenuesResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // Build query params for Edge Function
    const queryParams = new URLSearchParams();
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.is_active !== undefined) queryParams.append('is_active', String(params.is_active));
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));

    const { data, error } = await supabase.functions.invoke('admin-venues', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (error) {
      console.error('Get venues error:', error);
      throw new Error(error.message);
    }

    // Map the response - the Edge Function returns venues directly or in a wrapper
    const venues = Array.isArray(data) ? data : (data?.venues || []);
    
    return {
      venues: venues.map((v: any) => ({ ...v, location: v.city || v.location })) as Venue[],
      total: data?.total || venues.length,
      page: params.page || 1,
      limit: params.limit || 20,
    };
  },

  async createVenue(venue: Partial<Venue> & {
    opening_hours?: Record<string, { enabled: boolean; open: string; close: string }>;
    min_booking_duration?: number;
  }): Promise<{ venue: Venue }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('admin-venues', {
      method: 'POST',
      body: {
        name: venue.name,
        slug: venue.slug,
        category: venue.category,
        sport: venue.sport,
        address: venue.address,
        city: venue.location,
        price_per_hour: venue.price_per_hour,
        image_url: venue.image_url,
        gallery_urls: venue.gallery_urls || [],
        is_active: venue.is_active ?? true,
        amenities: venue.amenities || [],
        description: venue.description || '',
        opening_hours: venue.opening_hours || null,
        min_booking_duration: venue.min_booking_duration || 60,
        courts_count: venue.courts_count || 1,
      },
    });

    if (error) {
      console.error('Create venue error:', error);
      throw new Error(error.message);
    }

    const venueData = data?.venue || data;
    return { venue: { ...venueData, location: venueData.city || venueData.location } as Venue };
  },

  async updateVenue(venueId: string, updates: Partial<Venue> & {
    day_schedules?: Record<string, { enabled: boolean; open: string; close: string }>;
  }): Promise<{ venue: Venue }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const updateData: Record<string, any> = { venueId };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.slug !== undefined) updateData.slug = updates.slug;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.sport !== undefined) updateData.sport = updates.sport;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.location !== undefined) updateData.city = updates.location;
    if (updates.price_per_hour !== undefined) updateData.price_per_hour = updates.price_per_hour;
    if (updates.image_url !== undefined) updateData.image_url = updates.image_url;
    if (updates.gallery_urls !== undefined) updateData.gallery_urls = updates.gallery_urls;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    if (updates.amenities !== undefined) updateData.amenities = updates.amenities;
    if (updates.opening_time !== undefined) updateData.opening_time = updates.opening_time;
    if (updates.closing_time !== undefined) updateData.closing_time = updates.closing_time;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.courts_count !== undefined) updateData.courts_count = updates.courts_count;
    if (updates.min_booking_duration !== undefined) updateData.min_booking_duration = updates.min_booking_duration;
    if (updates.day_schedules !== undefined) updateData.day_schedules = updates.day_schedules;

    const { data, error } = await supabase.functions.invoke('admin-venues', {
      method: 'PATCH',
      body: updateData,
    });

    // Enhanced error handling - extract detailed error from response
    if (error) {
      console.error('Update venue error:', error);
      // Try to get more details from the data if available
      const errorDetails = data?.details || data?.error || error.message;
      throw new Error(errorDetails);
    }

    // Check if the response itself contains an error (edge function returned 500 with JSON body)
    if (data?.error) {
      console.error('Backend error:', data);
      throw new Error(data.details || data.error);
    }

    const venueData = data?.venue || data;
    return { venue: { ...venueData, location: venueData.city || venueData.location } as Venue };
  },

  async deleteVenue(venueId: string): Promise<{ success: boolean }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('admin-venues', {
      method: 'DELETE',
      body: { venueId },
    });

    if (error) {
      console.error('Delete venue error:', error);
      throw new Error(error.message);
    }

    return { success: true };
  },

  // ==================== BOOKINGS (via Edge Function) ====================
  async getBookings(params: {
    venue_id?: string;
    status?: string;
    user_id?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<BookingsResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // This edge function only supports GET; pass filters as query params.
    const { data, error } = await supabase.functions.invoke(
      `admin-bookings${buildQueryString(params as Record<string, unknown>)}`,
      { method: 'GET' }
    );

    if (error) {
      console.error('Get bookings error:', error);
      throw new Error(error.message);
    }

    return {
      bookings: data?.bookings || [],
      total: data?.total || 0,
      page: data?.page || 1,
      limit: data?.limit || 20,
    };
  },

  async cancelBooking(bookingId: string, reason: string): Promise<{ booking: Booking }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('admin-bookings', {
      method: 'PATCH',
      body: { bookingId, action: 'cancel', reason },
    });

    if (error) {
      console.error('Cancel booking error:', error);
      throw new Error(error.message);
    }

    return { booking: data?.booking || data };
  },

  async refundBooking(bookingId: string, reason: string): Promise<{ booking: Booking }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('admin-bookings', {
      method: 'PATCH',
      body: { bookingId, action: 'refund', reason },
    });

    if (error) {
      console.error('Refund booking error:', error);
      throw new Error(error.message);
    }

    return { booking: data?.booking || data };
  },

  // ==================== SLOT BLOCKS (via Edge Function) ====================
  async getBlockedSlots(params: {
    venue_id: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<SlotBlocksResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // This edge function reads via GET (POST is treated as create-block).
    const { data, error } = await supabase.functions.invoke(
      `admin-slot-blocks${buildQueryString(params as Record<string, unknown>)}`,
      { method: 'GET' }
    );

    if (error) {
      console.error('Get blocked slots error:', error);
      throw new Error(error.message);
    }

    return {
      blocks: data?.blocks || [],
      total: data?.total || 0,
      page: data?.page || 1,
      limit: data?.limit || 20,
    };
  },

  async blockSlot(venueId: string, slotDate: string, slotTime: string, reason?: string): Promise<{ block: SlotBlock }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('admin-slot-blocks', {
      method: 'POST',
      body: {
        venue_id: venueId,
        slot_date: slotDate,
        slot_time: slotTime,
        reason: reason || 'Blocked by admin',
      },
    });

    if (error) {
      console.error('Block slot error:', error);
      throw new Error(error.message);
    }

    return { block: data?.block || data };
  },

  async blockMultipleSlots(slots: Array<{
    venue_id: string;
    slot_date: string;
    slot_time: string;
    reason?: string;
  }>): Promise<{ blocks: SlotBlock[] }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('admin-slot-blocks', {
      method: 'POST',
      body: { action: 'block_multiple', slots },
    });

    if (error) {
      console.error('Block multiple slots error:', error);
      throw new Error(error.message);
    }

    return { blocks: data?.blocks || [] };
  },

  async unblockSlot(venueId: string, slotDate: string, slotTime: string): Promise<{ success: boolean }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('admin-slot-blocks', {
      method: 'DELETE',
      body: {
        venue_id: venueId,
        slot_date: slotDate,
        slot_time: slotTime,
      },
    });

    if (error) {
      console.error('Unblock slot error:', error);
      throw new Error(error.message);
    }

    return { success: true };
  },

  // ==================== SLOT AVAILABILITY (for Calendar) ====================
  async getSlotAvailability(params: {
    venue_id: string;
    date: string;
  }): Promise<SlotAvailabilityResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // Slot availability is a read operation; call via GET with query params.
    const { data, error } = await supabase.functions.invoke(
      `admin-slot-blocks${buildQueryString({
        action: 'slot_availability',
        venue_id: params.venue_id,
        date: params.date,
      })}`,
      { method: 'GET' }
    );

    if (error) {
      console.error('Get slot availability error:', error);
      throw new Error(error.message);
    }

    return { slots: data?.slots || [] };
  },

  async getBlockedDaysInMonth(params: {
    venue_id: string;
    year: number;
    month: number;
  }): Promise<BlockedDaysResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // Calculate date range for the month
    const startDate = `${params.year}-${String(params.month).padStart(2, '0')}-01`;
    const lastDay = new Date(params.year, params.month, 0).getDate();
    const endDate = `${params.year}-${String(params.month).padStart(2, '0')}-${lastDay}`;

    const { blocks } = await edgeFunctionApi.getBlockedSlots({
      venue_id: params.venue_id,
      date_from: startDate,
      date_to: endDate,
      // ensure we capture the whole month even if many blocks
      limit: 5000,
      page: 1,
    });

    const uniqueDates = [...new Set(blocks.map((b: any) => b.slot_date))] as string[];
    
    return { dates: uniqueDates };
  },

  async getBookedDaysInMonth(params: {
    venue_id: string;
    year: number;
    month: number;
  }): Promise<BookedDaysResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // Calculate date range for the month
    const startDate = `${params.year}-${String(params.month).padStart(2, '0')}-01`;
    const lastDay = new Date(params.year, params.month, 0).getDate();
    const endDate = `${params.year}-${String(params.month).padStart(2, '0')}-${lastDay}`;

    const { bookings } = await edgeFunctionApi.getBookings({
      venue_id: params.venue_id,
      date_from: startDate,
      date_to: endDate,
      limit: 5000,
      page: 1,
    });

    const uniqueDates = [...new Set(bookings.map((b: any) => b.slot_date || b.booking_date))] as string[];
    
    return { dates: uniqueDates };
  },

  async blockFullDay(venueId: string, date: string, reason?: string): Promise<{ success: boolean; blocks_created: number }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('admin-slot-blocks', {
      method: 'POST',
      body: {
        venue_id: venueId,
        slot_date: date,
        block_full_day: true,
        reason: reason || 'Blocked by admin',
      },
    });

    if (error) {
      console.error('Block full day error:', error);
      throw new Error(error.message);
    }

    return { success: true, blocks_created: data?.blocks_created || 0 };
  },

  async unblockFullDay(venueId: string, date: string): Promise<{ success: boolean }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('admin-slot-blocks', {
      method: 'DELETE',
      body: {
        venue_id: venueId,
        slot_date: date,
        unblock_full_day: true,
      },
    });

    if (error) {
      console.error('Unblock full day error:', error);
      throw new Error(error.message);
    }

    return { success: true };
  },

  // ==================== ANALYTICS (direct query for now) ====================
  async getAnalytics(type: 'overview' | 'revenue' | 'bookings' | 'users', period: string = '30d') {
    // For analytics, we'll query directly since there's no Edge Function for it
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const userId = session.user.id;

    // Calculate date range
    const days = parseInt(period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Previous period for growth comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    const prevStartDateStr = prevStartDate.toISOString().split('T')[0];

    // Get venues owned by the logged-in user
    const { data: userVenues, count: activeVenuesCount } = await supabase
      .from('venues')
      .select('id', { count: 'exact' })
      .eq('owner_id', userId)
      .eq('is_active', true);

    const venueIds = userVenues?.map(v => v.id) || [];

    // If user owns no venues, return zeros
    if (venueIds.length === 0) {
      if (type === 'overview') {
        return {
          overview: {
            totalRevenue: 0,
            totalBookings: 0,
            totalUsers: 0,
            activeVenues: 0,
            revenueGrowth: 0,
            bookingGrowth: 0,
            userGrowth: 0,
          }
        };
      }
      if (type === 'revenue') return { revenue: [] };
      if (type === 'bookings') return { bookings: [] };
      return {};
    }

    if (type === 'overview') {
      // Get current period bookings for user's venues only (not cancelled)
      const { data: currentBookings } = await supabase
        .from('bookings')
        .select('id, user_id, price, slot_date, venue_id')
        .in('venue_id', venueIds)
        .neq('status', 'cancelled')
        .gte('slot_date', startDateStr);

      // Get previous period bookings for growth comparison
      const { data: prevBookings } = await supabase
        .from('bookings')
        .select('id, user_id, price, venue_id')
        .in('venue_id', venueIds)
        .neq('status', 'cancelled')
        .gte('slot_date', prevStartDateStr)
        .lt('slot_date', startDateStr);

      // Calculate current period stats
      const currentRevenue = currentBookings?.reduce((sum, b) => sum + (b.price ?? 0), 0) || 0;
      const currentBookingsCount = currentBookings?.length || 0;
      const currentUniqueUsers = new Set(currentBookings?.map(b => b.user_id).filter(Boolean)).size;

      // Calculate previous period stats
      const prevRevenue = prevBookings?.reduce((sum, b) => sum + (b.price ?? 0), 0) || 0;
      const prevBookingsCount = prevBookings?.length || 0;
      const prevUniqueUsers = new Set(prevBookings?.map(b => b.user_id).filter(Boolean)).size;

      // Calculate growth percentages
      const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      const bookingGrowth = prevBookingsCount > 0 ? ((currentBookingsCount - prevBookingsCount) / prevBookingsCount) * 100 : 0;
      const userGrowth = prevUniqueUsers > 0 ? ((currentUniqueUsers - prevUniqueUsers) / prevUniqueUsers) * 100 : 0;

      return {
        overview: {
          totalRevenue: currentRevenue,
          totalBookings: currentBookingsCount,
          totalUsers: currentUniqueUsers,
          activeVenues: activeVenuesCount || 0,
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
          bookingGrowth: Math.round(bookingGrowth * 10) / 10,
          userGrowth: Math.round(userGrowth * 10) / 10,
        }
      };
    }

    if (type === 'revenue') {
      // Get daily revenue for the period (non-cancelled bookings) for user's venues only
      const { data } = await supabase
        .from('bookings')
        .select('price, slot_date, venue_id')
        .in('venue_id', venueIds)
        .neq('status', 'cancelled')
        .gte('slot_date', startDateStr)
        .order('slot_date', { ascending: true });

      // Group by date and sum revenue
      const grouped = data?.reduce((acc, b) => {
        const date = b.slot_date;
        if (date) {
          const amount = b.price ?? 0;
          acc[date] = (acc[date] || 0) + amount;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        revenue: Object.entries(grouped).map(([date, amount]) => ({ date, amount }))
      };
    }

    if (type === 'bookings') {
      // Get daily booking counts for the period (non-cancelled) for user's venues only
      const { data } = await supabase
        .from('bookings')
        .select('slot_date, venue_id')
        .in('venue_id', venueIds)
        .neq('status', 'cancelled')
        .gte('slot_date', startDateStr)
        .order('slot_date', { ascending: true });

      // Group by date
      const grouped = data?.reduce((acc, b) => {
        const date = b.slot_date;
        if (date) {
          acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        bookings: Object.entries(grouped).map(([date, count]) => ({ date, count }))
      };
    }

    return {};
  },
};
