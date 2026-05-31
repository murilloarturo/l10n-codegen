const swiftKeywords = new Set([
  "associatedtype",
  "class",
  "deinit",
  "enum",
  "extension",
  "fileprivate",
  "func",
  "import",
  "init",
  "inout",
  "internal",
  "let",
  "open",
  "operator",
  "private",
  "protocol",
  "public",
  "static",
  "struct",
  "subscript",
  "typealias",
  "var",
  "break",
  "case",
  "catch",
  "continue",
  "default",
  "defer",
  "do",
  "else",
  "fallthrough",
  "for",
  "guard",
  "if",
  "in",
  "repeat",
  "return",
  "switch",
  "throw",
  "where",
  "while"
]);

const kotlinKeywords = new Set([
  "as",
  "break",
  "class",
  "continue",
  "do",
  "else",
  "false",
  "for",
  "fun",
  "if",
  "in",
  "interface",
  "is",
  "null",
  "object",
  "package",
  "return",
  "super",
  "this",
  "throw",
  "true",
  "try",
  "typealias",
  "typeof",
  "val",
  "var",
  "when",
  "while"
]);

export function camelIdentifier(input: string, reserved: Set<string>, namespace?: string): string {
  const words = stripNamespacePrefix(input, namespace)
    .replace(/['"]/g, "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

  const fallback = words.length === 0 ? ["value"] : words;
  const [first, ...rest] = fallback;
  let result =
    first.toLowerCase() +
    rest.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("");

  if (/^[0-9]/.test(result)) {
    result = `_${result}`;
  }
  if (reserved.has(result)) {
    result = `${result}Value`;
  }
  return result;
}

export function pascalIdentifier(input: string, namespace?: string): string {
  const camel = camelIdentifier(input, new Set(), namespace);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function swiftIdentifier(input: string, namespace?: string): string {
  return camelIdentifier(input, swiftKeywords, namespace);
}

export function kotlinIdentifier(input: string, namespace?: string): string {
  return camelIdentifier(input, kotlinKeywords, namespace);
}

export function resourceIdentifier(input: string): string {
  const result = input
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  const safe = result.length === 0 ? "value" : result;
  return /^[0-9]/.test(safe) ? `_${safe}` : safe;
}

export function splitIdentifierPath(input: string, namespace: string | undefined, separator = "."): string[] {
  const stripped = stripNamespacePrefix(input, namespace);
  if (separator.length === 0) return [stripped];
  const parts = stripped.split(separator).map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [stripped];
}

export function stripNamespacePrefix(input: string, namespace: string | undefined): string {
  if (!namespace) return input;
  const normalizedNamespace = namespace.replace(/[^A-Za-z0-9]+/g, "").toLowerCase();
  if (!normalizedNamespace) return input;

  const normalizedInput = input.replace(/[^A-Za-z0-9]+/g, "").toLowerCase();
  if (!normalizedInput.startsWith(normalizedNamespace) || normalizedInput === normalizedNamespace) {
    return input;
  }

  const prefixPattern = new RegExp(`^${escapeRegExp(normalizedNamespace)}[^A-Za-z0-9]*`, "i");
  const stripped = input.replace(prefixPattern, "");
  return stripped.length > 0 ? stripped : input;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
