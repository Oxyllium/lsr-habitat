// Reponses IA du chat Gregory (pilote) : proxy OpenRouter avec brief verrouille.
// POST /api/gregory {question, probleme, etape, offline} -> {reponse}
// Sans cle API configuree ou en cas d'erreur/lenteur : {reponse:""} -> le chat
// retombe sur sa reponse scriptee, aucune conversation cassee.

function env(k: string): string {
  const nettoie = (brut: string): string => {
    let txt = String(brut || "");
    if (/\b(the user|we need to|persona|rules:|respond as)\b/i.test(txt) || /<think/i.test(txt)) return "";
    txt = txt.replace(/[*#_`>|]/g, "").replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
    const phrases = txt.match(/[^.!?]+[.!?]+/g);
    if (phrases && phrases.length) txt = phrases.slice(0, 3).join(" ").trim();
    return txt.length > 400 ? txt.slice(0, 400) : txt;
  };

  // Essais sequentiels a delai court : un modele qui traine ne bloque plus la reponse
  const MODELES = [model, "inclusionai/ling-3.0-flash:free", "google/gemma-4-31b-it:free"];
  for (let n = 0; n < MODELES.length; n++) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(n === 0 ? 6000 : 5000),
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODELES[n],
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
