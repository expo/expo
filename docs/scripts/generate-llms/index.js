import process from 'node:process';

import { compileTalksFile } from './compileTalks.js';
import { generateLlmsEasTxt } from './llms-eas-txt.js';
import { generateLlmsFullTxt } from './llms-full-txt.js';
import { generateLlmsSdkTxt } from './llms-sdk.js';
import { generateLlmsTxt } from './llms-txt.js';

await compileTalksFile();

const results = await Promise.allSettled([
  generateLlmsSdkTxt(),
  generateLlmsEasTxt(),
  generateLlmsFullTxt(),
  generateLlmsTxt(),
]);

const failures = results.filter(result => result.status === 'rejected');
for (const failure of failures) {
  console.error(failure.reason);
}
if (failures.length > 0) {
  process.exit(1);
}
