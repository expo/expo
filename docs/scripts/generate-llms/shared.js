import fs from 'node:fs';
import path from 'node:path';

export const OUTPUT_DIRECTORY_NAME = 'public';
export const BUILD_OUTPUT_DIR = 'out';

const CONTENT_SEPARATOR = '\n\n---\n\n';

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

    const content = fs.readFileSync(markdownPath, 'utf8').trim();
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

export function composeMarkdownDocument({ title, description, contentChunks }) {
  let fullContent = `# ${title}\n\n${description}\n\n`;

  for (const content of contentChunks) {
    fullContent += content + CONTENT_SEPARATOR;
  }

  return fullContent;
}
