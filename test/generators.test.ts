import { describe, expect, it } from "vitest";
import { generateKotlinAndroid, generateKotlinCompose, generateSwift } from "../src/index.js";
import type { LocalizationCatalog } from "../src/types.js";

const catalog: LocalizationCatalog = {
  defaultLocale: "en",
  entries: [
    {
      key: "greet_user",
      kind: "string",
      value: "Hi %@",
      placeholders: [{ index: 1, name: "p1", specifier: "%@", type: "String" }]
    },
    {
      key: "photo_count",
      kind: "plural",
      forms: { one: "%d photo", other: "%d photos" },
      placeholders: [{ index: 1, name: "p1", specifier: "%d", type: "Int" }]
    },
    {
      key: "onboarding_tips",
      kind: "array",
      items: ["One", "Two"],
      placeholders: []
    }
  ]
};

describe("generators", () => {
  it("generates typed Swift accessors", () => {
    const swift = generateSwift(catalog, {
      type: "swift",
      path: "L10n.swift",
      enumName: "L10n",
      accessLevel: "public"
    });

    expect(swift).toContain("public static func greetUser(_ p1: String) -> String");
    expect(swift).toContain("public static func photoCount(_ quantity: Int) -> String");
    expect(swift).toContain("public static var onboardingTips: [String]");
  });

  it("generates typed Kotlin Android wrappers", () => {
    const kotlin = generateKotlinAndroid(catalog, {
      type: "kotlin-android",
      path: "L10n.kt",
      packageName: "com.example",
      rImport: "com.example.R"
    });

    expect(kotlin).toContain("public fun greetUser(context: Context, p1: String): String");
    expect(kotlin).toContain("getQuantityString(R.plurals.photo_count, quantity, quantity)");
    expect(kotlin).toContain("getStringArray(R.array.onboarding_tips)");
  });

  it("generates typed Kotlin Compose wrappers", () => {
    const kotlin = generateKotlinCompose(catalog, {
      type: "kotlin-compose",
      path: "L10n.kt",
      packageName: "com.example",
      resImport: "com.example.generated.resources.Res"
    });

    expect(kotlin).toContain("@Composable");
    expect(kotlin).toContain("stringResource(Res.string.greet_user, p1)");
    expect(kotlin).toContain("pluralStringResource(Res.plurals.photo_count, quantity, quantity)");
    expect(kotlin).toContain("public fun onboardingTips(): List<String>");
  });
});
