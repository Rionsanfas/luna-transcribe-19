import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[POLAR-CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const polarAccessToken = Deno.env.get("POLAR_ACCESS_TOKEN");
    if (!polarAccessToken) throw new Error("POLAR_ACCESS_TOKEN is not set");
    logStep("Polar access token verified");

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's Polar customer ID from database or create one
    const { data: subscriberData } = await supabaseClient
      .from("subscribers")
      .select("polar_customer_id")
      .eq("user_id", user.id)
      .single();

    let polarCustomerId = subscriberData?.polar_customer_id;
    
    if (!polarCustomerId) {
      // Create a Polar customer if one doesn't exist
      const createCustomerResponse = await fetch("https://api.polar.sh/v1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${polarAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
        }),
      });

      if (!createCustomerResponse.ok) {
        throw new Error(`Failed to create Polar customer: ${await createCustomerResponse.text()}`);
      }

      const customerData = await createCustomerResponse.json();
      polarCustomerId = customerData.id;
      logStep("Created new Polar customer", { polarCustomerId });

      // Update subscriber record with Polar customer ID
      await supabaseClient
        .from("subscribers")
        .upsert({
          user_id: user.id,
          email: user.email,
          polar_customer_id: polarCustomerId,
        }, { onConflict: 'user_id' });
    }

    // Create customer portal session
    const portalResponse = await fetch("https://api.polar.sh/v1/customer-portal/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${polarAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_id: polarCustomerId,
        return_url: `${req.headers.get("origin")}/dashboard`,
      }),
    });

    if (!portalResponse.ok) {
      throw new Error(`Failed to create portal session: ${await portalResponse.text()}`);
    }

    const portalData = await portalResponse.json();
    logStep("Customer portal session created", { sessionId: portalData.id, url: portalData.url });

    return new Response(JSON.stringify({ url: portalData.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in polar-customer-portal", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});