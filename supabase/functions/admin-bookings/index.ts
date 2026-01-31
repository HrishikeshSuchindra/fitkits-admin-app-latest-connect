import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to identify the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has admin or venue_owner role
    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roleError) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to verify user role" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userRoles = roles?.map(r => r.role) || [];
    const isAdmin = userRoles.includes("admin");
    const isVenueOwner = userRoles.includes("venue_owner");

    if (!isAdmin && !isVenueOwner) {
      return new Response(
        JSON.stringify({ error: "Access denied. You must be an admin or venue owner." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const method = req.method;
    console.log(`Admin Bookings API - Method: ${method}, User: ${user.id}, Admin: ${isAdmin}`);

    // GET - List bookings
    if (method === "GET") {
      const venueId = url.searchParams.get("venue_id");
      const status = url.searchParams.get("status");
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "20");
      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from("bookings")
        .select(`
          *,
          venues!inner(id, name, address, image_url, owner_id),
          profiles:user_id(user_id, display_name, username, avatar_url, phone_number)
        `, { count: "exact" });

      // Filter by venue owner if not admin
      if (!isAdmin) {
        query = query.eq("venues.owner_id", user.id);
      } else if (venueId) {
        query = query.eq("venue_id", venueId);
      }

      if (status) {
        query = query.eq("status", status);
      }

      if (dateFrom) {
        query = query.gte("slot_date", dateFrom);
      }

      if (dateTo) {
        query = query.lte("slot_date", dateTo);
      }

      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

      const { data: bookings, error, count } = await query;

      if (error) {
        console.error("Fetch bookings error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch bookings", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Transform data to match frontend expectations
      const transformedBookings = (bookings || []).map((booking: any) => ({
        ...booking,
        venue_name: booking.venues?.name,
        venue_address: booking.venues?.address,
        venue_image: booking.venues?.image_url,
        user_profile: booking.profiles,
      }));

      console.log(`Found ${transformedBookings.length} bookings`);
      return new Response(
        JSON.stringify({
          bookings: transformedBookings,
          total: count || 0,
          page,
          limit,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PATCH - Update booking (cancel/refund)
    if (method === "PATCH") {
      const body = await req.json();
      const { bookingId, action, reason } = body;

      if (!bookingId || !action) {
        return new Response(
          JSON.stringify({ error: "Booking ID and action are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the booking exists and user has access
      const { data: existingBooking, error: checkError } = await supabase
        .from("bookings")
        .select("*, venues!inner(owner_id)")
        .eq("id", bookingId)
        .single();

      if (checkError || !existingBooking) {
        return new Response(
          JSON.stringify({ error: "Booking not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check authorization
      if (!isAdmin && existingBooking.venues.owner_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Not authorized to update this booking" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let updateData: Record<string, unknown> = {};

      if (action === "cancel") {
        updateData = {
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason || "Cancelled by admin",
        };
      } else if (action === "refund") {
        updateData = {
          status: "refunded",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason || "Refunded by admin",
        };
      } else {
        return new Response(
          JSON.stringify({ error: "Invalid action. Use 'cancel' or 'refund'" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: booking, error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId)
        .select()
        .single();

      if (error) {
        console.error("Update booking error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update booking", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Booking ${bookingId} ${action}led`);
      return new Response(
        JSON.stringify({ booking }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
