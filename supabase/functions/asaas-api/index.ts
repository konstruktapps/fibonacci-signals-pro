import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_BASE_URL = "https://sandbox.asaas.com/api/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
  if (!ASAAS_API_KEY) {
    return new Response(JSON.stringify({ error: "ASAAS_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Authenticate user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = claimsData.claims.sub;

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // Check admin role for admin-only actions
    const checkAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    };

    if (action === "create-customer") {
      // Create customer in Asaas
      const response = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: ASAAS_API_KEY,
        },
        body: JSON.stringify({
          name: body.name,
          email: body.email,
          cpfCnpj: body.cpfCnpj,
          phone: body.phone || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Asaas create customer failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify({ success: true, customer: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create-subscription") {
      // Create subscription in Asaas
      const { customerId, planId } = body;

      // Get plan from DB
      const { data: plan, error: planError } = await supabase
        .from("plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (planError || !plan) {
        throw new Error("Plan not found");
      }

      const cycleMap: Record<string, string> = {
        monthly: "MONTHLY",
        quarterly: "QUARTERLY",
        semiannual: "SEMIANNUALLY",
        annual: "YEARLY",
      };

      const response = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: ASAAS_API_KEY,
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: "UNDEFINED", // user chooses payment method
          value: plan.price_cents / 100,
          cycle: cycleMap[plan.interval] || "MONTHLY",
          description: `Assinatura: ${plan.name}`,
          externalReference: userId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Asaas create subscription failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      // Save subscription in DB
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await adminClient.from("subscriptions").insert({
        user_id: userId,
        plan_id: planId,
        status: "pending",
        asaas_subscription_id: data.id,
        asaas_customer_id: customerId,
        started_at: new Date().toISOString(),
      });

      return new Response(JSON.stringify({ success: true, subscription: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list-plans") {
      // Admin only: sync plans
      if (!(await checkAdmin())) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: plans } = await supabase
        .from("plans")
        .select("*")
        .order("created_at", { ascending: false });

      return new Response(JSON.stringify({ success: true, plans }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Asaas API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
