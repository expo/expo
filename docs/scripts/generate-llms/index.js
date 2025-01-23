import { generateEasDocs } from './eas-docs.js';
import { generateExpoDocs } from './expo-docs.js';
import { generateLlmsTxt } from './llms-txt.js';

async function main() {
  await generateExpoDocs();
  await generateEasDocs();
  await generateLlmsTxt();
}

main().catch(console.error);
