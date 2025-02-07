import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const inputFile = path.join(projectRoot, 'public/static/talks.ts');
const outputFile = path.join(projectRoot, 'scripts/generate-llms/talks.js');

export async function compileTalksFile() {
  try {
    const inputFileContent = fs.readFileSync(inputFile).toString();
    const outputFileContent = ts.transpileModule(inputFileContent, {
      module: ts.ModuleKind.ESNext,
      compilerOptions: {
        target: 'ES2024',
        module: 'ES2024',
        moduleResolution: 'node',
      },
    }).outputText;

    fs.writeFileSync(outputFile, outputFileContent, 'utf8');

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully compiled talks.ts to talks.js`);
  } catch (error) {
    console.error('Error compiling talks.ts:', error);
    process.exit(1);
  }
}
