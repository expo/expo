import fs from 'node:fs';
import path from 'node:path';

import {
  OUTPUT_DIRECTORY_NAME,
  OUTPUT_FILENAME_EXPO_DOCS,
  TITLE,
  DESCRIPTION,
  generateSectionMarkdown,
  processSection,
} from './utils.js';
import { home, learn, general } from '../../constants/navigation.js';

function generateFullMarkdown({ title, description, sections }) {
  return `# ${title}\n\n${description}\n\n` + sections.map(generateSectionMarkdown).join('');
}

export async function generateLlmsFullTxt() {
  try {
    const sections = [
      ...home.map(section => ({ ...processSection(section), category: 'Home' })),
      ...learn.map(section => ({ ...processSection(section), category: 'Learn' })),
      ...general.map(section => ({ ...processSection(section), category: 'General' })),
    ];

    await fs.promises.writeFile(
      path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, OUTPUT_FILENAME_EXPO_DOCS),
      generateFullMarkdown({
        title: TITLE,
        description: DESCRIPTION,
        sections,
      })
    );

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME_EXPO_DOCS}`);
  } catch (error) {
    console.error('Error generating llms-full.txt:', error);
    process.exit(1);
  }
}
