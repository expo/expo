import { DEVELOPMENT_MODE_MARKDOWN, PLATFORM_AND_DEVICE_MARKDOWN } from './constants';
import {
  formatTerminalCommands,
  generateEnvironmentInstructionsMarkdownAsync,
} from './environmentInstructions';
import {
  BOX_LINK_PATTERN,
  FRONTMATTER_PATTERN,
  IMPORT_STATEMENT_PATTERN,
  INTERNAL_LINK_PATTERN,
  PRETTIER_IGNORE_PATTERN,
  VIDEO_BOX_LINK_PATTERN,
} from './patterns';
import {
  generateProjectStructureMarkdownAsync,
  generateTemplateFeaturesMarkdownAsync,
} from './startDevelopingScenes';

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

  if (content.includes('<ProjectStructure')) {
    const structure = await generateProjectStructureMarkdownAsync();
    content = content.replace(/<ProjectStructure\s*\/>/, `\n${structure}\n`);
  }

  if (content.includes('<TemplateFeatures')) {
    const features = await generateTemplateFeaturesMarkdownAsync();
    content = content.replace(/<TemplateFeatures\s*\/>/, `\n${features}\n`);
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
