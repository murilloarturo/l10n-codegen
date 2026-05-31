#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { generateFromConfig } from "./config.js";
import { runInitWizard, writeDefaultConfig } from "./initWizard.js";

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "init" || command === "wizard") {
    const configPath = option(args, "--config") ?? "l10n-codegen.config.yml";
    if (args.includes("--defaults") || args.includes("--no-interactive") || !process.stdin.isTTY) {
      await writeDefaultConfig(configPath);
      console.log(`Wrote ${configPath}`);
    } else {
      await runInitWizard(configPath);
    }
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
  l10n-codegen init [--config l10n-codegen.config.yml] [--defaults]
  l10n-codegen wizard [--config l10n-codegen.config.yml]
  l10n-codegen generate [--config l10n-codegen.config.yml]
`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
