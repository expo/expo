import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { generateLlmsEasTxt } from './llms-eas-txt.js';
import { generateLlmsFullTxt } from './llms-full-txt.js';
import { generateLlmsSdkTxt } from './llms-sdk.js';
import { generateLlmsTxt } from './llms-txt.js';
import { OUTPUT_DIRECTORY_NAME } from './shared.js';

const GENERATED_LLMS_FILES = ['llms.txt', 'llms-full.txt', 'llms-eas.txt', 'llms-sdk.txt'];

async function syncGeneratedLlmsToOut() {
  const outDir = path.join(process.cwd(), 'out');

  if (!fs.existsSync(outDir)) {
    return;
  }

  await Promise.all(
    GENERATED_LLMS_FILES.map(async filename => {
      const sourcePath = path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, filename);
      const targetPath = path.join(outDir, filename);

      if (!fs.existsSync(sourcePath)) {
        return;
      }

      await fs.promises.copyFile(sourcePath, targetPath);
    })
  );
}

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

await syncGeneratedLlmsToOut();
