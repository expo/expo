import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { generateLlmsTxt } from './llms-txt.js';
import { OUTPUT_DIRECTORY_NAME } from './shared.js';

const GENERATED_LLMS_FILES = ['llms.txt'];

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

try {
  await generateLlmsTxt();
} catch {
  process.exit(1);
}

await syncGeneratedLlmsToOut();
