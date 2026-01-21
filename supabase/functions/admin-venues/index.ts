import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VenueCreate {
  name: string;
  slug?: string;
  category?: string;
  sport?: string;
  address?: string;
  city?: string;
  price_per_hour?: number;
  image_url?: string | null;
  gallery_urls?: string[];
  is_active?: boolean;
  amenities?: string[];
  description?: string;
  opening_hours?: Record<string, { enabled: boolean; open: string; close: string }>;
  min_booking_duration?: number;
  courts_count?: number;
}

interface VenueUpdate {
  venueId: string;
  name?: string;
  slug?: string;
  category?: string;
  sport?: string;
  address?: string;
  city?: string;
  price_per_hour?: number;
  image_url?: string | null;
  gallery_urls?: string[];
  is_active?: boolean;
  amenities?: string[];
  description?: string;
  opening_time?: string;
  closing_time?: string;
  courts_count?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const method = req.method;
    console.log(`Admin Venues API - Method: ${method}, User: ${user.id}`);

    // GET - List venues for the authenticated user
    if (method === "GET") {
      const { data: venues, error } = await supabase
        .from("venues")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch venues error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch venues" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Found ${venues?.length || 0} venues for user ${user.id}`);
      return new Response(
        JSON.stringify({ venues: venues || [], total: venues?.length || 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST - Create a new venue
    if (method === "POST") {
      const body: VenueCreate = await req.json();
      console.log("Creating venue:", body);

      // Validate required fields
      if (!body.name) {
        return new Response(
          JSON.stringify({ error: "Venue name is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const venueData = {
        name: body.name,
        slug,
        category: body.category || "courts",
        sport: body.sport || null,
        address: body.address || "",
        city: body.city || "",
        price_per_hour: body.price_per_hour || 0,
        image_url: body.image_url || null,
        gallery_urls: body.gallery_urls || [],
        is_active: body.is_active ?? true,
        amenities: body.amenities || [],
        description: body.description || "",
        opening_hours: body.opening_hours || null,
        min_booking_duration: body.min_booking_duration || 60,
        total_courts: body.courts_count || 1,
        owner_id: user.id,
      };

      const { data: venue, error } = await supabase
        .from("venues")
        .insert(venueData)
        .select()
        .single();

      if (error) {
        console.error("Create venue error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to create venue", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Created venue:", venue.id);
      return new Response(
        JSON.stringify({ venue }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PATCH - Update an existing venue
    if (method === "PATCH") {
      const body: VenueUpdate = await req.json();
      console.log("Updating venue:", body);

      if (!body.venueId) {
        return new Response(
          JSON.stringify({ error: "Venue ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the user owns this venue
      const { data: existingVenue, error: checkError } = await supabase
        .from("venues")
        .select("id, owner_id")
        .eq("id", body.venueId)
        .single();

      if (checkError || !existingVenue) {
        console.error("Venue check error:", checkError);
        return new Response(
          JSON.stringify({ error: "Venue not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (existingVenue.owner_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Not authorized to update this venue" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build update object (only include provided fields)
      const updateData: Record<string, unknown> = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.slug !== undefined) updateData.slug = body.slug;
      if (body.category !== undefined) updateData.category = body.category;
      if (body.sport !== undefined) updateData.sport = body.sport;
      if (body.address !== undefined) updateData.address = body.address;
      if (body.city !== undefined) updateData.city = body.city;
      if (body.price_per_hour !== undefined) updateData.price_per_hour = body.price_per_hour;
      if (body.image_url !== undefined) updateData.image_url = body.image_url;
      if (body.gallery_urls !== undefined) updateData.gallery_urls = body.gallery_urls;
      if (body.is_active !== undefined) updateData.is_active = body.is_active;
      if (body.amenities !== undefined) updateData.amenities = body.amenities;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.opening_time !== undefined) updateData.opening_time = body.opening_time;
      if (body.closing_time !== undefined) updateData.closing_time = body.closing_time;
      if (body.courts_count !== undefined) updateData.total_courts = body.courts_count;

      const { data: venue, error } = await supabase
        .from("venues")
        .update(updateData)
        .eq("id", body.venueId)
        .select()
        .single();

      if (error) {
        console.error("Update venue error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update venue", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Updated venue:", venue.id);
      return new Response(
        JSON.stringify({ venue }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE - Remove a venue
    if (method === "DELETE") {
      const body = await req.json();
      const venueId = body.venueId;

      if (!venueId) {
        return new Response(
          JSON.stringify({ error: "Venue ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify ownership
      const { data: existingVenue, error: checkError } = await supabase
        .from("venues")
        .select("id, owner_id")
        .eq("id", venueId)
        .single();

      if (checkError || !existingVenue) {
        return new Response(
          JSON.stringify({ error: "Venue not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (existingVenue.owner_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Not authorized to delete this venue" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("venues")
        .delete()
        .eq("id", venueId);

      if (error) {
        console.error("Delete venue error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to delete venue" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Deleted venue:", venueId);
      return new Response(
        JSON.stringify({ success: true }),
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
