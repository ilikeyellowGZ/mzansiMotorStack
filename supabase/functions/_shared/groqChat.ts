// Groq offers strict JSON Schema output for selected models; other models use
// JSON Object Mode. Validate either response before trusted product actions.
export type GroqMessage = { role: "user" | "assistant"; text: string };
export type GroqDecision = {
  reply: string;
  source_ids: string[];
  managed_service: boolean;
  plan_help: boolean;
  handoff: boolean;
};

const strictJsonModels = new Set(["qwen/qwen3.8-27b"]);
const decisionSchema = {
  type: "object",
  properties: {
    reply: { type: "string" },
    source_ids: { type: "array", items: { type: "string", enum: ["pricing", "platform", "setup", "privacy"] } },
    managed_service: { type: "boolean" },
    plan_help: { type: "boolean" },
    handoff: { type: "boolean" },
  },
  required: ["reply", "source_ids", "managed_service", "plan_help", "handoff"],
  additionalProperties: false,
} as const;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function groqChatRequest(model: string, instructions: string, messages: GroqMessage[]) {
  return {
    model,
    messages: [
      { role: "system", content: `${instructions}\nReturn only a JSON object with exactly these keys: reply (short string), source_ids (array of approved source IDs), managed_service (boolean), plan_help (boolean), handoff (boolean). No markdown or extra text.` },
      ...messages.map(({ role, text }) => ({ role, content: text })),
    ],
    response_format: strictJsonModels.has(model)
      ? { type: "json_schema", json_schema: { name: "motorstack_chat", strict: true, schema: decisionSchema } }
      : { type: "json_object" },
    max_completion_tokens: 650,
    temperature: 0.2,
  };
}

export function parseGroqChatCompletion(payload: unknown): GroqDecision {
  if (!record(payload) || !Array.isArray(payload.choices)) throw new Error("Invalid Groq completion");
  const choice = payload.choices[0];
  if (!record(choice) || choice.finish_reason !== "stop" || !record(choice.message) ||
      typeof choice.message.content !== "string" || choice.message.content.length > 10_000) {
    throw new Error("Incomplete Groq completion");
  }
  const result: unknown = JSON.parse(choice.message.content);
  if (!record(result) || typeof result.reply !== "string" || !result.reply.trim() || result.reply.length > 2000 ||
      !Array.isArray(result.source_ids) || result.source_ids.length > 10 || !result.source_ids.every((id) => typeof id === "string") ||
      typeof result.managed_service !== "boolean" || typeof result.plan_help !== "boolean" || typeof result.handoff !== "boolean") {
    throw new Error("Invalid Groq response fields");
  }
  return {
    reply: result.reply,
    source_ids: result.source_ids,
    managed_service: result.managed_service,
    plan_help: result.plan_help,
    handoff: result.handoff,
  };
}
