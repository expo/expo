import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function compileTalksFile() {
  try {
    const projectRoot = path.resolve(__dirname, '../..');
    const inputFile = path.join(projectRoot, 'public/static/talks.ts');
    const outputDir = path.join(projectRoot, 'scripts/generate-llms');

    const tempTsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ES2020',
        moduleResolution: 'node',
        esModuleInterop: true,
        skipLibCheck: true,
        jsx: 'react',
        allowJs: true,
        outDir: outputDir,
        declaration: false,
        noEmit: false,
        isolatedModules: true,
      },
      include: [inputFile],
      exclude: ['node_modules'],
    };

    const tempTsConfigPath = path.join(outputDir, 'temp-tsconfig.json');
    fs.writeFileSync(tempTsConfigPath, JSON.stringify(tempTsConfig, null, 2));

    execSync(`npx tsc --project ${tempTsConfigPath}`, {
      stdio: 'inherit',
    });

    fs.unlinkSync(tempTsConfigPath);

    const outputFile = path.join(outputDir, 'talks.js');
    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully compiled talks.ts to $talks.js`);
    return outputFile;
  } catch (error) {
    console.error('Error compiling talks.ts:', error);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  compileTalksFile();
}
