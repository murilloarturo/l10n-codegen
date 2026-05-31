import type { LocalizationEntry } from "../types.js";
import { inferPlaceholders } from "./placeholders.js";

export function parseAppleStrings(content: string, sourcePath: string): LocalizationEntry[] {
  const entries: LocalizationEntry[] = [];
  const pairPattern = /"((?:\\.|[^"\\])*)"\s*=\s*"((?:\\.|[^"\\])*)"\s*;/g;

  for (const match of content.matchAll(pairPattern)) {
    const key = unescapeAppleString(match[1]);
    const value = unescapeAppleString(match[2]);
    entries.push({
      key,
      kind: "string",
      value,
      placeholders: inferPlaceholders(value),
      source: {
        path: sourcePath,
        format: "apple-strings"
      }
    });
  }

  return entries;
}

function unescapeAppleString(value: string): string {
  return value
    .replace(/\\"/g, "\"")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\");
}
