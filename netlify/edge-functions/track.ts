// Audit du trafic Google Ads : collecte first-party des clics payes.
// POST /api/track  -> enregistre un evenement (start/end) avec IP + UA serveur
// GET  /api/track?dump=YYYY-MM-DD&key=... -> exporte la journee (analyse locale)
import { getStore } from "https://esm.sh/@netlify/blobs@8.1.0";

function secret(): string {
  try {
    const g = (globalThis as Record<string, unknown>).Netlify as
      | { env?: { get?: (k: string) => string | undefined } }
      | undefined;
    const v = g?.env?.get?.("TRACK_DUMP_KEY");
    if (v) return v;
  } catch (_e) { /* ignore */ }
  try {
    return (globalThis as Record<string, any>).Deno?.env?.get?.("TRACK_DUMP_KEY") || "";
  } catch (_e) {
    return "";
  }
}

export default async (req: Request, context: { ip?: string; geo?: { country?: { code?: string }; city?: string } }) => {
  const store = getStore("ads-clicks");
  const url = new URL(req.url);

  const dump = url.searchParams.get("dump");
  if (dump) {
    const expected = secret();
    if (!expected || url.searchParams.get("key") !== expected) {
      return new Response("forbidden", { status: 403 });
    }
    const out: unknown[] = [];
    const { blobs } = await store.list({ prefix: dump });
    for (const b of blobs) {
      const v = await store.get(b.key, { type: "json" });
      if (v) out.push(v);
    }
    return Response.json(out);
  }

  if (req.method !== "POST") return new Response("ok");
  let data: Record<string, unknown> = {};
  try { data = await req.json(); } catch (_e) { return new Response("bad", { status: 400 }); }

  const day = new Date().toISOString().slice(0, 10);
  const rec = {
    ...data,
    ts: new Date().toISOString(),
    ip: context.ip || "",
    ua: req.headers.get("user-agent") || "",
    country: context.geo?.country?.code || "",
    city: context.geo?.city || "",
  };
  const key = `${day}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await store.setJSON(key, rec);
  return new Response("ok");
};

export const config = { path: "/api/track" };
