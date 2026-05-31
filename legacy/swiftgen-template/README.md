# SwiftGen Typed Localization

A drop-in [SwiftGen](https://github.com/SwiftGen/SwiftGen) **strings** template that
generates a type-safe, compiler-checked localization API from your `.strings` files —
with a few ergonomics that the stock template doesn't give you.

It works in **any iOS project** (app target, framework, or Swift Package). The only
project-specific decision — _which `Bundle` resolves the strings_ — is a single config
param. No source edits required.

---

## What you get

Given a `Localizable.strings` like:

```strings
"welcome_title" = "Welcome!";
"items_count"   = "You have %d items";
"greet_user"    = "Hi %@, you have %d messages";
```

SwiftGen generates a `LocalizationKey` enum (associated values for format args) plus a
`Localization` resolver:

```swift
// No args
Localization.localizeKey(.welcomeTitle)            // "Welcome!"

// With typed, ordered args — the compiler enforces count + types
Localization.localizeKey(.itemsCount(3))           // "You have 3 items"
Localization.localizeKey(.greetUser("Ana", 5))     // "Hi Ana, you have 5 messages"
```

### Why use this over the stock SwiftGen strings template

- **Type-safe call sites.** Keys with format placeholders become enum cases with
  associated values, so a wrong arg count or type is a build error, not a runtime
  `%@`-vs-`%d` surprise.
- **Centralized resolver.** All lookups funnel through one `Localization` class
  (`key -> (String, [CVarArg])` via `mapKey`). Easy to log misses, swap the bundle,
  inject a pseudo-locale for testing, or route through your own l10n layer.
- **Spaced-percent guard.** Strings containing a *spaced* percent (`"% d"`, `"% @"`, …)
  are treated as literal text and returned verbatim instead of being fed to
  `String(format:)` — which would otherwise crash or mangle output. This is a common
  footgun with human-edited / machine-translated catalogs.
- **Bundle-agnostic.** App, framework, or SPM — pick the bundle in config, not in code.

---

## Files

| File | Purpose |
|------|---------|
| `stringsTemplate.stencil` | The SwiftGen Stencil template. |
| `swiftgen.yml` | Example config — copy and edit paths/params for your project. |

---

## Setup

### 1. Install SwiftGen

```bash
brew install swiftgen
# or Mint:   mint install SwiftGen/SwiftGen
# or as an SPM plugin / build tool
```

### 2. Copy these files into your project

Drop `stringsTemplate.stencil` and `swiftgen.yml` somewhere in your repo (e.g. a
`Scripts/` or `.swiftgen/` folder). Edit `swiftgen.yml`:

- `input_dir` / `inputs` → your development-language `.strings` file.
- `output_dir` / `output` → where `Localization.swift` should be written.
- `params` → see the table below.

### 3. Pick your bundle

This is the one thing that differs per project type:

| Project type | What to set in `params` |
|--------------|-------------------------|
| **App target** | _nothing_ — defaults to `Bundle.main` |
| **Framework / static lib** | _nothing_ — `Bundle.main`, or set a custom bundle |
| **Swift Package (SPM)** | `bundle: Bundle.module` |
| **Custom resource bundle** | `bundle: MyResources.bundle` (any expression returning a `Bundle`) |

> ℹ️ `Bundle.module` only exists inside an SPM target. If you put generated code in an
> app target and leave `bundle` unset, it correctly uses `Bundle.main`.

### 4. Generate

```bash
swiftgen config run --config swiftgen.yml
```

Add this as a build pre-action / Run Script phase to keep it in sync, and commit the
generated `Localization.swift`.

---

## Config params reference

| Param | Default | Meaning |
|-------|---------|---------|
| `enumName` | `L10n` | Name of the generated key enum. |
| `publicAccess` | `false` (internal) | `true` makes the API `public` (use for packages/frameworks). |
| `bundle` | `Bundle.main` | Swift expression for the bundle that resolves strings. Set `Bundle.module` for SPM. |
| `tableName` | `nil` (Localizable) | Non-default `.strings` table name (e.g. `Errors` → `Errors.strings`). |

---

## How it works (under the hood)

1. SwiftGen parses your **development-language** `.strings` to discover keys and infer
   each placeholder's type (`%@` → `String`, `%d` → `Int`, …).
2. The template emits:
   - `enum LocalizationKey` — one case per key, with associated values for any args.
   - `LocalizationKey.mapKey(_:)` — maps a case back to its raw key string + ordered
     arg array.
   - `Localization` — resolves the key against the chosen `Bundle`, applies the
     spaced-percent guard, then `String(format:)` with the args.

Note: only the development language is read at generation time (for keys + types).
Actual translations are resolved at runtime from whatever `.lproj` the device picks —
exactly like normal `NSLocalizedString`.

---

## License

Share freely. Attribution appreciated but not required.
