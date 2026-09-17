import { describe, expect, test } from "bun:test";
import { getModelCatalog, requireAvailableCatalogEntry } from "../src";

describe("model catalog", () => {
  test("returns no models without a connected provider", () => {
    expect(getModelCatalog([])).toEqual([]);
  });

  test("returns only models backed by connected providers", () => {
    const catalog = getModelCatalog(["openai"], {});
    expect(catalog).toHaveLength(3);
    expect(catalog[0]).toMatchObject({
      id: "openai:gpt-5.6",
      providerId: "openai",
      modelId: "gpt-5.6",
      label: "GPT-5.6",
      isAvailable: true,
      isDefault: true,
    });
    expect(catalog.map((entry) => entry.id)).toEqual([
      "openai:gpt-5.6",
      "openai:gpt-5.6-terra",
      "openai:gpt-5.6-luna",
    ]);
    expect(catalog.filter((entry) => entry.isDefault)).toHaveLength(1);
    expect(catalog.map((entry) => entry.id)).not.toContain("demo:balanced");
    expect(catalog.some((entry) => entry.providerId === "anthropic")).toBe(false);
    expect(catalog.some((entry) => entry.providerId === "google")).toBe(false);
  });

  test("rejects unknown and unavailable catalog IDs", () => {
    expect(() => requireAvailableCatalogEntry("made-up", [])).toThrow("Unknown model");
    expect(() => requireAvailableCatalogEntry("openai:gpt-5.6", [], {})).toThrow(
      "not configured",
    );
  });

  test("prepends a model override as the single default without treating it as credential state", () => {
    const catalog = getModelCatalog(["google"], { GOOGLE_MODEL: "gemini-test" });
    expect(catalog).toHaveLength(4);
    expect(catalog[0]).toMatchObject({
      id: "google:gemini-test",
      modelId: "gemini-test",
      label: "gemini-test",
      isAvailable: true,
      isDefault: true,
    });
    expect(catalog.filter((entry) => entry.isDefault)).toHaveLength(1);
    expect(catalog.map((entry) => entry.id)).toContain("google:gemini-3.1-pro-preview");
  });

  test("deduplicates a model override already present in the curated catalog", () => {
    const catalog = getModelCatalog(["anthropic"], {
      ANTHROPIC_MODEL: "claude-sonnet-5",
    });

    expect(catalog).toHaveLength(3);
    expect(catalog[0]).toMatchObject({
      id: "anthropic:claude-sonnet-5",
      isDefault: true,
    });
    expect(
      catalog.filter((entry) => entry.id === "anthropic:claude-sonnet-5"),
    ).toHaveLength(1);
  });

  test("returns concrete models for every connected provider with one global default", () => {
    const catalog = getModelCatalog(["openai", "anthropic", "google"], {});

    expect(catalog).toHaveLength(9);
    expect(new Set(catalog.map((entry) => entry.providerId))).toEqual(
      new Set(["openai", "anthropic", "google"]),
    );
    expect(catalog.filter((entry) => entry.isDefault)).toHaveLength(1);
  });
});
