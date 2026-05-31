---
name: generate-localization-code
description: Generate typed Swift and Kotlin localization accessors from project string resources using l10n-codegen. Use when a user asks an agent to add, update, validate, or regenerate localization code from .strings, .xcstrings, Android strings.xml, Phrase exports, plurals, or string arrays.
---

# Generate Localization Code

Use this skill when a project uses `l10n-codegen` or asks for typed localization wrappers.

## Workflow

1. Find the config.
   - Prefer `l10n-codegen.config.yml`, `l10n-codegen.config.yaml`, or `l10n-codegen.config.json`.
   - If there is no config, run `l10n-codegen init` for an interactive setup or `l10n-codegen init --defaults` for a starter file.
   - If the project uses Phrase, inspect `.phrase.yml` only to understand where Phrase pulls files. Do not read or expose tokens.

2. Update source strings only.
   - Apple strings: edit `.strings` or `.xcstrings`.
   - Android/Kotlin: edit `res/values/strings.xml`.
   - Phrase: edit the pulled source file only when the repo treats it as source of truth. Otherwise tell the user to update Phrase and run `phrase pull`.
   - Never hand-edit generated Swift or Kotlin output.

3. Regenerate.
   - Run `npm run build` if this repo is checked out from source.
   - Run `l10n-codegen generate --config <config>` or `node dist/cli.js generate --config <config>`.
   - If an output uses `template:`, edit the referenced `.hbs` template instead of changing generated code.

4. Verify.
   - Run the owning project's build or tests when available.
   - For this generator repo, run `npm run build`, `npm test`, and `npm run lint`.

## Rules

- Keep key names stable unless the user asked for a rename.
- Preserve placeholder order and indexed placeholders such as `%1$s`.
- For plurals, ensure the quantity parameter is first in generated Kotlin calls.
- For string arrays, prefer native Android/Compose resources; Swift output may embed array values because Apple has no Android-style `string-array` runtime lookup.
- Custom templates use Handlebars syntax such as `{{#each entries}}`, not SwiftGen Stencil.
- Generated files should be deterministic and committed when the project commits generated code.
