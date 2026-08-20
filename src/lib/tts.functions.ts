import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Voix de l'enseignant : français d'Afrique de l'Ouest (accent ivoirien),
 * voix d'homme chaude, posée, très lente, comme un journaliste RTI qui
 * s'adresse à un adulte qui apprend à lire.
 */
const INSTRUCTIONS = [
  "Tu es un enseignant ivoirien, un homme adulte, voix grave, chaude et rassurante.",
  "Parle un français d'Abidjan, accent ivoirien clair, articulation nette, comme un journaliste de la RTI.",
  "Parle très lentement, calmement, en marquant de vraies pauses entre chaque phrase et après chaque son de lettre.",
  "Ne te presse jamais. Prononce chaque son de lettre en le tenant longuement.",
  "Ton bienveillant, patient, encourageant, souriant : ton élève est un adulte qui n'a jamais été à l'école.",
].join(" ");

export const speakServer = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ text: z.string().min(1).max(900) }).parse(data))
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
        speed: 0.85,
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
