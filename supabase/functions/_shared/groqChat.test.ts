import { describe, expect, it } from "vitest";
import { groqChatRequest, parseGroqChatCompletion } from "./groqChat";

const valid = {
  choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
    reply: "How many staff use the system?", source_ids: ["pricing"],
    managed_service: false, plan_help: true, handoff: false,
  }) } }],
};

describe("Groq Llama chat adapter", () => {
  it("uses strict JSON schema for the selected Qwen model", () => {
    const request = groqChatRequest("qwen/qwen3.8-27b", "Use approved facts.", [{ role: "user", text: "Which plan?" }]);
    expect(request.model).toBe("qwen/qwen3.8-27b");
    expect(request.response_format).toMatchObject({ type: "json_schema", json_schema: { strict: true } });
    expect(request.max_completion_tokens).toBe(650);
    expect(request.messages[0].role).toBe("system");
    expect(request.messages[1]).toEqual({ role: "user", content: "Which plan?" });
  });

  it("uses JSON Object Mode for Enterprise Llama without schema support", () => {
    expect(groqChatRequest("llama-3.3-70b-versatile", "Use approved facts.", []).response_format).toEqual({ type: "json_object" });
  });

  it("accepts a complete, validated JSON response", () => {
    expect(parseGroqChatCompletion(valid)).toEqual({
      reply: "How many staff use the system?", source_ids: ["pricing"],
      managed_service: false, plan_help: true, handoff: false,
    });
  });

  it("rejects truncated and invalid model output before it reaches product logic", () => {
    expect(() => parseGroqChatCompletion({ choices: [{ ...valid.choices[0], finish_reason: "length" }] })).toThrow();
    expect(() => parseGroqChatCompletion({ choices: [{ finish_reason: "stop", message: { content: '{"reply":"hi"}' } }] })).toThrow();
    expect(() => parseGroqChatCompletion({ choices: [{ finish_reason: "stop", message: { content: "not JSON" } }] })).toThrow();
  });
});
