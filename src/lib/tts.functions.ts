import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Voix de l'enseignant : français d'Abidjan (accent ivoirien), voix d'homme
 * chaude et posée, au tempo NORMAL d'un journaliste RTI — ni lent, ni pressé.
 */
const INSTRUCTIONS = [
  "Tu es Inocent KOFFI, enseignant ivoirien d'Abidjan, un homme adulte : voix grave, chaude, ronde, humaine, jamais robotique.",
  "Accent ivoirien authentique et assumé : rythme et musique du français de Côte d'Ivoire, consonnes bien posées, voyelles ouvertes et franches, aucune intonation neutre de robot.",
  "Diction claire de journaliste de la RTI au journal de 20 heures, tempo normal et naturel : ni traîné, ni pressé, avec de vraies respirations entre les phrases.",
  "Prononce chaque son de lettre nettement et isolément, sans liaison parasite : dis « A », jamais « ta » ; dis « borr », jamais « bé » quand on te donne ce son.",
  "Ton vivant, souriant, affectueux et patient, comme un ami qui encourage : ton élève est un adulte qui n'a jamais été à l'école.",
].join(" ");

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
