import { supabase, FUNCTIONS_URL } from './supabase';

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
  is_active: boolean;
  owner_id: string;
  opening_time?: string;
  closing_time?: string;
  courts_count?: number;
  description?: string;
  amenities?: string[];
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  venue_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  status: string;
  created_at: string;
  user?: {
    full_name: string | null;
    email: string;
    phone: string | null;
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

// Helper to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

// Helper to handle API response
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }
  return data;
}

// Edge Function API
export const edgeFunctionApi = {
  // ==================== VENUES ====================
  async getVenues(params: {
    owner_id?: string;
    category?: string;
    sport?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<VenuesResponse> {
    const headers = await getAuthHeaders();
    const searchParams = new URLSearchParams();
    
    if (params.owner_id) searchParams.append('owner_id', params.owner_id);
    if (params.category) searchParams.append('category', params.category);
    if (params.sport) searchParams.append('sport', params.sport);
    if (params.is_active !== undefined) searchParams.append('is_active', String(params.is_active));
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', String(params.page));
    if (params.limit) searchParams.append('limit', String(params.limit));

    const response = await fetch(
      `${FUNCTIONS_URL}/admin-venues?${searchParams.toString()}`,
      { method: 'GET', headers }
    );
    return handleResponse<VenuesResponse>(response);
  },

  async createVenue(venue: Partial<Venue>): Promise<{ venue: Venue }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${FUNCTIONS_URL}/admin-venues`, {
      method: 'POST',
      headers,
      body: JSON.stringify(venue),
    });
    return handleResponse<{ venue: Venue }>(response);
  },

  async updateVenue(venueId: string, updates: Partial<Venue>): Promise<{ venue: Venue }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${FUNCTIONS_URL}/admin-venues`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ venueId, ...updates }),
    });
    return handleResponse<{ venue: Venue }>(response);
  },

  async deleteVenue(venueId: string): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${FUNCTIONS_URL}/admin-venues`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ venueId }),
    });
    return handleResponse<{ success: boolean }>(response);
  },

  // ==================== BOOKINGS ====================
  async getBookings(params: {
    venue_id?: string;
    status?: string;
    user_id?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<BookingsResponse> {
    const headers = await getAuthHeaders();
    const searchParams = new URLSearchParams();
    
    if (params.venue_id) searchParams.append('venue_id', params.venue_id);
    if (params.status) searchParams.append('status', params.status);
    if (params.user_id) searchParams.append('user_id', params.user_id);
    if (params.date_from) searchParams.append('date_from', params.date_from);
    if (params.date_to) searchParams.append('date_to', params.date_to);
    if (params.page) searchParams.append('page', String(params.page));
    if (params.limit) searchParams.append('limit', String(params.limit));

    const response = await fetch(
      `${FUNCTIONS_URL}/admin-bookings?${searchParams.toString()}`,
      { method: 'GET', headers }
    );
    return handleResponse<BookingsResponse>(response);
  },

  async cancelBooking(bookingId: string, reason: string): Promise<{ booking: Booking }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${FUNCTIONS_URL}/admin-bookings`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ bookingId, action: 'cancel', reason }),
    });
    return handleResponse<{ booking: Booking }>(response);
  },

  async refundBooking(bookingId: string, reason: string): Promise<{ booking: Booking }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${FUNCTIONS_URL}/admin-bookings`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ bookingId, action: 'refund', reason }),
    });
    return handleResponse<{ booking: Booking }>(response);
  },

  // ==================== SLOT BLOCKS ====================
  async getBlockedSlots(params: {
    venue_id: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<SlotBlocksResponse> {
    const headers = await getAuthHeaders();
    const searchParams = new URLSearchParams();
    
    searchParams.append('venue_id', params.venue_id);
    if (params.date_from) searchParams.append('date_from', params.date_from);
    if (params.date_to) searchParams.append('date_to', params.date_to);
    if (params.page) searchParams.append('page', String(params.page));
    if (params.limit) searchParams.append('limit', String(params.limit));

    const response = await fetch(
      `${FUNCTIONS_URL}/admin-slot-blocks?${searchParams.toString()}`,
      { method: 'GET', headers }
    );
    return handleResponse<SlotBlocksResponse>(response);
  },

  async blockSlot(venueId: string, slotDate: string, slotTime: string, reason?: string): Promise<{ block: SlotBlock }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${FUNCTIONS_URL}/admin-slot-blocks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        venue_id: venueId,
        slot_date: slotDate,
        slot_time: slotTime,
        reason: reason || 'Blocked by admin',
      }),
    });
    return handleResponse<{ block: SlotBlock }>(response);
  },

  async blockMultipleSlots(slots: Array<{
    venue_id: string;
    slot_date: string;
    slot_time: string;
    reason?: string;
  }>): Promise<{ blocks: SlotBlock[] }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${FUNCTIONS_URL}/admin-slot-blocks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ slots }),
    });
    return handleResponse<{ blocks: SlotBlock[] }>(response);
  },

  async unblockSlot(venueId: string, slotDate: string, slotTime: string): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${FUNCTIONS_URL}/admin-slot-blocks`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        venue_id: venueId,
        slot_date: slotDate,
        slot_time: slotTime,
      }),
    });
    return handleResponse<{ success: boolean }>(response);
  },

  // ==================== ANALYTICS (direct query for now) ====================
  async getAnalytics(type: 'overview' | 'revenue' | 'bookings' | 'users', period: string = '30d') {
    // For analytics, we'll query directly since there's no Edge Function for it
    // This is a simplified version - in production, create an analytics Edge Function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // Get user's venues first
    const { data: venues } = await supabase
      .from('venues')
      .select('id')
      .eq('owner_id', session.user.id);

    const venueIds = venues?.map(v => v.id) || [];

    if (type === 'overview') {
      // Get bookings count for owned venues
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('venue_id', venueIds);

      // Get revenue
      const { data: revenueData } = await supabase
        .from('bookings')
        .select('total_amount')
        .in('venue_id', venueIds)
        .eq('status', 'confirmed');

      const totalRevenue = revenueData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

      return {
        overview: {
          totalRevenue,
          totalBookings: bookingsCount || 0,
          totalUsers: 0, // Not relevant for venue owner
          activeVenues: venueIds.length,
          revenueGrowth: 0,
          bookingGrowth: 0,
          userGrowth: 0,
        }
      };
    }

    if (type === 'revenue') {
      const { data } = await supabase
        .from('bookings')
        .select('total_amount, booking_date')
        .in('venue_id', venueIds)
        .eq('status', 'confirmed')
        .order('booking_date', { ascending: true })
        .limit(30);

      return {
        revenue: data?.map(b => ({
          date: b.booking_date,
          amount: b.total_amount || 0,
        })) || []
      };
    }

    if (type === 'bookings') {
      const { data } = await supabase
        .from('bookings')
        .select('booking_date')
        .in('venue_id', venueIds)
        .order('booking_date', { ascending: true })
        .limit(30);

      // Group by date
      const grouped = data?.reduce((acc, b) => {
        const date = b.booking_date;
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        bookings: Object.entries(grouped).map(([date, count]) => ({ date, count }))
      };
    }

    return {};
  },
};
