import frontmatter from 'front-matter';
import fs from 'node:fs';
import path from 'node:path';

import { cleanContent } from './utils.js';

const OUTPUT_DIRECTORY_NAME = 'public';
const OUTPUT_FILENAME = 'llms-sdk.txt';
const SDK_VERSION = 'latest';
const TITLE = 'Expo SDK Documentation';
const DESCRIPTION = 'Documentation for Expo SDK libraries, configuration, and API reference.';

async function processFile(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const { attributes, body } = frontmatter(content);

  let formattedContent = '';
  if (attributes.title) {
    formattedContent += `# ${attributes.title}\n\n`;
  }
  if (attributes.description) {
    formattedContent += `${attributes.description}\n\n`;
  }

  const cleanedContent = cleanContent(body);
  formattedContent += cleanedContent;

  return formattedContent;
}

async function generateFullMarkdown() {
  let fullContent = `# ${TITLE}\n\n${DESCRIPTION}\n\n`;

  const directories = [
    path.join(process.cwd(), 'pages/versions', SDK_VERSION, 'config'),
    path.join(process.cwd(), 'pages/versions', SDK_VERSION, 'sdk'),
  ];

  const indexPath = path.join(process.cwd(), 'pages/versions', SDK_VERSION, 'index.mdx');

  if (fs.existsSync(indexPath)) {
    const indexContent = await processFile(indexPath);
    fullContent += indexContent + '\n\n---\n\n';
  }

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.warn(`Directory does not exist: ${dir}`);
      continue;
    }

    const files = await fs.promises.readdir(dir);
    const mdxFiles = files.filter(file => file.endsWith('.mdx'));

    for (const file of mdxFiles) {
      const filePath = path.join(dir, file);
      const content = await processFile(filePath);
      fullContent += content + '\n\n---\n\n';
    }
  }

  return fullContent;
}

export async function generateLlmsSdkTxt() {
  try {
    console.log('Starting SDK documentation generation...');

    const content = await generateFullMarkdown();

    await fs.promises.writeFile(
      path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, OUTPUT_FILENAME),
      content
    );

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME}`);
    process.exit(0);
  } catch (error) {
    console.error('Error generating SDK documentation:', error);
    process.exit(1);
  }
}

generateLlmsSdkTxt();
