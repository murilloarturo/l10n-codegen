import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import YAML from "yaml";
import type { CodegenConfig, InputConfig, OutputConfig } from "./types.js";

export const defaultConfigText = `defaultLocale: en
inputs:
  - type: auto
    path: Resources/en.lproj/Localizable.strings

outputs:
  - type: swift
    path: Generated/L10n.swift
    enumName: L10n
    containerType: enum
    symbolStyle: flat
    accessLevel: internal
    bundle: Bundle.main
`;

export async function writeDefaultConfig(configPath: string): Promise<void> {
  if (existsSync(configPath)) {
    throw new Error(`${configPath} already exists.`);
  }
  await writeFile(configPath, defaultConfigText, "utf8");
}

export async function runInitWizard(configPath: string): Promise<void> {
  if (existsSync(configPath)) {
    throw new Error(`${configPath} already exists.`);
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const defaultLocale = await ask(rl, "Default locale", "en");
    const inputs: InputConfig[] = [];
    const outputs: OutputConfig[] = [];

    do {
      const inputPath = await ask(rl, "Input file or glob", "Resources/en.lproj/Localizable.strings");
      const inferredType = inferInputType(inputPath);
      const type = await ask(
        rl,
        "Input type (auto, apple-strings, apple-xcstrings, android-xml, phrase)",
        inferredType
      );
      const input: InputConfig = {
        type: type as InputConfig["type"],
        path: inputPath
      };

      if (type === "apple-xcstrings" || inputPath.endsWith(".xcstrings")) {
        input.sourceLanguage = await ask(rl, "String Catalog source language", defaultLocale);
      }

      if (type === "phrase") {
        input.format = (await ask(
          rl,
          "Phrase file format (strings, strings_catalog, android, nested_json)",
          "nested_json"
        )) as InputConfig["format"];
      }

      inputs.push(input);
    } while (await confirm(rl, "Add another input?", false));

    do {
      const outputType = await ask(rl, "Output type (swift, kotlin-android, kotlin-compose)", "swift");
      outputs.push(await outputForType(rl, outputType as OutputConfig["type"]));
    } while (await confirm(rl, "Add another output?", false));

    const config: CodegenConfig = {
      defaultLocale,
      inputs,
      outputs
    };

    await writeFile(configPath, YAML.stringify(config), "utf8");
    console.log(`Wrote ${configPath}`);
  } finally {
    rl.close();
  }
}

async function outputForType(
  rl: ReturnType<typeof createInterface>,
  outputType: OutputConfig["type"]
): Promise<OutputConfig> {
  if (outputType === "swift") {
    const enumName = await ask(rl, "Swift enum/struct name", "L10n");
    const output: OutputConfig = {
      type: "swift",
      path: await ask(rl, "Swift output path", "Generated/L10n.swift"),
      enumName,
      containerType: (await ask(rl, "Swift container type (enum, struct)", "enum")) as "enum" | "struct",
      symbolStyle: (await ask(rl, "Swift API style (flat, nested)", "flat")) as "flat" | "nested",
      accessLevel: (await ask(rl, "Swift access level (internal, public)", "internal")) as "internal" | "public",
      bundle: await ask(rl, "Swift bundle expression", "Bundle.main")
    };

    if (output.symbolStyle === "nested") {
      output.nestingSeparator = await ask(rl, "Nested key separator", ".");
    }

    if (await confirm(rl, "Use a custom output template instead of the built-in Swift generator?", false)) {
      output.template = await ask(rl, "Template path", "Templates/L10n.swift.hbs");
    }

    return output;
  }

  if (outputType === "kotlin-android") {
    const output: OutputConfig = {
      type: "kotlin-android",
      path: await ask(rl, "Kotlin output path", "app/src/main/java/com/example/l10n/L10n.kt"),
      packageName: await ask(rl, "Kotlin package name", "com.example.l10n"),
      objectName: await ask(rl, "Kotlin object name", "L10n"),
      rImport: await ask(rl, "R import", "com.example.app.R")
    };

    if (await confirm(rl, "Use a custom output template instead of the built-in Kotlin Android generator?", false)) {
      output.template = await ask(rl, "Template path", "Templates/L10n.android.kt.hbs");
    }

    return output;
  }

  if (outputType === "kotlin-compose") {
    const output: OutputConfig = {
      type: "kotlin-compose",
      path: await ask(rl, "Kotlin output path", "shared/src/commonMain/kotlin/com/example/l10n/L10n.kt"),
      packageName: await ask(rl, "Kotlin package name", "com.example.l10n"),
      objectName: await ask(rl, "Kotlin object name", "L10n"),
      resImport: await ask(rl, "Compose Res import", "com.example.generated.resources.Res")
    };

    if (await confirm(rl, "Use a custom output template instead of the built-in Kotlin Compose generator?", false)) {
      output.template = await ask(rl, "Template path", "Templates/L10n.compose.kt.hbs");
    }

    return output;
  }

  throw new Error(`Unsupported output type: ${outputType}`);
}

async function ask(
  rl: ReturnType<typeof createInterface>,
  question: string,
  defaultValue: string
): Promise<string> {
  const answer = (await rl.question(`${question} [${defaultValue}]: `)).trim();
  return answer.length > 0 ? answer : defaultValue;
}

async function confirm(
  rl: ReturnType<typeof createInterface>,
  question: string,
  defaultValue: boolean
): Promise<boolean> {
  const label = defaultValue ? "Y/n" : "y/N";
  const answer = (await rl.question(`${question} [${label}]: `)).trim().toLowerCase();
  if (!answer) return defaultValue;
  return answer === "y" || answer === "yes";
}

function inferInputType(inputPath: string): string {
  if (inputPath.endsWith(".xcstrings")) return "apple-xcstrings";
  if (inputPath.endsWith(".strings")) return "apple-strings";
  if (inputPath.endsWith(".xml")) return "android-xml";
  return "auto";
}
