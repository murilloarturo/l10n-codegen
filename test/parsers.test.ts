import { describe, expect, it } from "vitest";
import { parseAndroidXml, parseAppleStrings, parseAppleXcstrings, parsePhraseJson } from "../src/index.js";

describe("parsers", () => {
  it("parses Apple .strings placeholders", () => {
    const entries = parseAppleStrings('"greet_user" = "Hi %@, you have %d messages";', "Localizable.strings");

    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe("greet_user");
    expect(entries[0].placeholders.map((placeholder) => placeholder.type)).toEqual(["String", "Int"]);
  });

  it("does not treat escaped percent text as a placeholder", () => {
    const entries = parseAppleStrings('"progress" = "Progress 100%% complete";', "Localizable.strings");

    expect(entries[0].placeholders).toEqual([]);
  });

  it("parses Android plurals and arrays", () => {
    const entries = parseAndroidXml(
      `<resources>
        <plurals name="photo_count">
          <item quantity="one">%d photo</item>
          <item quantity="other">%d photos</item>
        </plurals>
        <string-array name="tips"><item>One</item><item>Two</item></string-array>
      </resources>`,
      "strings.xml"
    );

    expect(entries.find((entry) => entry.key === "photo_count")?.kind).toBe("plural");
    expect(entries.find((entry) => entry.key === "tips")?.items).toEqual(["One", "Two"]);
  });

  it("parses xcstrings plural variations", () => {
    const entries = parseAppleXcstrings(
      JSON.stringify({
        sourceLanguage: "en",
        strings: {
          "cart.item_count": {
            localizations: {
              en: {
                variations: {
                  plural: {
                    one: { stringUnit: { value: "%d item" } },
                    other: { stringUnit: { value: "%d items" } }
                  }
                }
              }
            }
          }
        }
      }),
      "Localizable.xcstrings"
    );

    expect(entries[0].kind).toBe("plural");
    expect(entries[0].forms?.other).toBe("%d items");
  });

  it("parses Phrase nested JSON strings, plurals, and arrays", () => {
    const entries = parsePhraseJson(
      JSON.stringify({
        paywall: {
          title: "Unlock",
          features: ["One", "Two"],
          days: { one: "%d day", other: "%d days" }
        }
      }),
      "en.json"
    );

    expect(entries.map((entry) => [entry.key, entry.kind])).toEqual([
      ["paywall.title", "string"],
      ["paywall.features", "array"],
      ["paywall.days", "plural"]
    ]);
  });
});
