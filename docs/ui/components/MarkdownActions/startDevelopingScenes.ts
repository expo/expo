import { RAW_GITHUB_BASE_URL } from './constants';
import { formatTerminalCommands } from './environmentInstructions';

const IMPORT_STATEMENT_PATTERN = /^import\s.+$\n?/gm;

const PROJECT_STRUCTURE_SECTIONS = [
  { path: 'scenes/get-started/start-developing/ProjectStructure/files/app.mdx' },
  { path: 'scenes/get-started/start-developing/ProjectStructure/files/assets.mdx' },
  { path: 'scenes/get-started/start-developing/ProjectStructure/files/components.mdx' },
  { path: 'scenes/get-started/start-developing/ProjectStructure/files/constants.mdx' },
  { path: 'scenes/get-started/start-developing/ProjectStructure/files/hooks.mdx' },
  { path: 'scenes/get-started/start-developing/ProjectStructure/files/scripts.mdx' },
  { path: 'scenes/get-started/start-developing/ProjectStructure/files/app-json.mdx' },
  { path: 'scenes/get-started/start-developing/ProjectStructure/files/package-json.mdx' },
  { path: 'scenes/get-started/start-developing/ProjectStructure/files/tsconfig-json.mdx' },
];

const TEMPLATE_FEATURE_SECTIONS = [
  {
    file: 'scenes/get-started/start-developing/TemplateFeatures/features/navigation.mdx',
    imageAlt: 'Two tabs in an Expo app',
    imageSrc: '/static/images/get-started/navigation.png',
    href: '/router/introduction',
  },
  {
    file: 'scenes/get-started/start-developing/TemplateFeatures/features/platforms.mdx',
    imageAlt: 'Android, iOS, and web logos',
    imageSrc: '/static/images/get-started/platforms.png',
  },
  {
    file: 'scenes/get-started/start-developing/TemplateFeatures/features/images.mdx',
    imageAlt: 'React image in a header component',
    imageSrc: '/static/images/get-started/images.png',
    href: '/versions/latest/sdk/image',
  },
  {
    file: 'scenes/get-started/start-developing/TemplateFeatures/features/themes.mdx',
    imageAlt: 'An app with light and dark mode UIs',
    imageSrc: '/static/images/get-started/themes.png',
    href: '/develop/user-interface/color-themes',
  },
  {
    file: 'scenes/get-started/start-developing/TemplateFeatures/features/animations.mdx',
    imageAlt: 'Waving hand and a welcome message',
    imageSrc: '/static/images/get-started/animations.png',
    href: '/develop/user-interface/animation',
  },
];

export async function generateProjectStructureMarkdownAsync() {
  const sections: string[] = [];

  for (const { path } of PROJECT_STRUCTURE_SECTIONS) {
    const markdown = await convertSimpleSceneMdxToMarkdownAsync(path);
    if (markdown) {
      sections.push(markdown.trim());
    }
  }

  return sections.join('\n\n');
}

export async function generateTemplateFeaturesMarkdownAsync() {
  const sections: string[] = [];

  for (const entry of TEMPLATE_FEATURE_SECTIONS) {
    const markdown = await convertSimpleSceneMdxToMarkdownAsync(entry.file);
    if (!markdown) {
      continue;
    }

    const lines: string[] = [markdown.trim()];

    if (entry.imageSrc) {
      const url = entry.imageSrc.startsWith('http')
        ? entry.imageSrc
        : `https://docs.expo.dev${entry.imageSrc}`;
      const alt = entry.imageAlt || 'Screenshot';
      lines.push(`[${alt}](${url})`);
    }

    if (entry.href) {
      const href = entry.href.startsWith('http')
        ? entry.href
        : `https://docs.expo.dev${entry.href}`;
      lines.push(`Learn more: ${href}`);
    }

    sections.push(lines.join('\n\n'));
  }

  return sections.join('\n\n');
}

async function convertSimpleSceneMdxToMarkdownAsync(relativePath: string) {
  const raw = await fetchRawDocFileAsync(relativePath);
  if (!raw) {
    return '';
  }

  let content = raw.replace(IMPORT_STATEMENT_PATTERN, '');

  content = content.replace(/<RawH3[^>]*>([\S\s]*?)<\/RawH3>/g, (_match, text) => {
    return `### ${text.trim()}\n\n`;
  });

  content = content.replace(/<Terminal[^>]*cmd={(\[[^]*?])}[^>]*\/>/g, (_match, arrayLiteral) =>
    formatTerminalCommands(arrayLiteral as string)
  );

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
