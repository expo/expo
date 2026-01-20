import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  OUTPUT_DIRECTORY_NAME,
  OUTPUT_FILENAME_EAS_DOCS,
  TITLE_EAS,
  DESCRIPTION_EAS,
  generateSectionMarkdown,
  processSection,
} from './utils.js';
import { eas } from '../../constants/navigation.js';

const __filename = fileURLToPath(import.meta.url);
const require = createRequire(__filename);
const easCliData = require('../../ui/components/EASCLIReference/data/eas-cli-commands.json');

function generateFullMarkdown({ title, description, sections }) {
  return `# ${title}\n\n${description}\n\n` + sections.map(generateSectionMarkdown).join('');
}

function formatEasCliDescription(description) {
  if (!description) {
    return '';
  }
  const normalized = description.trim();
  if (!normalized) {
    return '';
  }
  const prefixed = /^[A-Z]/.test(normalized)
    ? normalized
    : normalized[0].toUpperCase() + normalized.slice(1);
  return prefixed.endsWith('.') ? prefixed : `${prefixed}.`;
}

function generateEasCliCommandsMarkdown(data) {
  if (!data?.commands?.length) {
    return '';
  }

  const cliVersion = data?.source?.cliVersion;
  const header = cliVersion ? `# EAS CLI commands (v${cliVersion})` : '# EAS CLI commands';

  const commands = data.commands
    .map(command => {
      const description = formatEasCliDescription(command.description);
      const usage = command.usage?.trim();

      let content = `## ${command.command}\n\n`;
      if (description) {
        content += `${description}\n\n`;
      }
      if (usage) {
        content += '```\n' + usage + '\n```\n\n';
      }
      return content;
    })
    .join('');

  return `${header}\n\n${commands}`.trimEnd();
}

export async function generateLlmsEasTxt() {
  try {
    const sections = eas.map(section => ({ ...processSection(section), category: 'Eas' }));

    const easCliMarkdown = generateEasCliCommandsMarkdown(easCliData);
    const baseContent = generateFullMarkdown({
      title: TITLE_EAS,
      description: DESCRIPTION_EAS,
      sections,
    });

    const placeholderRegex = /<EASCLIReference\s*\/>/g;
    let finalContent = easCliMarkdown
      ? baseContent.replace(placeholderRegex, `\n${easCliMarkdown}\n`)
      : baseContent.replace(placeholderRegex, '');

    if (easCliMarkdown && finalContent === baseContent) {
      finalContent = `${baseContent.replace(placeholderRegex, '')}\n\n${easCliMarkdown}`;
    }

    await fs.promises.writeFile(
      path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, OUTPUT_FILENAME_EAS_DOCS),
      finalContent
    );

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME_EAS_DOCS}`);
  } catch (error) {
    console.error('Error generating llms-eas.txt:', error);
    process.exit(1);
  }
}
