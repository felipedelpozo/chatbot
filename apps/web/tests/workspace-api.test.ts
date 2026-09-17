import { expect, test } from "bun:test";
import { POST as createProject } from "../src/app/api/projects/route";

test("rejects project creation without a session", async () => {
  const response = await createProject(
    new Request("http://localhost/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Unauthorized" }),
    }),
  );
  expect(response.status).toBe(401);
});

