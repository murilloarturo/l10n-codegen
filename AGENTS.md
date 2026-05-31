# Agent Guide

## Purpose

`l10n-codegen` generates typed Swift and Kotlin localization accessors from app string resources. The generator should accept project-specific inputs instead of forcing one source-of-truth format.

## Architecture

- `src/types.ts` owns the internal catalog model.
- `src/parse/*` converts file formats into that model.
- `src/generate/*` converts the model into platform code.
- `src/config.ts` loads project config and routes parse/generate work.
- `src/initWizard.ts` owns interactive config creation.
- `src/generate/templates.ts` owns custom Handlebars template rendering.
- Generated outputs belong in app projects or `examples/generated`, never in `src`.

Keep parsers independent from generators. If a file format has a platform-specific detail, normalize it into the shared catalog before generation.

## Commands

```sh
npm install
npm run build
npm test
npm run lint
node dist/cli.js generate --config examples/l10n-codegen.config.yml
node dist/cli.js init --defaults --config /tmp/l10n-codegen.config.yml
```

## Coding Rules

- Prefer small deterministic parsers and explicit tests over broad regex-only rewrites.
- Keep generated code stable. Sort output by key.
- Do not edit generated files by hand; change parser, model, or generator code and rerun generation.
- For custom output, prefer `.hbs` templates over adding platform-specific one-off flags.
- Treat Phrase as a sync/input source. Do not commit access tokens or generated `.phrase.yml` files with secrets.
- Preserve backward-compatible config names when possible.

## Verification

Before committing generator changes, run:

```sh
npm run build
npm test
npm run lint
```

For parser changes, add or update fixtures that cover the new input shape.

## Git

Check `git status` before edits. Keep commits scoped. Do not revert unrelated user changes.
