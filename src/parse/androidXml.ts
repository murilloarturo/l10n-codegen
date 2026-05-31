import { XMLParser } from "fast-xml-parser";
import type { LocalizationEntry } from "../types.js";
import { asArray } from "../utils/text.js";
import { inferPlaceholders, mergePlaceholders } from "./placeholders.js";

interface AndroidStringNode {
  name?: string;
  "#text"?: string;
}

interface AndroidPluralNode {
  name?: string;
  item?: AndroidPluralItem | AndroidPluralItem[];
}

interface AndroidPluralItem {
  quantity?: string;
  "#text"?: string;
}

interface AndroidArrayNode {
  name?: string;
  item?: string | string[] | AndroidStringNode | AndroidStringNode[];
}

export function parseAndroidXml(content: string, sourcePath: string): LocalizationEntry[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    trimValues: false,
    parseTagValue: false,
    parseAttributeValue: false,
    commentPropName: "#comment"
  });
  const document = parser.parse(content) as {
    resources?: {
      string?: AndroidStringNode | AndroidStringNode[];
      plurals?: AndroidPluralNode | AndroidPluralNode[];
      "string-array"?: AndroidArrayNode | AndroidArrayNode[];
    };
  };

  const resources = document.resources ?? {};
  const entries: LocalizationEntry[] = [];

  for (const node of asArray(resources.string)) {
    if (!node.name) continue;
    const value = textValue(node);
    entries.push({
      key: node.name,
      kind: "string",
      value,
      placeholders: inferPlaceholders(value),
      source: {
        path: sourcePath,
        format: "android-xml"
      }
    });
  }

  for (const node of asArray(resources.plurals)) {
    if (!node.name) continue;
    const forms = Object.fromEntries(
      asArray(node.item)
        .filter((item) => item.quantity)
        .map((item) => [item.quantity as string, textValue(item)])
    );
    entries.push({
      key: node.name,
      kind: "plural",
      forms,
      placeholders: mergePlaceholders(Object.values(forms)),
      source: {
        path: sourcePath,
        format: "android-xml"
      }
    });
  }

  for (const node of asArray(resources["string-array"])) {
    if (!node.name) continue;
    entries.push({
      key: node.name,
      kind: "array",
      items: asArray(node.item).map((item) => (typeof item === "string" ? item : textValue(item))),
      placeholders: [],
      source: {
        path: sourcePath,
        format: "android-xml"
      }
    });
  }

  return entries;
}

function textValue(node: { "#text"?: string } | string): string {
  return typeof node === "string" ? node : node["#text"] ?? "";
}
