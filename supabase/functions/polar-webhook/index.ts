import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, polar-webhook-signature",
};

// Helper function to verify webhook signature
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const signatureBytes = new Uint8Array(
      signature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
    
    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(payload)
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    console.log("[POLAR-WEBHOOK] Processing webhook request");
    
    // Get the webhook secret from environment
    const webhookSecret = Deno.env.get("POLAR_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("[POLAR-WEBHOOK] POLAR_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Get the payload and signature
    const payload = await req.text();
    const signature = req.headers.get("polar-webhook-signature");
    
    if (!signature) {
      console.error("[POLAR-WEBHOOK] No signature provided");
      return new Response("No signature provided", { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Verify the webhook signature
    const isValid = await verifyWebhookSignature(payload, signature, webhookSecret);
    if (!isValid) {
      console.error("[POLAR-WEBHOOK] Invalid signature");
      return new Response("Invalid signature", { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Parse the webhook payload
    const webhookData = JSON.parse(payload);
    console.log("[POLAR-WEBHOOK] Webhook data:", JSON.stringify(webhookData, null, 2));

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle different webhook events
    const { type, data } = webhookData;
    
    switch (type) {
      case "order.created":
      case "subscription.created":
        await handleSubscriptionCreated(supabase, data);
        break;
      case "subscription.updated":
        await handleSubscriptionUpdated(supabase, data);
        break;
      case "subscription.cancelled":
        await handleSubscriptionCancelled(supabase, data);
        break;
      default:
        console.log(`[POLAR-WEBHOOK] Unhandled event type: ${type}`);
    }

    return new Response("Webhook processed successfully", {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error("[POLAR-WEBHOOK] Error processing webhook:", error);
    return new Response(`Webhook processing failed: ${error.message}`, {
      status: 500,
      headers: corsHeaders
    });
  }
});

async function handleSubscriptionCreated(supabase: any, data: any) {
  console.log("[POLAR-WEBHOOK] Handling subscription created:", data);
  
  const { customer, product, amount } = data;
  const customerEmail = customer?.email;
  
  if (!customerEmail) {
    console.error("[POLAR-WEBHOOK] No customer email found");
    return;
  }

  // Determine token allocation based on product
  const tokenAllocation = getTokenAllocation(product?.id, amount);
  
  // Update or create subscriber record
  const { error } = await supabase
    .from("subscribers")
    .upsert({
      email: customerEmail,
      polar_customer_id: customer?.id,
      polar_product_id: product?.id,
      subscribed: true,
      subscription_tier: getSubscriptionTier(product?.id, amount),
      tokens_remaining: tokenAllocation,
      tokens_total: tokenAllocation,
      subscription_start: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

  if (error) {
    console.error("[POLAR-WEBHOOK] Error updating subscriber:", error);
  } else {
    console.log("[POLAR-WEBHOOK] Subscriber updated successfully");
  }
}

async function handleSubscriptionUpdated(supabase: any, data: any) {
  console.log("[POLAR-WEBHOOK] Handling subscription updated:", data);
  
  const { customer, product, amount } = data;
  const customerEmail = customer?.email;
  
  if (!customerEmail) {
    console.error("[POLAR-WEBHOOK] No customer email found");
    return;
  }

  const tokenAllocation = getTokenAllocation(product?.id, amount);
  
  const { error } = await supabase
    .from("subscribers")
    .update({
      polar_product_id: product?.id,
      subscription_tier: getSubscriptionTier(product?.id, amount),
      tokens_total: tokenAllocation,
      // Reset tokens on plan change
      tokens_remaining: tokenAllocation,
      updated_at: new Date().toISOString(),
    })
    .eq('email', customerEmail);

  if (error) {
    console.error("[POLAR-WEBHOOK] Error updating subscription:", error);
  }
}

async function handleSubscriptionCancelled(supabase: any, data: any) {
  console.log("[POLAR-WEBHOOK] Handling subscription cancelled:", data);
  
  const { customer } = data;
  const customerEmail = customer?.email;
  
  if (!customerEmail) {
    console.error("[POLAR-WEBHOOK] No customer email found");
    return;
  }

  const { error } = await supabase
    .from("subscribers")
    .update({
      subscribed: false,
      subscription_tier: null,
      subscription_end: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('email', customerEmail);

  if (error) {
    console.error("[POLAR-WEBHOOK] Error cancelling subscription:", error);
  }
}

function getTokenAllocation(productId: string, amount?: number): number {
  // Map product IDs to token allocations
  const productTokenMap: { [key: string]: number } = {
    // Monthly plans
    "81152fa6-ca1a-465f-9c3d-384dc8c6a8a9": 100,   // Basic Monthly
    "fafc1617-826a-4f61-ba37-3fe0a1dce8d9": 500,   // Pro Monthly
    "e2a82b41-2a06-46b9-84ea-d196f758f2b2": 1800,  // Premium Monthly
    
    // Yearly plans
    "64da80d5-3fe4-4a76-84d0-e56c607ffe61": 1200,  // Basic Yearly
    "2540c60b-9ef0-4c22-a1ce-7c2ab2ba9fda": 6000,  // Pro Yearly
    "1b319610-f033-4915-ba8a-71515342cc49": 21600, // Premium Yearly
  };

  return productTokenMap[productId] || 0;
}

function getSubscriptionTier(productId: string, amount?: number): string {
  // Map product IDs to subscription tiers
  const productTierMap: { [key: string]: string } = {
    // Monthly plans
    "81152fa6-ca1a-465f-9c3d-384dc8c6a8a9": "Basic",
    "fafc1617-826a-4f61-ba37-3fe0a1dce8d9": "Pro", 
    "e2a82b41-2a06-46b9-84ea-d196f758f2b2": "Premium",
    
    // Yearly plans
    "64da80d5-3fe4-4a76-84d0-e56c607ffe61": "Basic",
    "2540c60b-9ef0-4c22-a1ce-7c2ab2ba9fda": "Pro",
    "1b319610-f033-4915-ba8a-71515342cc49": "Premium",
    
    // Custom plans
    "dbf10011-1973-4639-9723-81fd8d4f96c1": "Custom",
    "91e74ded-3e16-4511-b299-f10b35778870": "Custom",
  };

  return productTierMap[productId] || "Unknown";
}