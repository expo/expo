import frontmatter from 'front-matter';
import fs from 'node:fs';
import path from 'node:path';

export function readLocalFile(relativePath) {
  const resolved = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(resolved)) {
    return '';
  }
  return fs.readFileSync(resolved, 'utf-8');
}

export function readLocalMdx(relativePath) {
  const raw = readLocalFile(relativePath);
  if (!raw) return '';
  const { body } = frontmatter(raw);
  return body || '';
}

export function extractAttribute(source, attribute) {
  const pattern = new RegExp(
    `${attribute}\\s*=\\s*(?:("([^"]+)")|('([^']+)')|{\\s*['"]([^'"]+)['"]\\s*})`
  );
  const match = source.match(pattern);
  if (!match) return '';
  return (match[2] ?? match[4] ?? match[5] ?? '').trim();
}

export function resolveRelativePath(basePath, relativePath) {
  if (relativePath.startsWith('/')) return relativePath.replace(/^\//, '');
  const baseSegments = basePath.split('/');
  baseSegments.pop();
  for (const segment of relativePath.split('/')) {
    if (segment === '.' || segment === '') continue;
    if (segment === '..') baseSegments.pop();
    else baseSegments.push(segment);
  }
  return baseSegments.join('/');
}

export function parseImportSpec(importSpec) {
  const names = [];
  const parts = importSpec.split(',').map(p => p.trim());
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('{') && part.endsWith('}')) {
      const named = part.slice(1, -1).split(',').map(t => t.trim()).filter(Boolean);
      for (const token of named) {
        const [name] = token.split(' as ');
        if (name) names.push(name.trim());
      }
    } else if (part !== '*') {
      const [name] = part.split(' as ');
      if (name) names.push(name.trim());
    }
  }
  return names;
}

export function formatTerminalCommands(arrayLiteral) {
  const commands = Array.from(arrayLiteral.matchAll(/["']([^"']*)["']/g))
    .map(m => m[1].trim())
    .filter(Boolean);
  if (commands.length === 0) return '';
  return `\n\n\`\`\`bash\n${commands.join('\n')}\n\`\`\`\n\n`;
}

export function resolveInternalLinks(content) {
  return content.replace(/(?<=]\()(\/[^)]+)(?=\))/g, match => {
    if (match.startsWith('http')) return match;
    return `https://docs.expo.dev${match}`;
  });
}

export function resolveSchemaPath(importPath) {
  const cleaned = importPath.replace(/^~\/public/, 'public').replace(/^~\//, '');
  return path.join(process.cwd(), cleaned);
}
