# l10n-codegen

![l10n-codegen banner](assets/banner.png)

Typed localization code generation for app projects.

Status: prototype. The v0 scope is Swift plus Kotlin wrappers generated from existing localization files or Phrase-managed exports.

## Why

Localization files are easy to mistype at call sites. `l10n-codegen` reads string resources, infers placeholder types, and writes typed accessors so missing parameters, wrong parameter types, and renamed keys fail during compilation instead of at runtime.

## Supported in v0

Inputs:

- Apple `.strings`
- Apple `.xcstrings` string catalogs, including plural variations
- Android `strings.xml`, including `string`, `plurals`, and `string-array`
- Phrase CLI/export files when pulled as `.strings`, `.xcstrings`, Android XML, or nested JSON

Outputs:

- Swift `enum` accessors backed by `Bundle.localizedString`
- Kotlin Android wrappers backed by `Context.getString`, `getQuantityString`, and `getStringArray`
- Kotlin Compose Multiplatform wrappers backed by `stringResource`, `pluralStringResource`, and `stringArrayResource`

## Phrase

Phrase should usually remain the translation sync layer. Pull Phrase files into the project with the Phrase CLI, then point `l10n-codegen` at those pulled files.

Phrase supports per-project file formats and can push/pull iOS strings and Android XML through `.phrase.yml`; it also supports multi-platform pull targets. Do not commit Phrase access tokens. Use `PHRASE_ACCESS_TOKEN` or CI secrets.

Example:

```sh
phrase pull
npx l10n-codegen generate --config l10n-codegen.config.yml
```

## Source of truth

The source of truth is project-specific:

- Existing iOS app: point inputs at `.strings` or `.xcstrings`.
- Existing Android or Compose app: point inputs at `strings.xml`.
- Phrase-managed app: let Phrase pull platform files, then point inputs at those files.
- Shared translation repository: point inputs at nested JSON or any platform export, then choose outputs per app.

Inputs can be mixed. The generator merges keys into one catalog and fails when the same key is used for incompatible resource kinds.

Generated member names strip a duplicated wrapper namespace while preserving the raw resource key. For example, a key named `l10n.key_here` in an enum named `L10n` becomes `L10n.keyHere`, but still looks up `l10n.key_here` at runtime.

## Install

```sh
npm install
npm run build
```

## Generate

```sh
npm run build
node dist/cli.js generate --config examples/l10n-codegen.config.yml
```

Or after publishing:

```sh
npx l10n-codegen generate --config l10n-codegen.config.yml
```

## Wizard

Create a config interactively:

```sh
l10n-codegen init
```

The wizard asks for the input file or glob, input type, output platform, output path, Swift enum/struct name, flat or nested Swift API, and optional custom output template.

For a non-interactive starter config:

```sh
l10n-codegen init --defaults
```

## Example config

```yaml
defaultLocale: en
inputs:
  - type: apple-strings
    path: examples/apple/en.lproj/Localizable.strings
  - type: apple-xcstrings
    path: examples/apple/Localizable.xcstrings
    sourceLanguage: en
  - type: android-xml
    path: examples/android/res/values/strings.xml
  - type: phrase
    format: nested_json
    path: examples/phrase/en.json

outputs:
  - type: swift
    path: examples/generated/swift/L10n.swift
    enumName: L10n
    containerType: enum
    symbolStyle: flat
    accessLevel: public
    bundle: Bundle.main
  - type: kotlin-android
    path: examples/generated/kotlin/android/L10n.kt
    packageName: com.example.l10n
    rImport: com.example.app.R
  - type: kotlin-compose
    path: examples/generated/kotlin/compose/L10n.kt
    packageName: com.example.l10n
    resImport: com.example.generated.resources.Res
```

Swift output can use `symbolStyle: nested` when keys are namespaced:

```yaml
outputs:
  - type: swift
    path: Generated/L10n.swift
    enumName: L10n
    containerType: enum
    symbolStyle: nested
    nestingSeparator: "."
```

A key named `settings.title` then generates `L10n.Settings.title`.

## Custom Templates

Each output can use a custom Handlebars template with `template`.

```yaml
outputs:
  - type: swift
    path: Generated/L10n.swift
    enumName: L10n
    template: Templates/L10n.swift.hbs
```

Template syntax is intentionally small:

```hbs
// {{generatedHeader}}
enum {{containerName}} {
{{#each entries}}
  {{#if isString}}
  static var {{apiName}}: String {
    NSLocalizedString("{{key}}", comment: "")
  }
  {{/if}}
{{/each}}
}
```

Common template values:

- `output`: the output config block.
- `containerName`: Swift enum/struct name or Kotlin object name with defaults applied.
- `entries`: sorted localization entries.
- `entry.key`: raw lookup key.
- `entry.apiName`: generated method/property name.
- `entry.resourceName`: Android/Compose resource name.
- `entry.kind`: `string`, `plural`, or `array`.
- `entry.placeholders`: inferred placeholders.
- `entry.swiftParameters`, `entry.swiftArguments`.
- `entry.kotlinParameters`, `entry.kotlinArguments`.

See `examples/templates/swift-minimal.hbs` for a small Swift template.

## Project structure

- `src/parse`: file parsers and placeholder inference
- `src/generate`: Swift and Kotlin emitters
- `examples`: sample inputs and config
- `legacy/swiftgen-template`: preserved SwiftGen Stencil template that started this project
- `skills`: agent workflows for updating strings and regenerating code

## License

MIT
