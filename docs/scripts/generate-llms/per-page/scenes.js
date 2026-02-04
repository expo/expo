import { PROJECT_STRUCTURE_SECTIONS, TEMPLATE_FEATURE_SECTIONS } from './constants.js';
import { readLocalFile, formatTerminalCommands } from './shared-utils.js';

function convertSimpleSceneMdx(relativePath) {
  const raw = readLocalFile(relativePath);
  if (!raw) return '';
  let content = raw.replace(/^import\s.+$\n?/gm, '');
  content = content.replace(/<RawH3[^>]*>([\S\s]*?)<\/RawH3>/g, (_m, text) => `### ${text.trim()}\n\n`);
  content = content.replace(/<Terminal[^>]*cmd={(\[[^]*?])}[^>]*\/>/g, (_m, arr) => formatTerminalCommands(arr));
  return content.split('\n').map(l => l.trimEnd()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function generateProjectStructureMarkdown() {
  return PROJECT_STRUCTURE_SECTIONS
    .map(p => convertSimpleSceneMdx(p))
    .filter(Boolean)
    .join('\n\n');
}

export function generateTemplateFeaturesMarkdown() {
  const sections = [];
  for (const entry of TEMPLATE_FEATURE_SECTIONS) {
    const markdown = convertSimpleSceneMdx(entry.file);
    if (!markdown) continue;
    const lines = [markdown.trim()];
    if (entry.href) {
      const href = entry.href.startsWith('http') ? entry.href : `https://docs.expo.dev${entry.href}`;
      lines.push(`Learn more: ${href}`);
    }
    sections.push(lines.join('\n\n'));
  }
  return sections.join('\n\n');
}
