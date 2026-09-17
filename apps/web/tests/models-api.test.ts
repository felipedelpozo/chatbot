import { expect, test } from "bun:test";
import { GET as getModels } from "../src/app/api/models/route";

test("protects the server-derived model catalog", async () => {
  const response = await getModels(new Request("http://localhost/api/models"));
  expect(response.status).toBe(401);
});

