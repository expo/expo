import fs from 'node:fs';
import path from 'node:path';
import { fetchSite } from 'sitefetch';

const OUTPUT_DIRECTORY_NAME = 'public';
const OUTPUT_FILENAME = 'llms-sdk.txt';
const TITLE = 'Expo SDK Documentation';
const DESCRIPTION =
  'Documentation for Expo SDK libraries, app configuration files, Expo CLI, create-expo-app, and more.';
const BASE_URL = 'https://docs.expo.dev';
const PATHS_TO_CRAWL = ['/versions/latest/', '/more/', '/technical-specs/'];

const processedContent = new Set();

function cleanContent(content) {
  return content
    .replace(/\[]\([^)]+\s+"[^"]+"\)/g, '')
    .replace(/^#\s+.+\n\n[^\n]+\n\n/m, '')
    .replace(/^(?:\*\s*){3}$/gm, '')
    .replace(/^(.+)\n-+\n/gm, '## $1\n')
    .replace(/\[]\(#[^)]+\)/g, '')
    .replace(/`-`\s+(`(?:npm|npx)\s+[^`]+`)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/(?:^(?: {4}|\t).*$\n?)+/gm, match => {
      const code = match.replace(/^(?: {4}|\t)/gm, '');
      return '```\n' + code.trim() + '\n```\n';
    })
    .replace(/•\s*/g, '')
    .replace(
      /Only for:\s*\n+\s*((?:Android[^]*?|iOS|Web)(?:\s*\n+\s*(?:Android[^]*?|iOS|Web))*)/g,
      (_, platforms) => 'Only for: ' + platforms.split(/\s*\n+\s*/).join(', ')
    )
    .replace(/â€ƒ/g, ' ');
}

async function processContent(content, url) {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : path.basename(url);
  const descriptionMatch = content.match(/^#\s+.+\n\n(.+)$/m);
  const description = descriptionMatch ? descriptionMatch[1] : '';

  let formattedContent = '';
  if (title) {
    formattedContent += `# ${title}\n\n`;
  }
  if (description) {
    formattedContent += `${description}\n\n`;
  }

  formattedContent += cleanContent(content);

  const normalizedContent = formattedContent.trim().toLowerCase();

  if (processedContent.has(normalizedContent)) {
    return null;
  }

  processedContent.add(normalizedContent);
  return formattedContent;
}

async function generateFullMarkdown() {
  let fullContent = `# ${TITLE}\n\n${DESCRIPTION}\n\n`;

  try {
    const fetchedContent = await fetchSite(BASE_URL, {
      match: PATHS_TO_CRAWL.map(path => `${path}**`),
      concurrency: 5,
      format: 'markdown',
    });

    const uniquePages = new Map();

    const sortedPages = Array.from(fetchedContent.entries())
      .filter(([url]) => url !== '/' && PATHS_TO_CRAWL.find(path => url.startsWith(path)))
      .sort(([urlA], [urlB]) => urlA.localeCompare(urlB));

    for (const [url, pageData] of sortedPages) {
      const normalizedUrl = url.replace(/\/+$/, '').split('?')[0];

      if (uniquePages.has(normalizedUrl)) {
        continue;
      }

      const processedContent = await processContent(pageData.content, url);
      if (processedContent) {
        uniquePages.set(normalizedUrl, processedContent);
        fullContent += processedContent + '\n\n---\n\n';
      }
    }

    return fullContent;
  } catch (error) {
    console.error('Error fetching or processing content:', error);
    throw error;
  }
}

export async function generateLlmsSdkTxt() {
  try {
    const content = await generateFullMarkdown();

    await fs.promises.mkdir(path.join(process.cwd(), OUTPUT_DIRECTORY_NAME), { recursive: true });

    const outputPath = path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, OUTPUT_FILENAME);
    await fs.promises.writeFile(outputPath, content);

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME}`);
  } catch (error) {
    console.error('Error generating SDK documentation:', error);
    process.exit(1);
  }
}
