// Reponses IA du chat Gregory (pilote) : proxy OpenRouter avec brief verrouille.
// POST /api/gregory {question, probleme, etape, offline} -> {reponse}
// Essais sequentiels multi-modeles a delai court : un modele lent ou sature ne
// condamne pas la reponse. Sans cle / tous modeles KO : {reponse:""} -> le chat
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
- LSR Habitat fait AUSSI les travaux de toiture (nettoyage, démoussage, étanchéité, rénovation) et le traitement de l'humidité : si on te demande ces services, c'est oui, et tu ramènes vers la prise de coordonnées comme pour le reste.
- Si la demande sort vraiment de tes métiers (rats, souris, cafards, punaises de lit, guêpes, frelons, mérule, vrillette, lyctus...), tu dis simplement que ce n'est pas ton domaine et qu'une entreprise spécialisée sera plus adaptée.
- Les coordonnées : tu ne les demandes que si la consigne du message te l'indique, UNE seule information à la fois, en expliquant pourquoi : tu les prends pour pouvoir rappeler gratuitement, faire le point, conseiller, et voir si la situation nécessite une intervention. Jamais un ton d'interrogatoire.
- Uniquement si on te demande explicitement si tu es un robot ou une IA : tu réponds que c'est l'assistant du site qui prend les demandes, et que Grégory rappelle personnellement chaque personne. Dans tous les autres cas, tu parles à la première personne, en tant que Grégory, et tu ne mentionnes jamais d'assistant.
- Tu ne commences jamais tes messages par "Bonjour" ou "Bonsoir" : la conversation est déjà engagée, tu réponds directement.
- Rassure quand la situation s'y prête : ces infestations se traitent bien quand on s'en occupe à temps, mais ne répète pas cette idée à chaque message.
- Objections, blocages, demandes annexes : tu ne polémiques JAMAIS. Tu valides le ressenti en une phrase, puis tu ramènes doucement vers l'appel gratuit avec Grégory, le meilleur moyen d'avoir une réponse fiable pour SA situation précise. Repères : refus de donner le numéro, tu rassures (il ne sert qu'à ce rappel, aucun démarchage) ; c'est trop cher, le chiffre exact vient de la visite et c'est souvent moins lourd qu'on l'imagine, l'appel ne coûte rien ; je veux juste un renseignement, justement deux minutes au téléphone valent mieux qu'un long écrit ; envoyez-moi un mail ou de la doc, c'est possible mais un appel rapide permet de cerner le vrai besoin d'abord. Quelle que soit la digression, ta réponse se termine en ramenant vers la prise de coordonnées.`;

function nettoie(brut: unknown): string {
  let txt = String(brut || "");
  if (/\b(the user|we need to|persona|rules:|respond as)\b/i.test(txt) || /<think/i.test(txt)) return "";
  txt = txt.replace(/[*#_`>|]/g, "").replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  const phrases = txt.match(/[^.!?]+[.!?]+/g);
  if (phrases && phrases.length) txt = phrases.slice(0, 4).join(" ").trim();
  return txt.length > 500 ? txt.slice(0, 500) : txt;
}

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("ok");
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch (_e) { return Response.json({ reponse: "" }); }

  const key = env("OPENROUTER_API_KEY");
  const principal = env("GREGORY_MODEL") || "google/gemma-4-26b-a4b-it:free";

  const contexte = b.offline
    ? "Contexte horaires (pour information seulement) : on est hors des horaires d'ouverture. Le visiteur le sait déjà, le chat le lui a dit. Tu ne mentionnes ta disponibilité QUE s'il demande à appeler, à être rappelé tout de suite, ou si tu es ouvert. Sinon tu réponds sur le fond, sans parler d'horaires ni de disponibilité."
    : "Contexte horaires : on est aux horaires d'ouverture, tu peux rappeler rapidement.";
  const DEMANDES: Record<string, string> = {
    prenom: "son prénom",
    nom: "son nom de famille",
    telephone: "son numéro de téléphone",
    email: "son adresse email",
    ville: "sa ville",
  };
  const demande = DEMANDES[String(b.etape || "")] || "";
  const consigne = demande
    ? `
Après ta réponse, enchaîne naturellement DANS LE MÊME message en demandant ${demande}. Adapte le ton à son message : s'il veut clairement un devis, sois direct ; s'il hésite ou s'inquiète, rassure d'abord. Rappelle au passage, avec tes mots, que tu prends ses coordonnées pour le rappeler gratuitement, faire le point et le conseiller de vive voix.`
    : "";
  const user = `${contexte}
Problème décrit par le visiteur : "${String(b.probleme || "").slice(0, 300)}"
Dernier message du visiteur : "${String(b.question || "").slice(0, 300)}"
Réponds-lui.${consigne}`;

  // 1. Gemini d'abord (RPD illimite, rapide) : Flash Lite puis Flash
  const gkey = env("GEMINI_API_KEY");
  if (gkey) {
    const gmodeles = ["gemini-flash-lite-latest", "gemini-flash-latest"];
    for (let n = 0; n < gmodeles.length; n++) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${gmodeles[n]}:generateContent?key=${gkey}`,
          {
            method: "POST",
            signal: AbortSignal.timeout(n === 0 ? 5000 : 4000),
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: BRIEF }] },
              contents: [{ role: "user", parts: [{ text: user }] }],
              generationConfig: { maxOutputTokens: 300, temperature: 0.4 },
            }),
          },
        );
        if (!r.ok) continue;
        const j = await r.json();
        const parts = j?.candidates?.[0]?.content?.parts || [];
        const txt = nettoie(parts.map((p: { text?: string }) => p.text || "").join(" "));
        if (txt) return Response.json({ reponse: txt });
      } catch (_e) { /* modele suivant */ }
    }
  }

  // 2. Secours : cascade OpenRouter (modeles gratuits)
  const modeles = [principal, "inclusionai/ling-3.0-flash:free", "google/gemma-4-31b-it:free"];
  for (let n = 0; n < modeles.length; n++) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(n === 0 ? 5000 : 4000),
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modeles[n],
          messages: [{ role: "system", content: BRIEF }, { role: "user", content: user }],
          max_tokens: 160,
          temperature: 0.4,
        }),
      });
      if (!r.ok) continue;
      const j = await r.json();
      const txt = nettoie(j?.choices?.[0]?.message?.content);
      if (txt) return Response.json({ reponse: txt });
    } catch (_e) { /* modele suivant */ }
  }
  return Response.json({ reponse: "" });
};

export const config = { path: "/api/gregory" };
