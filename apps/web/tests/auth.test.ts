import { describe, expect, test } from "bun:test";
import { isSafeReturnPath } from "../src/lib/api";

describe("authentication return paths", () => {
  test("allows local paths", () => {
    expect(isSafeReturnPath("/projects/project-id/chats/chat-id")).toBe(true);
  });

  test("rejects external and protocol-relative redirects", () => {
    expect(isSafeReturnPath("https://example.com")).toBe(false);
    expect(isSafeReturnPath("//example.com")).toBe(false);
  });
});

