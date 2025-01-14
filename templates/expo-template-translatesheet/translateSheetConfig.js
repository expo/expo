/**
 * @type {Object} TranslateSheetConfig
 * @property {string} apiKey - The API key used for authenticating with the TranslateSheet backend.
 * @property {string} output - The directory where the generated translation files will be saved.
 * @property {string} primaryLanguage - The primary language of the project (e.g., "en" for English).
 * @property {string} fileExtension - The file extension for the generated translation files (e.g., ".ts" for TypeScript files).
 * @property {string[]} languages - An array of target languages for translation (e.g., ["es"] for Spanish).
 */
const translateSheetConfig = {
  apiKey: "sk-fe525773-a750-4688-9331-59272c229c7c",
  output: "./i18n",
  primaryLanguage: "en",
  fileExtension: ".ts",
  languages: ["es", "ja", "de", "ru", "zh", "ja"],
};

module.exports = translateSheetConfig;
