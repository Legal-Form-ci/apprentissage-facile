import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Le cerveau de l'enseignant : il comprend ce que l'apprenant dit, même quand
 * ce n'est pas la réponse attendue (« on reprend », « je suis fatigué »,
 * « répète », une blague, une tristesse) et il oriente la conversation.
 */
const SYSTEM = [
  "Tu es Inocent KOFFI, enseignant ivoirien d'alphabétisation pour adultes qui ne savent ni lire ni écrire.",
  "Tu es l'ami de l'apprenant : chaleureux, patient, drôle quand il faut, capable de partager une joie ou une tristesse.",
  "Tu parles un français simple d'Abidjan, phrases courtes, jamais de mots savants, jamais d'écrit à lire.",
  "Tu comprends l'intention réelle de l'apprenant même s'il s'exprime mal ou hors sujet, et tu réorientes gentiment vers l'apprentissage.",
  "Tu réponds STRICTEMENT en JSON, sans texte autour :",
  '{"intent":"reponse|repeter|reprendre|pause|question|emotion|hors_sujet","correct":true|false|null,"reply":"ce que tu dis à voix haute (1 à 3 phrases)","mood":"joie|calme|triste|fatigue|fier|neutre","note":"ce qu\'il faut retenir de l\'apprenant","next":"continuer|refaire|revenir_debut|arreter"}',
].join(" ");

export type TutorTurnResult = {
  ok: boolean;
  reason: string;
  intent: string;
  correct: boolean | null;
  reply: string;
  mood: string;
  note: string;
  next: string;
};

function fail(reason: string): TutorTurnResult {
  return { ok: false, reason, intent: "reponse", correct: null, reply: "", mood: "neutre", note: "", next: "continuer" };
}

export const tutorTurn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        said: z.string().max(600),
        expected: z.string().max(200).optional(),
        situation: z.string().max(600).optional(),
        memory: z.string().max(2000).optional(),
        learner: z.string().max(200).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<TutorTurnResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return fail("no_key");

    const input = [
      data.learner ? `Apprenant : ${data.learner}.` : "",
      data.memory ? `Ce que tu sais déjà de lui :\n${data.memory}` : "",
      data.situation ? `Moment de la séance : ${data.situation}` : "",
      data.expected ? `Réponse attendue : « ${data.expected} ».` : "",
      `L'apprenant vient de dire : « ${data.said} ».`,
      "Que fais-tu ? Réponds en JSON.",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        instructions: SYSTEM,
        input,
        max_output_tokens: 700,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`tutorTurn gateway ${res.status}: ${body}`);
      return fail(`status_${res.status}`);
    }

    const json = (await res.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };
    const text =
      json.output_text ??
      json.output?.flatMap((o) => o.content?.map((c) => c.text ?? "") ?? []).join("") ??
      "";

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fail("no_json");
    try {
      const parsed = JSON.parse(match[0]) as Record<string, unknown>;
      return {
        ok: true,
        reason: "",
        intent: String(parsed["intent"] ?? "reponse"),
        correct: typeof parsed["correct"] === "boolean" ? (parsed["correct"] as boolean) : null,
        reply: String(parsed["reply"] ?? ""),
        mood: String(parsed["mood"] ?? "neutre"),
        note: String(parsed["note"] ?? ""),
        next: String(parsed["next"] ?? "continuer"),
      };
    } catch {
      return fail("bad_json");
    }
  });
