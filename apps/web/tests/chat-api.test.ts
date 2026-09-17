import { expect, test } from "bun:test";
import { POST as sendChatMessage } from "../src/app/api/chat/route";

test("rejects chat generation without a session before validation or provider routing", async () => {
  const response = await sendChatMessage(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),
  );
  expect(response.status).toBe(401);
});

