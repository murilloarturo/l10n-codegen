import type { LocalizationEntry } from "../types.js";
import { uniqueBy } from "../utils/text.js";
import { inferPlaceholders, mergePlaceholders } from "./placeholders.js";

interface XcstringsCatalog {
  sourceLanguage?: string;
  strings?: Record<string, XcstringsEntry>;
}

interface XcstringsEntry {
  comment?: string;
  localizations?: Record<string, XcstringsLocalization>;
  substitutions?: Record<string, XcstringsSubstitution>;
}

interface XcstringsLocalization {
  stringUnit?: {
    value?: string;
  };
  variations?: {
    plural?: Record<string, XcstringsLocalization>;
    [name: string]: unknown;
  };
}

interface XcstringsSubstitution {
  formatSpecifier?: string;
}

export function parseAppleXcstrings(
  content: string,
  sourcePath: string,
  sourceLanguage?: string
): LocalizationEntry[] {
  const catalog = JSON.parse(content) as XcstringsCatalog;
  const language = sourceLanguage ?? catalog.sourceLanguage;
  const entries: LocalizationEntry[] = [];

  for (const [key, entry] of Object.entries(catalog.strings ?? {})) {
    const localization = chooseLocalization(entry.localizations, language);
    if (!localization) continue;

    const substitutionPlaceholders = Object.values(entry.substitutions ?? {})
      .map((substitution) => substitution.formatSpecifier)
      .filter((specifier): specifier is string => Boolean(specifier))
      .flatMap((specifier) => inferPlaceholders(specifier));

    const plural = localization.variations?.plural;
    if (plural) {
      const forms = Object.fromEntries(
        Object.entries(plural)
          .map(([form, value]) => [form, value.stringUnit?.value])
          .filter((pair): pair is [string, string] => typeof pair[1] === "string")
      );
      entries.push({
        key,
        kind: "plural",
        forms,
        comment: entry.comment,
        placeholders: mergeXcstringsPlaceholders(Object.values(forms), substitutionPlaceholders),
        source: {
          path: sourcePath,
          format: "apple-xcstrings"
        }
      });
      continue;
    }

    const value = localization.stringUnit?.value;
    if (typeof value !== "string") continue;
    entries.push({
      key,
      kind: "string",
      value,
      comment: entry.comment,
      placeholders: mergeXcstringsPlaceholders([value], substitutionPlaceholders),
      source: {
        path: sourcePath,
        format: "apple-xcstrings"
      }
    });
  }

  return entries;
}

function chooseLocalization(
  localizations: Record<string, XcstringsLocalization> | undefined,
  sourceLanguage: string | undefined
): XcstringsLocalization | undefined {
  if (!localizations) return undefined;
  if (sourceLanguage && localizations[sourceLanguage]) return localizations[sourceLanguage];
  return Object.values(localizations)[0];
}

function mergeXcstringsPlaceholders(values: string[], substitutionPlaceholders: ReturnType<typeof inferPlaceholders>) {
  return uniqueBy(
    [...substitutionPlaceholders, ...mergePlaceholders(values)].sort((a, b) => a.index - b.index),
    (placeholder) => String(placeholder.index)
  );
}
