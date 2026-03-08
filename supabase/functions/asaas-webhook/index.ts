import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const event = body.event;

    console.log("Asaas webhook received:", event, JSON.stringify(body));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Map Asaas payment events to subscription status
    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      const subscriptionId = body.payment?.subscription;
      if (subscriptionId) {
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("asaas_subscription_id", subscriptionId);

        console.log(`Subscription ${subscriptionId} activated`);
      }
    }

    if (event === "PAYMENT_OVERDUE") {
      const subscriptionId = body.payment?.subscription;
      if (subscriptionId) {
        await supabase
          .from("subscriptions")
          .update({
            status: "overdue",
            updated_at: new Date().toISOString(),
          })
          .eq("asaas_subscription_id", subscriptionId);

        console.log(`Subscription ${subscriptionId} overdue`);
      }
    }

    if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_DELETED") {
      const subscriptionId = body.payment?.subscription;
      if (subscriptionId) {
        await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("asaas_subscription_id", subscriptionId);

        console.log(`Subscription ${subscriptionId} cancelled`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
