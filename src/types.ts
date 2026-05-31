export type InputType =
  | "auto"
  | "apple-strings"
  | "apple-xcstrings"
  | "android-xml"
  | "phrase"
  | "phrase-json";

export type OutputType = "swift" | "kotlin-android" | "kotlin-compose";

export type EntryKind = "string" | "plural" | "array";

export type PlaceholderType = "String" | "Int" | "Long" | "Double" | "Boolean" | "Any";

export interface Placeholder {
  index: number;
  name: string;
  specifier: string;
  type: PlaceholderType;
}

export interface EntrySource {
  path: string;
  format: string;
}

export interface LocalizationEntry {
  key: string;
  kind: EntryKind;
  value?: string;
  forms?: Record<string, string>;
  items?: string[];
  comment?: string;
  placeholders: Placeholder[];
  source?: EntrySource;
}

export interface LocalizationCatalog {
  defaultLocale?: string;
  entries: LocalizationEntry[];
}

export interface InputConfig {
  type?: InputType;
  path: string | string[];
  format?: "strings" | "strings_catalog" | "xml" | "android" | "nested_json";
  locale?: string;
  sourceLanguage?: string;
}

export interface SwiftOutputConfig {
  type: "swift";
  path: string;
  enumName?: string;
  accessLevel?: "internal" | "public";
  bundle?: string;
  tableName?: string;
}

export interface KotlinAndroidOutputConfig {
  type: "kotlin-android";
  path: string;
  packageName?: string;
  objectName?: string;
  rImport?: string;
}

export interface KotlinComposeOutputConfig {
  type: "kotlin-compose";
  path: string;
  packageName?: string;
  objectName?: string;
  resImport?: string;
}

export type OutputConfig = SwiftOutputConfig | KotlinAndroidOutputConfig | KotlinComposeOutputConfig;

export interface CodegenConfig {
  defaultLocale?: string;
  inputs: InputConfig[];
  outputs: OutputConfig[];
}
