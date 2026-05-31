import type { Placeholder, PlaceholderType } from "../types.js";
import { uniqueBy } from "../utils/text.js";

const printfSpecifier =
  /(?<!%)%((?<position>\d+)\$)?[-+# 0,(<]*(?:\d+|\*)?(?:\.(?:\d+|\*))?(?<length>hh|h|ll|l|L|z|t|j)?(?<kind>[@diuoxXfFeEgGaAcCsSp])/g;

export function inferPlaceholders(value: string): Placeholder[] {
  const placeholders: Placeholder[] = [];
  let unindexed = 0;

  for (const match of value.matchAll(printfSpecifier)) {
    if (match[0] === "%%") continue;
    const position = match.groups?.position ? Number(match.groups.position) : undefined;
    const index = position ?? ++unindexed;
    const kind = match.groups?.kind ?? "s";
    placeholders.push({
      index,
      name: `p${index}`,
      specifier: match[0],
      type: typeForSpecifier(kind, match.groups?.length)
    });
  }

  return uniqueBy(placeholders.sort((a, b) => a.index - b.index), (placeholder) =>
    String(placeholder.index)
  );
}

export function mergePlaceholders(values: string[]): Placeholder[] {
  return uniqueBy(
    values.flatMap((value) => inferPlaceholders(value)).sort((a, b) => a.index - b.index),
    (placeholder) => String(placeholder.index)
  );
}

function typeForSpecifier(kind: string, length?: string): PlaceholderType {
  switch (kind) {
    case "@":
    case "s":
    case "S":
    case "c":
    case "C":
      return "String";
    case "d":
    case "i":
    case "u":
    case "o":
    case "x":
    case "X":
      return length === "ll" ? "Long" : "Int";
    case "f":
    case "F":
    case "e":
    case "E":
    case "g":
    case "G":
    case "a":
    case "A":
      return "Double";
    case "p":
      return "Long";
    default:
      return "Any";
  }
}
