import { compileTalksFile } from './compileTalks.js';
import { generateLlmsEasTxt } from './llms-eas-txt.js';
import { generateLlmsFullTxt } from './llms-full-txt.js';
import { generatePerPageMd } from './per-page/index.js';
import { generateLlmsSdkTxt } from './llms-sdk.js';
import { generateLlmsTxt } from './llms-txt.js';

await compileTalksFile();

Promise.allSettled([
  await generateLlmsSdkTxt(),
  await generateLlmsEasTxt(),
  await generateLlmsFullTxt(),
  await generateLlmsTxt(),
  await generatePerPageMd(),
]).catch(console.error);
