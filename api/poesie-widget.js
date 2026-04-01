import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const requiredToken = process.env.POESIE_WIDGET_TOKEN;
    if (requiredToken) {
      const provided = req?.query?.token || req?.headers?.["x-poesie-widget-token"];
      if (provided !== requiredToken) {
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }
    }

    const recipient = String(req?.query?.recipient || "").trim().toLowerCase();
    const includeShared = String(req?.query?.includeShared || "0") === "1";

    const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

    if (!supabaseUrl || !supabaseKey) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Supabase is not configured on the server." }));
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase.from("petits_mots").select("id,content,sender_email,recipient_email,created_at");

    if (recipient) {
      query = includeShared
        ? query.or(`recipient_email.eq.${recipient},recipient_email.is.null`)
        : query.eq("recipient_email", recipient);
    } else {
      query = query.is("recipient_email", null);
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(1);
    if (error) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: error.message }));
      return;
    }

    const row = Array.isArray(data) ? data[0] : null;
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=300");
    res.end(JSON.stringify({ data: row || null }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: err?.message || String(err) }));
  }
}

