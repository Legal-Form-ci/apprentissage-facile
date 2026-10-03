import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Voix de l'enseignant : français d'Abidjan (accent ivoirien), voix d'homme
 * chaude et posée, au tempo NORMAL d'un journaliste RTI — ni lent, ni pressé.
 */
const INSTRUCTIONS = [
  "Tu es un enseignant ivoirien adulte, chaleureux et naturel. Tu t'adresses à un adulte débutant en alphabétisation, jamais à un enfant.",
  "Parle en français de Côte d'Ivoire naturel, clair et compréhensible. Ne caricature jamais l'accent ivoirien et n'utilise pas de nouchi.",
  "Utilise une prosodie ivoirienne naturelle : rythme vivant, groupes de mots courts, accentuation naturelle, intonation conversationnelle. Pas de voix de publicité, pas de voix de robot, pas de ton de récitation.",
  "Tempo conversationnel normal. Ne ralentis que lorsqu'une notion est réellement enseignée. Ne coupe pas artificiellement les phrases et ne mets pas de pause entre chaque mot.",
  "Quand tu prononces une lettre, distingue clairement le nom de la lettre et son son. Ne fabrique jamais de pseudo-mots phonétiques comme meunn, leurr, beurr, reurr, aaa ou euh.",
  "Pour une consonne difficile à isoler, enseigne-la dans un mot repère naturel : par exemple « M comme maman », puis fais entendre le début du mot. Ne transforme pas la consonne en syllabe inventée.",
  "Ne chante pas les voyelles et ne les allonge pas inutilement. Dis une voyelle brièvement et naturellement.",
  "Sois patient, encourageant et respectueux. Une correction doit être courte : montrer, faire essayer, corriger, refaire une fois si nécessaire, puis avancer.",
  "Évite les formulations longues. Une consigne orale = une idée à la fois, généralement une phrase courte.",
].join(" ")" ");

export const speakServer = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        text: z.string().min(1).max(900),
        speed: z.number().min(0.5).max(1.5).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { audio: null as string | null };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        voice: "onyx",
        input: data.text,
        // tempo normal par défaut, piloté par le réglage de clarté
        speed: Math.min(1.2, Math.max(0.8, data.speed ?? 1)),
        instructions: INSTRUCTIONS,
        response_format: "mp3",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`TTS gateway ${res.status}: ${body}`);
      return { audio: null as string | null, status: res.status };
    }

    const buf = await res.arrayBuffer();
    return { audio: Buffer.from(buf).toString("base64") };
  });
