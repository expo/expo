import fs from 'node:fs';
import path from 'node:path';

import {
  OUTPUT_DIRECTORY_NAME,
  OUTPUT_FILENAME_LLMS_TXT,
  TITLE,
  DESCRIPTION,
  processSection,
} from './utils.js';
import { home, learn, general, eas, reference } from '../../constants/navigation.js';

function generateItemMarkdown(item) {
  return `- [${item.title}](${item.url})${item.description ? `: ${item.description}` : ''}\n`;
}

function generateSectionMarkdown(section) {
  let content = section.title ? `## ${section.title}\n\n` : '';

  content += section.items.map(generateItemMarkdown).join('');

  section.groups.forEach(group => {
    if (group.items.length) {
      content += `\n### ${group.title}\n`;
      content += group.items.map(generateItemMarkdown).join('');
    }
  });

  section.sections.forEach(subSection => {
    if (subSection.title) {
      content += `\n### ${subSection.title}\n`;
    }
    content += subSection.items.map(generateItemMarkdown).join('');
  });

  return content + '\n';
}

function generateFullMarkdown({ title, description, sections }) {
  const filteredSections = sections.filter(section => {
    if (
      section.title === 'React Native' &&
      !section.items.length &&
      !section.groups.length &&
      !section.sections.length
    ) {
      return false;
    }
    return true;
  });

  return (
    `# ${title}\n\n${description}\n\n` + filteredSections.map(generateSectionMarkdown).join('')
  );
}

export async function generateLlmsTxt() {
  try {
    const sections = Object.values({ home, general, learn, eas, reference: reference.latest })
      .flat()
      .map(processSection)
      .filter(Boolean);

    await fs.promises.writeFile(
      path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, OUTPUT_FILENAME_LLMS_TXT),
      generateFullMarkdown({
        title: TITLE,
        description: DESCRIPTION,
        sections,
      })
    );

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME_LLMS_TXT}`);
    process.exit(0);
  } catch (error) {
    console.error('Error generating llms.txt:', error);
    process.exit(1);
  }
}
