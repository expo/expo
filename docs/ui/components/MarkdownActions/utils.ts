const FRONTMATTER_PATTERN = /^---\n([\S\s]*?)\n---\n?/;
const IMPORT_STATEMENT_PATTERN = /^import\s.+$\n?/gm;
const BOX_LINK_PATTERN = /<BoxLink[\S\s]*?title="([^"]+)"[\S\s]*?href="([^"]+)"[\S\s]*?\/>/g;
const VIDEO_BOX_LINK_PATTERN = /<VideoBoxLink[\S\s]*?(?:\/>|>[\S\s]*?<\/VideoBoxLink>)/g;
const INTERNAL_LINK_PATTERN = /(?<=]\()(\/[^)]+)(?=\))/g;
const PRETTIER_IGNORE_PATTERN = /{\/\*\s*prettier-ignore\s*\*\/}/g;

const RAW_GITHUB_BASE_URL = 'https://raw.githubusercontent.com/expo/expo/main/docs/';

const DYNAMIC_DATA_PATHS = [
  /^\/additional-resources\/?$/,
  /^\/eas\/json\/?$/,
  /^\/versions\/(?:latest|unversioned|v\d+\.\d+\.\d+)\/config\/app\/?$/,
];

const PLATFORM_AND_DEVICE_MARKDOWN = `## Where would you like to develop?\n\nYou can work on any of the following targets during development:\n\n- **Android device** — run the app on hardware so you see exactly what your users see.\n- **iOS device** — test on Apple hardware for the most accurate experience.\n- **Android Emulator** — use a virtual Android device when you do not have physical hardware.\n- **iOS Simulator** — run the iOS Simulator on macOS to test without a device.`;

const DEVELOPMENT_MODE_MARKDOWN = `## How would you like to develop?\n\n- **Expo Go** — a sandbox app from Expo for trying things out quickly without custom native modules.\n- **Development build** — your own app binary that includes Expo developer tools and supports custom native modules, intended for longer-term projects.`;

const BUILD_ENVIRONMENT_TEXT =
  '**Build with Expo Application Services (EAS)**\n\nEAS compiles your app in the cloud and produces a build that you can install on your device. Alternatively, you can compile your app on your own computer.';

const ENVIRONMENT_INSTRUCTION_SECTIONS = [
  {
    heading: 'Android device — Expo Go',
    path: 'scenes/get-started/set-up-your-environment/instructions/androidPhysicalExpoGo.mdx',
  },
  {
    heading: 'Android device — Development build (EAS)',
    path: 'scenes/get-started/set-up-your-environment/instructions/androidPhysicalDevelopmentBuild.mdx',
  },
  {
    heading: 'Android device — Development build (local)',
    path: 'scenes/get-started/set-up-your-environment/instructions/androidPhysicalDevelopmentBuildLocal.mdx',
  },
  {
    heading: 'Android Emulator — Expo Go',
    path: 'scenes/get-started/set-up-your-environment/instructions/androidSimulatedExpoGo.mdx',
  },
  {
    heading: 'Android Emulator — Development build (EAS)',
    path: 'scenes/get-started/set-up-your-environment/instructions/androidSimulatedDevelopmentBuild.mdx',
  },
  {
    heading: 'Android Emulator — Development build (local)',
    path: 'scenes/get-started/set-up-your-environment/instructions/androidSimulatedDevelopmentBuildLocal.mdx',
  },
  {
    heading: 'iOS device — Expo Go',
    path: 'scenes/get-started/set-up-your-environment/instructions/iosPhysicalExpoGo.mdx',
  },
  {
    heading: 'iOS device — Development build (EAS)',
    path: 'scenes/get-started/set-up-your-environment/instructions/iosPhysicalDevelopmentBuild.mdx',
  },
  {
    heading: 'iOS device — Development build (local)',
    path: 'scenes/get-started/set-up-your-environment/instructions/iosPhysicalDevelopmentBuildLocal.mdx',
  },
  {
    heading: 'iOS Simulator — Expo Go',
    path: 'scenes/get-started/set-up-your-environment/instructions/iosSimulatedExpoGo.mdx',
  },
  {
    heading: 'iOS Simulator — Development build (EAS)',
    path: 'scenes/get-started/set-up-your-environment/instructions/iosSimulatedDevelopmentBuild.mdx',
  },
  {
    heading: 'iOS Simulator — Development build (local)',
    path: 'scenes/get-started/set-up-your-environment/instructions/iosSimulatedDevelopmentBuildLocal.mdx',
  },
];

export function normalizePath(path?: string) {
  if (!path) {
    return '';
  }

  const [cleanPath] = path.split('?');
  return cleanPath.replace(/\/+$/, '') || '/';
}

export function hasDynamicData(path?: string) {
  const normalized = normalizePath(path);
  return normalized ? DYNAMIC_DATA_PATHS.some(pattern => pattern.test(normalized)) : false;
}

export function shouldShowMarkdownActions({
  packageName,
  path,
}: {
  packageName?: string;
  path?: string;
}) {
  if (packageName) {
    return false;
  }

  return !hasDynamicData(path);
}

export async function prepareMarkdownForCopyAsync(rawContent: string) {
  if (!rawContent) {
    return '';
  }

  let content = rawContent;
  let title = '';
  let description = '';

  const frontmatterMatch = content.match(FRONTMATTER_PATTERN);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    frontmatter.forEach(line => {
      const [rawKey, ...rawValueParts] = line.split(':');
      if (!rawKey || rawValueParts.length === 0) {
        return;
      }
      const key = rawKey.trim();
      const value = rawValueParts
        .join(':')
        .trim()
        .replace(/^["']|["']$/g, '');

      if (key === 'title') {
        title = value;
      }
      if (key === 'description') {
        description = value;
      }
    });

    content = content.slice(frontmatterMatch[0].length);
  }

  content = content.replace(IMPORT_STATEMENT_PATTERN, '');

  if (content.includes('<PlatformAndDeviceForm')) {
    content = content.replace(
      /<PlatformAndDeviceForm\s*\/>/,
      `\n${PLATFORM_AND_DEVICE_MARKDOWN}\n`
    );
  }

  if (content.includes('<DevelopmentModeForm')) {
    content = content.replace(/<DevelopmentModeForm\s*\/>/, `\n${DEVELOPMENT_MODE_MARKDOWN}\n`);
  }

  if (content.includes('<DevelopmentEnvironmentInstructions')) {
    const instructions = await generateEnvironmentInstructionsMarkdownAsync();
    content = content.replace(/<DevelopmentEnvironmentInstructions\s*\/>/, `\n${instructions}\n`);
  }

  content = content.replace(BOX_LINK_PATTERN, (_match, linkTitle, href) => {
    const normalizedHref = href.startsWith('http') ? href : `https://docs.expo.dev${href}`;
    const markdownLink = `[${linkTitle}](${normalizedHref})`;
    return `\n${markdownLink}\n`;
  });

  content = content.replace(VIDEO_BOX_LINK_PATTERN, match => {
    const titleMatch = match.match(/title="([^"]+)"/);
    const videoIdMatch = match.match(/videoId="([^"]+)"/);

    if (!videoIdMatch) {
      return '';
    }

    const linkTitle = titleMatch ? titleMatch[1] : 'Watch video';
    const href = `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
    const markdownLink = `[${linkTitle}](${href})`;
    return `\n${markdownLink}\n`;
  });

  content = content.replace(INTERNAL_LINK_PATTERN, match => {
    if (match.startsWith('http')) {
      return match;
    }
    return `https://docs.expo.dev${match}`;
  });

  content = content.replace(PRETTIER_IGNORE_PATTERN, '');

  const cleaned = content
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const parts = [] as string[];
  if (title) {
    parts.push(`# ${title}`);
  }
  if (description) {
    parts.push(`_${description}_`);
  }
  if (cleaned) {
    parts.push(cleaned);
  }

  return parts.join('\n\n');
}

async function generateEnvironmentInstructionsMarkdownAsync() {
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
      return `![${altText}](${url})`;
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

function formatTerminalCommands(arrayLiteral: string) {
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
