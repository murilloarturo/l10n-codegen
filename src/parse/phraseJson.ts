import type { LocalizationEntry } from "../types.js";
import { inferPlaceholders, mergePlaceholders } from "./placeholders.js";

const pluralKeys = new Set(["zero", "one", "two", "few", "many", "other"]);

export function parsePhraseJson(content: string, sourcePath: string): LocalizationEntry[] {
  const data = JSON.parse(content) as unknown;
  const entries: LocalizationEntry[] = [];
  walk(data, [], entries, sourcePath);
  return entries;
}

function walk(value: unknown, path: string[], entries: LocalizationEntry[], sourcePath: string): void {
  if (typeof value === "string") {
    const key = path.join(".");
    entries.push({
      key,
      kind: "string",
      value,
      placeholders: inferPlaceholders(value),
      source: {
        path: sourcePath,
        format: "phrase-json"
      }
    });
    return;
  }

  if (Array.isArray(value)) {
    const key = path.join(".");
    entries.push({
      key,
      kind: "array",
      items: value.map((item) => String(item)),
      placeholders: [],
      source: {
        path: sourcePath,
        format: "phrase-json"
      }
    });
    return;
  }

  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    if (isPluralObject(object)) {
      const forms = Object.fromEntries(
        Object.entries(object)
          .filter(([key, formValue]) => pluralKeys.has(key) && typeof formValue === "string")
          .map(([key, formValue]) => [key, formValue as string])
      );
      entries.push({
        key: path.join("."),
        kind: "plural",
        forms,
        placeholders: mergePlaceholders(Object.values(forms)),
        source: {
          path: sourcePath,
          format: "phrase-json"
        }
      });
      return;
    }

    for (const [childKey, childValue] of Object.entries(object)) {
      walk(childValue, [...path, childKey], entries, sourcePath);
    }
  }
}

function isPluralObject(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => pluralKeys.has(key));
}
