#!/usr/bin/env node
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { generateFromConfig } from "./config.js";

const exampleConfig = `defaultLocale: en
inputs:
  - type: auto
    path: Resources/en.lproj/Localizable.strings

outputs:
  - type: swift
    path: Generated/L10n.swift
    enumName: L10n
    accessLevel: internal
    bundle: Bundle.main
`;

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "init") {
    const configPath = option(args, "--config") ?? "l10n-codegen.config.yml";
    if (existsSync(configPath)) {
      throw new Error(`${configPath} already exists.`);
    }
    await writeFile(configPath, exampleConfig, "utf8");
    console.log(`Wrote ${configPath}`);
    return;
  }

  if (command === "generate") {
    const configPath = option(args, "--config") ?? "l10n-codegen.config.yml";
    const written = await generateFromConfig(path.resolve(configPath));
    for (const filePath of written) {
      console.log(`Generated ${filePath}`);
    }
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function printHelp(): void {
  console.log(`l10n-codegen

Usage:
  l10n-codegen init [--config l10n-codegen.config.yml]
  l10n-codegen generate [--config l10n-codegen.config.yml]
`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
