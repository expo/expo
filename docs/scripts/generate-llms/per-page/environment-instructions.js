import frontmatter from 'front-matter';

import { BUILD_ENVIRONMENT_TEXT, ENVIRONMENT_INSTRUCTION_SECTIONS } from './constants.js';
import {
  readLocalFile,
  resolveRelativePath,
  parseImportSpec,
  formatTerminalCommands,
} from './shared-utils.js';

function cleanInstructionContent(content, basePath) {
  let result = content;

  // Resolve child MDX imports and inline them
  const importPattern = /^import\s+(.+?)\s+from\s+["']([^"']+)["'];?$/gm;
  const childImports = [];

  result = result.replace(importPattern, (_full, importSpec, source) => {
    if (!source.endsWith('.mdx')) return '';
    const resolvedPath = resolveRelativePath(basePath, source);
    const names = parseImportSpec(importSpec);
    names.forEach(name => childImports.push({ name, path: resolvedPath }));
    return '';
  });

  for (const { name, path: childPath } of childImports) {
    const childRaw = readLocalFile(childPath);
    if (!childRaw) continue;
    const { body } = frontmatter(childRaw);
    const childMarkdown = body ? cleanInstructionContent(body, childPath) : '';
    const replacement = childMarkdown ? `\n${childMarkdown.trim()}\n` : '';
    result = result.replace(new RegExp(`<${name}[^>]*/>`, 'g'), replacement);
    result = result.replace(new RegExp(`<${name}[^>]*>[^]*?</${name}>`, 'g'), replacement);
  }

  // Remove remaining imports
  result = result.replace(/^import\s.+$\n?/gm, '');

  // BuildEnvironmentSwitch
  result = result.replace(/<BuildEnvironmentSwitch\s*\/>/g, `${BUILD_ENVIRONMENT_TEXT}\n\n`);

  // Layout components
  result = result.replace(/<Tabs[^>]*>/g, '');
  result = result.replace(/<\/Tabs>/g, '');
  result = result.replace(/<Tab\s+label=["']([^"']+)["'][^>]*>/g, (_m, label) => `#### ${label}\n\n`);
  result = result.replace(/<\/Tab>/g, '\n');
  result = result.replace(/<Step\s+label=["']([^"']+)["'][^>]*>/g, (_m, label) => `### Step ${label}\n\n`);
  result = result.replace(/<\/Step>/g, '\n');

  // Terminal
  result = result.replace(/<Terminal[^>]*cmd={(\[[^]*?])}[^>]*\/>/g, (_m, arr) => formatTerminalCommands(arr));

  // ContentSpotlight
  result = result.replace(
    /<ContentSpotlight[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*\/>/g,
    (_m, alt, src) => {
      const url = src.startsWith('http') ? src : `https://docs.expo.dev${src}`;
      return `[${alt || 'Screenshot'}](${url})`;
    }
  );

  // Collapsible
  result = result.replace(/<Collapsible[^>]*summary=["']([^"']+)["'][^>]*>/g, (_m, s) => `**${s}**\n\n`);
  result = result.replace(/<\/Collapsible>/g, '\n');

  // QRCode
  result = result.replace(/<div[^>]*>\s*<QRCodeReact[^>]*value="([^"]+)"[^>]*\/>\s*<\/div>/g, (_m, url) => `\nUse this link: ${url}\n`);
  result = result.replace(/<QRCodeReact[^>]*value="([^"]+)"[^>]*\/>/g, (_m, url) => `Use this link: ${url}`);

  // Misc
  result = result.replace(/<br\s*\/>/g, '\n');
  result = result.replace(/&gt;/g, '>');
  result = result.replace(/{\/\*\s*prettier-ignore\s*\*\/}/g, '');

  return result.split('\n').map(l => l.trimEnd()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function generateEnvironmentInstructionsMarkdown() {
  const sections = [];
  for (const section of ENVIRONMENT_INSTRUCTION_SECTIONS) {
    const raw = readLocalFile(section.path);
    if (!raw) continue;
    const { body } = frontmatter(raw);
    if (!body) continue;
    const markdown = cleanInstructionContent(body, section.path);
    if (markdown) {
      sections.push(`## ${section.heading}\n\n${markdown.trim()}`);
    }
  }
  return sections.join('\n\n');
}
