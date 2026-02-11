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
import { home, learn, general } from '../../constants/navigation.js';

const OUTPUT_FILENAME_EXPO_DOCS = 'llms-full.txt';
const TITLE = 'Expo Documentation';
const DESCRIPTION =
  'Expo is an open-source React Native framework for apps that run natively on Android, iOS, and the web. Expo brings together the best of mobile and the web and enables many important features for building and scaling an app such as live updates, instantly sharing your app, and web support. The company behind Expo also offers Expo Application Services (EAS), which are deeply integrated cloud services for Expo and React Native apps.';

function generateFullMarkdown({ title, description }) {
  const buildDir = ensureBuildOutputDir();
  const allHrefs = uniqueInternalHrefs(collectPageHrefs([...home, ...learn, ...general]));
  const markdownPaths = allHrefs.map(href => getMarkdownPathFromHref(buildDir, href));
  const contentChunks = readUniqueMarkdownContent(markdownPaths, { warnOnMissing: true });

  return composeMarkdownDocument({ title, description, contentChunks });
}

export async function generateLlmsFullTxt() {
  try {
    await fs.promises.writeFile(
      path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, OUTPUT_FILENAME_EXPO_DOCS),
      generateFullMarkdown({
        title: TITLE,
        description: DESCRIPTION,
      })
    );

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME_EXPO_DOCS}`);
  } catch (error) {
    console.error('Error generating llms-full.txt:', error);
    throw error;
  }
}
