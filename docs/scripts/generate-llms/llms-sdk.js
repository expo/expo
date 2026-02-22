import fs from 'node:fs';
import path from 'node:path';

import {
  OUTPUT_DIRECTORY_NAME,
  composeMarkdownDocument,
  ensureBuildOutputDir,
  findMarkdownFiles,
  readUniqueMarkdownContent,
} from './shared.js';

const OUTPUT_FILENAME = 'llms-sdk.txt';
const TITLE = 'Expo SDK Documentation';
const DESCRIPTION =
  'Documentation for Expo SDK libraries, app configuration files, Expo CLI, create-expo-app, and more.';
const PATHS_TO_INCLUDE = ['versions/latest/', 'more/', 'technical-specs/'];

function generateFullMarkdown() {
  const buildDir = ensureBuildOutputDir();
  const allFiles = findMarkdownFiles(buildDir);

  const matchingFiles = allFiles
    .filter(filePath => {
      const relativePath = path.relative(buildDir, filePath).replace(/\\/g, '/');
      return PATHS_TO_INCLUDE.some(prefix => relativePath.startsWith(prefix));
    })
    .sort((a, b) => {
      const relA = path.relative(buildDir, a);
      const relB = path.relative(buildDir, b);
      return relA.localeCompare(relB);
    });
  const contentChunks = readUniqueMarkdownContent(matchingFiles);

  return composeMarkdownDocument({ title: TITLE, description: DESCRIPTION, contentChunks });
}

export async function generateLlmsSdkTxt() {
  try {
    const content = generateFullMarkdown();

    await fs.promises.mkdir(path.join(process.cwd(), OUTPUT_DIRECTORY_NAME), { recursive: true });

    const outputPath = path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, OUTPUT_FILENAME);
    await fs.promises.writeFile(outputPath, content);

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME}`);
  } catch (error) {
    console.error('Error generating SDK documentation:', error);
    throw error;
  }
}
