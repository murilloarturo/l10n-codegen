import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import YAML from "yaml";
import type { CodegenConfig, InputConfig, LocalizationCatalog, LocalizationEntry } from "./types.js";
import { generateSwift } from "./generate/swift.js";
import { generateKotlinAndroid, generateKotlinCompose } from "./generate/kotlin.js";
import { parseAndroidXml } from "./parse/androidXml.js";
import { parseAppleStrings } from "./parse/appleStrings.js";
import { parseAppleXcstrings } from "./parse/appleXcstrings.js";
import { parsePhraseJson } from "./parse/phraseJson.js";
import { asArray, uniqueBy } from "./utils/text.js";

export async function loadConfig(configPath: string): Promise<CodegenConfig> {
  const content = await readFile(configPath, "utf8");
  const parsed = configPath.endsWith(".json")
    ? (JSON.parse(content) as CodegenConfig)
    : (YAML.parse(content) as CodegenConfig);
  validateConfig(parsed);
  return parsed;
}

export async function generateFromConfig(configPath: string): Promise<string[]> {
  const absoluteConfigPath = path.resolve(configPath);
  const baseDir = path.dirname(absoluteConfigPath);
  const config = await loadConfig(absoluteConfigPath);
  const catalog = await loadCatalog(config, baseDir);
  const written: string[] = [];

  for (const output of config.outputs) {
    const outputPath = path.resolve(baseDir, output.path);
    const content =
      output.type === "swift"
        ? generateSwift(catalog, output)
        : output.type === "kotlin-android"
          ? generateKotlinAndroid(catalog, output)
          : generateKotlinCompose(catalog, output);

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content, "utf8");
    written.push(outputPath);
  }

  return written;
}

export async function loadCatalog(config: CodegenConfig, baseDir: string): Promise<LocalizationCatalog> {
  const allEntries: LocalizationEntry[] = [];

  for (const input of config.inputs) {
    const files = await expandInput(input, baseDir);
    for (const filePath of files) {
      const content = await readFile(filePath, "utf8");
      allEntries.push(...parseInput(input, filePath, content));
    }
  }

  return {
    defaultLocale: config.defaultLocale,
    entries: mergeEntries(allEntries)
  };
}

function validateConfig(config: CodegenConfig): void {
  if (!config.inputs?.length) {
    throw new Error("Config must include at least one input.");
  }
  if (!config.outputs?.length) {
    throw new Error("Config must include at least one output.");
  }
}

async function expandInput(input: InputConfig, baseDir: string): Promise<string[]> {
  const patterns = asArray(input.path);
  const files: string[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: baseDir,
      absolute: true,
      nodir: true
    });
    files.push(...(matches.length > 0 ? matches : [path.resolve(baseDir, pattern)]));
  }

  return uniqueBy(files, (file) => file).sort();
}

function parseInput(input: InputConfig, filePath: string, content: string): LocalizationEntry[] {
  const type = normalizeInputType(input, filePath);

  switch (type) {
    case "apple-strings":
      return parseAppleStrings(content, filePath);
    case "apple-xcstrings":
      return parseAppleXcstrings(content, filePath, input.sourceLanguage ?? input.locale);
    case "android-xml":
      return parseAndroidXml(content, filePath);
    case "phrase-json":
      return parsePhraseJson(content, filePath);
    default:
      throw new Error(`Unsupported input type: ${type}`);
  }
}

function normalizeInputType(input: InputConfig, filePath: string): Exclude<InputConfig["type"], undefined | "auto" | "phrase"> | "phrase-json" {
  if (input.type === "phrase") {
    switch (input.format) {
      case "strings":
        return "apple-strings";
      case "strings_catalog":
        return "apple-xcstrings";
      case "xml":
      case "android":
        return "android-xml";
      case "nested_json":
      default:
        return "phrase-json";
    }
  }

  if (input.type && input.type !== "auto") {
    return input.type;
  }

  if (filePath.endsWith(".xcstrings")) return "apple-xcstrings";
  if (filePath.endsWith(".strings")) return "apple-strings";
  if (filePath.endsWith(".xml")) return "android-xml";
  if (filePath.endsWith(".json")) return "phrase-json";
  throw new Error(`Could not infer input type for ${filePath}. Set input.type explicitly.`);
}

function mergeEntries(entries: LocalizationEntry[]): LocalizationEntry[] {
  const byKey = new Map<string, LocalizationEntry>();

  for (const entry of entries) {
    const existing = byKey.get(entry.key);
    if (!existing) {
      byKey.set(entry.key, entry);
      continue;
    }
    if (existing.kind !== entry.kind) {
      throw new Error(`Localization key "${entry.key}" is both ${existing.kind} and ${entry.kind}.`);
    }
    byKey.set(entry.key, {
      ...existing,
      value: existing.value ?? entry.value,
      forms: existing.forms ?? entry.forms,
      items: existing.items ?? entry.items,
      comment: existing.comment ?? entry.comment,
      placeholders:
        existing.placeholders.length >= entry.placeholders.length
          ? existing.placeholders
          : entry.placeholders
    });
  }

  return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
}
