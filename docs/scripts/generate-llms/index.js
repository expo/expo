import { generateLlmsEasTxt } from './llms-eas-txt.js';
import { generateLlmsFullTxt } from './llms-full-txt.js';
import { generateLlmsTxt } from './llms-txt.js';

Promise.all([
  await generateLlmsEasTxt(),
  await generateLlmsFullTxt(),
  await generateLlmsTxt(),
]).catch(console.error);
