import {
  BUILD_ENVIRONMENT_TEXT,
  ENVIRONMENT_INSTRUCTION_SECTIONS,
  RAW_GITHUB_BASE_URL,
} from './constants';

const IMPORT_STATEMENT_PATTERN = /^import\s.+$\n?/gm;
const PRETTIER_IGNORE_PATTERN = /{\/\*\s*prettier-ignore\s*\*\/}/g;

export async function generateEnvironmentInstructionsMarkdownAsync() {
  const sections: string[] = [];

  for (const section of ENVIRONMENT_INSTRUCTION_SECTIONS) {
    try {
      const markdown = await convertInstructionFileToMarkdownAsync(section.path);
      if (markdown) {
        sections.push(`## ${section.heading}\n\n${markdown.trim()}`);
      }
    } catch (error) {
      console.error('Unable to process instructions for', section.path, error);
    }
  }

  return sections.join('\n\n');
}

async function convertInstructionFileToMarkdownAsync(
  relativePath: string,
  visited = new Set<string>()
) {
  if (visited.has(relativePath)) {
    return '';
  }
  visited.add(relativePath);

  const raw = await fetchRawDocFileAsync(relativePath);
  if (!raw) {
    return '';
  }

  let content = raw;
  const importPattern = /^import\s+(.+?)\s+from\s+["']([^"']+)["'];?$/gm;
  const childImports: { name: string; path: string }[] = [];

  content = content.replace(importPattern, (_full, importSpec, source) => {
    if (!source.endsWith('.mdx')) {
      return '';
    }

    const resolvedPath = resolveRelativePath(relativePath, source);
    const names = parseImportSpec(importSpec as string);
    names.forEach(name => {
      childImports.push({ name, path: resolvedPath });
    });
    return '';
  });

  for (const { name, path } of childImports) {
    const childMarkdown = await convertInstructionFileToMarkdownAsync(path, visited);
    const replacement = childMarkdown ? `\n${childMarkdown.trim()}\n` : '';
    const selfClosing = new RegExp(`<${name}[^>]*/>`, 'g');
    const block = new RegExp(`<${name}[^>]*>[^]*?</${name}>`, 'g');
    content = content.replace(selfClosing, replacement);
    content = content.replace(block, replacement);
  }

  content = content.replace(IMPORT_STATEMENT_PATTERN, '');

  content = content.replace(/<BuildEnvironmentSwitch\s*\/>/g, `${BUILD_ENVIRONMENT_TEXT}\n\n`);

  content = content.replace(/<Tabs[^>]*>/g, '');
  content = content.replace(/<\/Tabs>/g, '');
  content = content.replace(
    /<Tab\s+label=["']([^"']+)["'][^>]*>/g,
    (_match, label) => `#### ${label}\n\n`
  );
  content = content.replace(/<\/Tab>/g, '\n');

  content = content.replace(
    /<Step\s+label=["']([^"']+)["'][^>]*>/g,
    (_match, label) => `### Step ${label}\n\n`
  );
  content = content.replace(/<\/Step>/g, '\n');

  content = content.replace(/<Terminal[^>]*cmd={(\[[^]*?])}[^>]*\/>/g, (_match, arrayLiteral) =>
    formatTerminalCommands(arrayLiteral as string)
  );

  content = content.replace(
    /<ContentSpotlight[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*\/>/g,
    (_match, alt, src) => {
      const url = src.startsWith('http') ? src : `https://docs.expo.dev${src}`;
      const altText = alt ?? 'Screenshot';
      return `[${altText}](${url})`;
    }
  );

  content = content.replace(
    /<Collapsible[^>]*summary=["']([^"']+)["'][^>]*>/g,
    (_match, summary) => `**${summary}**\n\n`
  );
  content = content.replace(/<\/Collapsible>/g, '\n');

  content = content.replace(
    /<div[^>]*>\s*<QRCodeReact[^>]*value="([^"]+)"[^>]*\/>\s*<\/div>/g,
    (_m, url) => `\nUse this link: ${url}\n`
  );
  content = content.replace(
    /<QRCodeReact[^>]*value="([^"]+)"[^>]*\/>/g,
    (_m, url) => `Use this link: ${url}`
  );

  content = content.replace(/<br\s*\/>/g, '\n');
  content = content.replace(/&gt;/g, '>');
  content = content.replace(PRETTIER_IGNORE_PATTERN, '');

  content = content
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return content;
}

async function fetchRawDocFileAsync(relativePath: string) {
  try {
    const response = await fetch(`${RAW_GITHUB_BASE_URL}${relativePath}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${relativePath}: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Unable to fetch raw file for', relativePath, error);
    return '';
  }
}

function resolveRelativePath(basePath: string, relativePath: string) {
  if (relativePath.startsWith('/')) {
    return relativePath.replace(/^\//, '');
  }

  const baseSegments = basePath.split('/');
  baseSegments.pop();
  const relativeSegments = relativePath.split('/');

  for (const segment of relativeSegments) {
    if (segment === '.' || segment === '') {
      continue;
    }
    if (segment === '..') {
      baseSegments.pop();
    } else {
      baseSegments.push(segment);
    }
  }

  return baseSegments.join('/');
}

function parseImportSpec(importSpec: string) {
  const names: string[] = [];
  const defaultAndNamed = importSpec.split(',').map(part => part.trim());

  defaultAndNamed.forEach(part => {
    if (!part) {
      return;
    }

    if (part.startsWith('{') && part.endsWith('}')) {
      const named = part
        .slice(1, -1)
        .split(',')
        .map(token => token.trim())
        .filter(Boolean);
      named.forEach(token => {
        const [name] = token.split(' as ');
        if (name) {
          names.push(name.trim());
        }
      });
    } else if (part !== '*') {
      const [name] = part.split(' as ');
      if (name) {
        names.push(name.trim());
      }
    }
  });

  return names;
}

export function formatTerminalCommands(arrayLiteral: string) {
  const commands = Array.from(arrayLiteral.matchAll(/["']([^"']*)["']/g))
    .map(match => match[1])
    .map(command => command.trim())
    .filter(Boolean);

  if (commands.length === 0) {
    return '';
  }

  const formatted = commands.join('\n');

  return `\n\n\`\`\`bash\n${formatted}\n\`\`\`\n\n`;
}
