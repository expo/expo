import fs from 'node:fs';
import path from 'node:path';

import { buildAgentInstructions } from '../agent-instructions.ts';

export const OUTPUT_DIRECTORY_NAME = 'public';
export const BUILD_OUTPUT_DIR = 'out';
export const DOCS_BASE_URL = 'https://docs.expo.dev';

const LLMS_FILES = [
  { filename: 'llms.txt', description: 'A list of all available documentation files' },
  {
    filename: 'llms-full.txt',
    description:
      'Complete documentation for Expo, including Expo Router, Expo Modules API, development process, and more',
  },
  {
    filename: 'llms-eas.txt',
    description: 'Complete documentation for Expo Application Services (EAS)',
  },
  {
    filename: 'llms-sdk.txt',
    description: 'Complete documentation for the latest Expo SDK',
  },
  {
    filename: 'llms-sdk-v54.0.0.txt',
    description: 'Complete documentation for Expo SDK 54',
  },
  {
    filename: 'llms-sdk-v53.0.0.txt',
    description: 'Complete documentation for Expo SDK 53',
  },
  {
    filename: 'llms-sdk-v52.0.0.txt',
    description: 'Complete documentation for Expo SDK 52',
  },
  {
    filename: 'llms-sdk-v51.0.0.txt',
    description: 'Complete documentation for Expo SDK 51',
  },
];

const CONTENT_SEPARATOR = '\n\n---\n\n';

const AGENT_INSTRUCTIONS_BLOCK_REGEX = /<AgentInstructions>[\S\s]*?<\/AgentInstructions>\n*/g;

const DOC_INDEX_BLOCKQUOTE =
  '> For the complete documentation index, see [llms.txt](/llms.txt). Use this Use this file to discover all available pages.';

export function stripAgentInstructions(content) {
  return content.replace(AGENT_INSTRUCTIONS_BLOCK_REGEX, '');
}

export function stripDocIndexBlockquote(content) {
  return content.replaceAll(DOC_INDEX_BLOCKQUOTE + '\n\n', '');
}

export function toBlockquote(text) {
  return text
    .split('\n')
    .map(line => (line.length > 0 ? `> ${line}` : '>'))
    .join('\n');
}

export function ensureBuildOutputDir(buildOutputDirName = BUILD_OUTPUT_DIR) {
  const buildDir = path.join(process.cwd(), buildOutputDirName);
  if (!fs.existsSync(buildDir)) {
    throw new Error(`Build output directory not found: ${buildDir}. Run "next build" first.`);
  }
  return buildDir;
}

export function collectPageHrefs(nodes, hrefs = []) {
  for (const node of nodes) {
    if (!node) {
      continue;
    }

    if (node.type === 'page' && typeof node.href === 'string') {
      hrefs.push(node.href);
      continue;
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      collectPageHrefs(node.children, hrefs);
    }
  }

  return hrefs;
}

export function uniqueInternalHrefs(hrefs) {
  const seenHrefs = new Set();
  const uniqueHrefs = [];

  for (const href of hrefs) {
    if (!href || href.startsWith('http') || seenHrefs.has(href)) {
      continue;
    }

    seenHrefs.add(href);
    uniqueHrefs.push(href);
  }

  return uniqueHrefs;
}

export function getMarkdownPathFromHref(buildDir, href) {
  if (href === '/') {
    return path.join(buildDir, 'index.md');
  }

  const normalizedHref = href.replace(/^\/+|\/+$/g, '');
  return path.join(buildDir, normalizedHref, 'index.md');
}

export function findMarkdownFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (entry.name === 'index.md') {
      results.push(fullPath);
    }
  }
  return results;
}

export function readUniqueMarkdownContent(markdownPaths, { warnOnMissing = false } = {}) {
  const seenContent = new Set();
  const contentChunks = [];

  for (const markdownPath of markdownPaths) {
    if (!fs.existsSync(markdownPath)) {
      if (warnOnMissing) {
        console.warn(`Markdown file does not exist: ${markdownPath}`);
      }
      continue;
    }

    const rawContent = fs.readFileSync(markdownPath, 'utf8').trim();
    if (!rawContent) {
      continue;
    }

    const content = stripDocIndexBlockquote(stripAgentInstructions(rawContent)).trim();
    if (!content) {
      continue;
    }

    const normalizedContent = content.toLowerCase();
    if (seenContent.has(normalizedContent)) {
      continue;
    }

    seenContent.add(normalizedContent);
    contentChunks.push(content);
  }

  return contentChunks;
}

export function generateCrossLinksSection(currentFilename) {
  const otherFiles = LLMS_FILES.filter(f => f.filename !== currentFilename);
  let section = '## Other Expo documentation files\n\n';

  for (const file of otherFiles) {
    section += `- [/${file.filename}](${DOCS_BASE_URL}/${file.filename}): ${file.description}\n`;
  }

  return section;
}

export function composeMarkdownDocument({ title, description, contentChunks, currentFilename }) {
  let fullContent = `# ${title}\n\n${toBlockquote(description)}\n`;
  fullContent += DOC_INDEX_BLOCKQUOTE + '\n\n';
  fullContent += buildAgentInstructions('<page-url>') + '\n';

  for (const content of contentChunks) {
    fullContent += content + CONTENT_SEPARATOR;
  }

  if (currentFilename) {
    fullContent += generateCrossLinksSection(currentFilename);
  }

  return fullContent;
}
