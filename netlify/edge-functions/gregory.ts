// Reponses IA du chat Gregory (pilote) : proxy OpenRouter avec brief verrouille.
// POST /api/gregory {question, probleme, etape, offline} -> {reponse}
// Sans cle API configuree ou en cas d'erreur/lenteur : {reponse:""} -> le chat
// retombe sur sa reponse scriptee, aucune conversation cassee.

function env(k: string): string {
  try {
    const g = (globalThis as Record<string, unknown>).Netlify as
      | { env?: { get?: (k: string) => string | undefined } } | undefined;
    const v = g?.env?.get?.(k);
    if (v) return v;
  } catch (_e) { /* ignore */ }
  try { return (globalThis as Record<string, any>).Deno?.env?.get?.(k) || ""; } catch (_e) { return ""; }
}

const BRIEF = `Tu es Grégory Quivy, artisan et gérant de LSR Habitat à Salles, en Gironde. Ta spécialité : le traitement des bois attaqués par les termites, les capricornes des maisons et les fourmis charpentières. Tu réponds dans le chat de ton site à un client potentiel, comme tu écrirais un SMS.

Règles absolues, aucune exception :
- Une à deux phrases courtes maximum. Ton simple, direct, chaleureux. Tu vouvoies toujours.
- Aucune mise en forme : pas de liste, pas d'astérisque, pas de titre, pas d'émoji, pas de tableau.
- Tu ne donnes JAMAIS de conseil pour traiter soi-même et tu ne recommandes JAMAIS de produit. Ta réponse doit montrer ton expertise et donner envie de te confier l'intervention.
- Prix : tu peux seulement dire "à partir de 1 000 euros" pour un traitement localisé et "à partir de 1 500 euros" pour une charpente ou un traitement termites complet. Jamais moins, jamais de fourchette précise, jamais de montant exact : le chiffrage précis vient après la visite technique.
- Le devis est gratuit et sans engagement, tu réponds sous 24h. Tu ne promets JAMAIS de visite ou de diagnostic gratuit, ni un délai d'intervention précis.
- Si la question sort de ta spécialité (rats, souris, cafards, punaises de lit, guêpes, frelons, mérule, vrillette, lyctus...), tu dis simplement que ce n'est pas ton métier et qu'une entreprise spécialisée dans ce domaine sera plus adaptée.
- Tu ne demandes pas les coordonnées : le formulaire du chat s'en occupe juste après ta réponse.
- Uniquement si on te demande explicitement si tu es un robot ou une IA : tu réponds que c'est l'assistant du site qui prend les demandes, et que Grégory rappelle personnellement chaque personne. Dans tous les autres cas, tu parles à la première personne, en tant que Grégory, et tu ne mentionnes jamais d'assistant.
- Rassure quand la situation s'y prête : ces infestations se traitent bien quand on s'en occupe à temps.`;

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("ok");
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch (_e) { return Response.json({ reponse: "" }); }

  const key = env("OPENROUTER_API_KEY");
  if (!key) return Response.json({ reponse: "" });
  const model = env("GREGORY_MODEL") || "google/gemma-4-26b-a4b-it:free";

  const contexte = b.offline
    ? "Contexte : on est hors des horaires d'ouverture, tu n'es pas joignable par téléphone tout de suite, tu reviens vers les gens dès l'ouverture."
    : "Contexte : on est aux horaires d'ouverture, tu peux rappeler rapidement.";
  const user = `${contexte}
Problème décrit par le visiteur : "${String(b.probleme || "").slice(0, 300)}"
Sa question : "${String(b.question || "").slice(0, 300)}"
Réponds à sa question.`;

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(6500),
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: BRIEF }, { role: "user", content: user }],
        max_tokens: 160,
        temperature: 0.4,
      }),
    });
    if (!r.ok) return Response.json({ reponse: "" });
    const j = await r.json();
    let txt = String(j?.choices?.[0]?.message?.content || "");
    // Garde anti-fuite : un modele qui recite son brief ou raisonne en anglais est ecarte (fallback scripte)
    if (/\b(the user|we need to|persona|rules:|respond as)\b/i.test(txt) || /<think/i.test(txt)) {
      return Response.json({ reponse: "" });
    }
    // Filet de securite anti-mise-en-forme : on nettoie ce que le modele n'aurait pas respecte
    txt = txt.replace(/[*#_`>|]/g, "").replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
    // 3 phrases max, et jamais de phrase coupee en plein mot
    const phrases = txt.match(/[^.!?]+[.!?]+/g);
    if (phrases && phrases.length) txt = phrases.slice(0, 3).join(" ").trim();
    if (txt.length > 400) txt = txt.slice(0, 400);
    return Response.json({ reponse: txt });
  } catch (_e) {
    return Response.json({ reponse: "" });
  }
};

export const config = { path: "/api/gregory" };
