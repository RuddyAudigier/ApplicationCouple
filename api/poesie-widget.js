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
      res.end(
        JSON.stringify({
          error:
            "Supabase is not configured on the server. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server (Vercel env vars).",
        }),
      );
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // GET: récupérer le dernier petit mot pour un destinataire
    if (!recipient) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Missing recipient (email)." }));
      return;
    }

    // 1) Message épinglé pour le widget
    const { data: widgetData, error: widgetError } = await supabase
      .from("poesie_widget_messages")
      .select("recipient_email,content,sender_email,updated_at")
      .eq("recipient_email", recipient)
      .limit(1);

    if (widgetError) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: widgetError.message }));
      return;
    }

    const pinned = Array.isArray(widgetData) ? widgetData[0] : null;
    if (pinned) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=300");
      res.end(
        JSON.stringify({
          data: {
            id: pinned.recipient_email,
            content: pinned.content,
            sender_email: pinned.sender_email,
            recipient_email: pinned.recipient_email,
            created_at: pinned.updated_at,
          },
        }),
      );
      return;
    }

    // 2) (Optionnel) fallback sur les messages "petits_mots" si demandé
    if (!includeShared) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=300");
      res.end(JSON.stringify({ data: null }));
      return;
    }

    let query = supabase.from("petits_mots").select("id,content,sender_email,recipient_email,created_at");
    query = query.or(`recipient_email.eq.${recipient},recipient_email.is.null`);

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
