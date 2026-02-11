import fs from 'node:fs';
import path from 'node:path';

import {
  OUTPUT_DIRECTORY_NAME,
  collectPageHrefs,
  composeMarkdownDocument,
  ensureBuildOutputDir,
  getMarkdownPathFromHref,
  readUniqueMarkdownContent,
  uniqueInternalHrefs,
} from './shared.js';
import { eas } from '../../constants/navigation.js';

const OUTPUT_FILENAME_EAS_DOCS = 'llms-eas.txt';
const TITLE_EAS = 'Expo Application Services (EAS) Documentation';
const DESCRIPTION_EAS =
  'Expo Application Services (EAS) are deeply integrated cloud services for Expo and React Native apps, from the team behind Expo.';

function generateFullMarkdown({ title, description }) {
  const buildDir = ensureBuildOutputDir();
  const allHrefs = uniqueInternalHrefs(collectPageHrefs(eas));
  const markdownPaths = allHrefs.map(href => getMarkdownPathFromHref(buildDir, href));
  const contentChunks = readUniqueMarkdownContent(markdownPaths, { warnOnMissing: true });

  return composeMarkdownDocument({ title, description, contentChunks });
}

export async function generateLlmsEasTxt() {
  try {
    await fs.promises.writeFile(
      path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, OUTPUT_FILENAME_EAS_DOCS),
      generateFullMarkdown({
        title: TITLE_EAS,
        description: DESCRIPTION_EAS,
      })
    );

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME_EAS_DOCS}`);
  } catch (error) {
    console.error('Error generating llms-eas.txt:', error);
    throw error;
  }
}
