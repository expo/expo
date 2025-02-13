import fs from 'node:fs';
import path from 'node:path';

import {
  OUTPUT_DIRECTORY_NAME,
  OUTPUT_FILENAME_EAS_DOCS,
  TITLE_EAS,
  DESCRIPTION_EAS,
  generateSectionMarkdown,
  processSection,
} from './utils.js';
import { eas } from '../../constants/navigation.js';

function generateFullMarkdown({ title, description, sections }) {
  return `# ${title}\n\n${description}\n\n` + sections.map(generateSectionMarkdown).join('');
}

export async function generateLlmsEasTxt() {
  try {
    const sections = eas.map(section => ({ ...processSection(section), category: 'Eas' }));

    await fs.promises.writeFile(
      path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, OUTPUT_FILENAME_EAS_DOCS),
      generateFullMarkdown({
        title: TITLE_EAS,
        description: DESCRIPTION_EAS,
        sections,
      })
    );

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME_EAS_DOCS}`);
  } catch (error) {
    console.error('Error generating llms-eas.txt:', error);
    process.exit(1);
  }
}
