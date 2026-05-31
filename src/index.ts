export { generateFromConfig, loadCatalog, loadConfig } from "./config.js";
export { generateSwift } from "./generate/swift.js";
export { generateKotlinAndroid, generateKotlinCompose } from "./generate/kotlin.js";
export { parseAndroidXml } from "./parse/androidXml.js";
export { parseAppleStrings } from "./parse/appleStrings.js";
export { parseAppleXcstrings } from "./parse/appleXcstrings.js";
export { parsePhraseJson } from "./parse/phraseJson.js";
export type * from "./types.js";
