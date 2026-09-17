import { describe, expect, test } from "bun:test";
import { getMessageText, toUIMessage } from "../src/lib/chat-messages";

describe("chat message conversion", () => {
  test("joins text parts and ignores non-text UI parts", () => {
    expect(
      getMessageText({
        id: "message-1",
        role: "assistant",
        parts: [
          { type: "text", text: "Hello " },
          { type: "step-start" },
          { type: "text", text: "world" },
        ],
      }),
    ).toBe("Hello world");
  });

  test("maps persisted messages to AI SDK UI messages", () => {
    expect(
      toUIMessage({ id: "message-2", role: "assistant", content: "Ready" }),
    ).toEqual({
      id: "message-2",
      role: "assistant",
      parts: [{ type: "text", text: "Ready" }],
    });
  });
});

