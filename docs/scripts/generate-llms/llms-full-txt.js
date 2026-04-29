import fs from 'node:fs';
import path from 'node:path';

import { home, learn, general } from '../../constants/navigation.js';
import {
  OUTPUT_DIRECTORY_NAME,
  collectPageHrefs,
  composeMarkdownDocument,
  ensureBuildOutputDir,
  getMarkdownPathFromHref,
  readUniqueMarkdownContent,
  uniqueInternalHrefs,
} from './shared.js';
import { EXPO_DESCRIPTION } from './transforms/descriptions.js';

const OUTPUT_FILENAME_EXPO_DOCS = 'llms-full.txt';
const TITLE = 'Expo Documentation';

function generateFullMarkdown({ title, description }) {
  const buildDir = ensureBuildOutputDir();
  const allHrefs = uniqueInternalHrefs(collectPageHrefs([...home, ...learn, ...general]));
  const markdownPaths = allHrefs.map(href => getMarkdownPathFromHref(buildDir, href));
  const contentChunks = readUniqueMarkdownContent(markdownPaths, { warnOnMissing: true });

  return composeMarkdownDocument({
    title,
    description,
    contentChunks,
    currentFilename: OUTPUT_FILENAME_EXPO_DOCS,
  });
}

export async function generateLlmsFullTxt() {
  try {
    await fs.promises.writeFile(
      path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, OUTPUT_FILENAME_EXPO_DOCS),
      generateFullMarkdown({
        title: TITLE,
        description: EXPO_DESCRIPTION,
      })
    );

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME_EXPO_DOCS}`);
  } catch (error) {
    console.error('Error generating llms-full.txt:', error);
    throw error;
  }
}
