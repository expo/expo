import versions from '~/public/static/constants/versions.json';
import { getThreeVersions } from '~/ui/components/SDKTables/utils';

import { generateApiSectionMarkdownAsync } from './apiSectionMarkdown';
import { generateAppConfigSchemaMarkdownAsync } from './appConfigSchema';
import { DEVELOPMENT_MODE_MARKDOWN, PLATFORM_AND_DEVICE_MARKDOWN } from './constants';
import { generateEasJsonPropertiesTableMarkdownAsync } from './easJsonTables';
import {
  formatTerminalCommands,
  generateEnvironmentInstructionsMarkdownAsync,
} from './environmentInstructions';
import {
  FRONTMATTER_PATTERN,
  INTERNAL_LINK_PATTERN,
  PRETTIER_IGNORE_PATTERN,
  VIDEO_BOX_LINK_PATTERN,
} from './patterns';
import {
  generateProjectStructureMarkdownAsync,
  generateTemplateFeaturesMarkdownAsync,
} from './startDevelopingScenes';

const { LATEST_VERSION } = versions;

type SchemaMarkdownReplacer = {
  regex: RegExp;
  generator: (importPath: string) => Promise<string>;
};

type MarkdownContext = {
  path?: string;
  packageName?: string;
};

export async function prepareMarkdownForCopyAsync(
  rawContent: string,
  context: MarkdownContext = {}
) {
  if (!rawContent) {
    return '';
  }

  let content = rawContent;
  let title = '';
  let description = '';
  let pagePackageName = context.packageName ?? '';
  let pagePlatforms: string[] = [];

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
      if (key === 'packageName') {
        pagePackageName = value;
      }
      if (key === 'platforms') {
        const platforms = parseFrontmatterArray(value);
        if (platforms.length > 0) {
          pagePlatforms = platforms;
        }
      }
    });

    content = content.slice(frontmatterMatch[0].length);
  }

  const enrichedContext: MarkdownContext = {
    ...context,
    packageName: pagePackageName || context.packageName,
  };

  const schemaImports = extractSchemaImports(content);

  content = removeImportStatements(content);

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

  content = stripLayoutComponents(content);
  content = replaceApiInstallSections(content, enrichedContext);
  content = replaceInstallSections(content, enrichedContext);
  content = replaceConfigPluginPropertiesSections(content);
  content = replaceCompatibilityTables(content, enrichedContext);

  content = await replaceSchemaComponentsAsync(content, schemaImports, enrichedContext);
  content = await replaceDiffBlocksAsync(content);
  content = await replaceApiSectionsAsync(content, enrichedContext);

  content = replaceBoxLinks(content);
  content = replaceFileTrees(content);

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
  if (pagePlatforms.length > 0) {
    const platformText = formatPlatformAvailability(pagePlatforms);
    if (platformText) {
      parts.push(platformText);
    }
  }
  if (cleaned) {
    parts.push(cleaned);
  }

  return parts.join('\n\n');
}

function replaceBoxLinks(content: string) {
  const startTag = '<BoxLink';
  let cursor = 0;
  let result = '';

  while (cursor < content.length) {
    const start = content.indexOf(startTag, cursor);
    if (start === -1) {
      result += content.slice(cursor);
      break;
    }

    result += content.slice(cursor, start);

    const end = findBoxLinkClosingIndex(content, start + startTag.length);
    if (end === null) {
      // Unable to find a matching closing tag; append the rest and stop processing.
      result += content.slice(start);
      break;
    }

    const component = content.slice(start, end);
    const title = extractAttributeValue(component, 'title');
    const href = extractAttributeValue(component, 'href');

    if (!title && !href) {
      cursor = end;
      continue;
    }

    const linkTitle = title || href || '';

    if (!href) {
      result += `\n${linkTitle}\n`;
      cursor = end;
      continue;
    }

    const normalizedHref = href.startsWith('http') ? href : `https://docs.expo.dev${href}`;
    result += `\n[${linkTitle}](${normalizedHref})\n`;
    cursor = end;
  }

  return result;
}

const FILE_TREE_PATTERN = /<FileTree\s+files={(\[[\s\S]*?\])}\s*\/>/g;

function replaceFileTrees(content: string) {
  return content.replace(FILE_TREE_PATTERN, (_match, filesLiteral) => {
    const files = parseFileTreeFilesLiteral(filesLiteral);
    if (!files || files.length === 0) {
      return '';
    }

    const structure = buildFileTreeStructure(files);
    const lines = renderFileTreeAscii(structure);
    if (lines.length === 0) {
      return '';
    }
    const codeBlock = ['```', ...lines, '```'].join('\n');
    return `\n${codeBlock}\n`;
  });
}

type FileTreeInput = (string | [string, string])[];

type FileTreeNode = {
  name: string;
  note?: string;
  children: FileTreeNode[];
};

function parseFileTreeFilesLiteral(literal: string): FileTreeInput {
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`return (${literal})`)() as FileTreeInput;
  } catch (error) {
    console.warn('Unable to parse FileTree files literal:', error);
    return [];
  }
}

function buildFileTreeStructure(files: FileTreeInput): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  function modifyPath(path: string, note?: string) {
    const segments = path.split('/');
    let currentLevel = root;

    segments.forEach((segment, index) => {
      const existing = currentLevel.find(node => node.name === segment);
      if (existing) {
        if (note && index === segments.length - 1) {
          existing.note = note;
        }
        currentLevel = existing.children;
        return;
      }

      const newNode: FileTreeNode = {
        name: segment,
        note: note && index === segments.length - 1 ? note : undefined,
        children: [],
      };
      currentLevel.push(newNode);
      currentLevel = newNode.children;
    });
  }

  files.forEach(entry => {
    if (Array.isArray(entry)) {
      modifyPath(entry[0], entry[1]);
    } else if (typeof entry === 'string') {
      modifyPath(entry);
    }
  });

  return root;
}

function renderFileTreeAscii(structure: FileTreeNode[]): string[] {
  const lines: string[] = [];

  function renderNodes(nodes: FileTreeNode[], prefix: string) {
    nodes.forEach((node, index) => {
      const isLast = index === nodes.length - 1;
      const connector = `${prefix}${isLast ? '└── ' : '├── '}`;
      const isDirectory = node.children.length > 0;
      const name = isDirectory ? `${node.name}/` : node.name;
      const note = node.note ? `  # ${node.note}` : '';

      lines.push(`${connector}${name}${note}`);

      if (isDirectory) {
        const childPrefix = `${prefix}${isLast ? '    ' : '│   '}`;
        renderNodes(node.children, childPrefix);
      }
    });
  }

  renderNodes(structure, '');

  if (lines.length > 0) {
    return lines.map(line => line.replace(/^(├── |└── )/, ''));
  }

  return lines;
}

function findBoxLinkClosingIndex(source: string, searchStart: number) {
  let index = searchStart;
  let braceDepth = 0;
  let quote: string | null = null;

  while (index < source.length - 1) {
    const char = source[index];
    const next = source[index + 1];

    if (quote) {
      if (char === '\\' && index + 1 < source.length) {
        index += 2;
        continue;
      }
      if (char === quote) {
        quote = null;
      }
      index += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      index += 1;
      continue;
    }

    if (char === '{') {
      braceDepth += 1;
      index += 1;
      continue;
    }

    if (char === '}') {
      if (braceDepth > 0) {
        braceDepth -= 1;
      }
      index += 1;
      continue;
    }

    if (char === '/' && next === '>' && braceDepth === 0) {
      return index + 2;
    }

    index += 1;
  }

  return null;
}

function parseFrontmatterArray(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return [] as string[];
  }

  const stripWrapper = (str: string) => str.replace(/^["']|["']$/g, '').trim();

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const normalized = trimmed.replace(/'/g, '"');
    try {
      const parsed = JSON.parse(normalized);
      if (Array.isArray(parsed)) {
        return parsed.map(item => stripWrapper(String(item))).filter(Boolean);
      }
    } catch {
      // ignore JSON parse errors and fallback to manual parsing below
    }

    const inner = trimmed.slice(1, -1);
    return inner
      .split(',')
      .map(item => stripWrapper(item))
      .filter(Boolean);
  }

  return trimmed
    .split(',')
    .map(item => stripWrapper(item))
    .filter(Boolean);
}

function extractAttributeValue(source: string, attribute: string) {
  const escapeRegExp = (value: string) => value.replace(/[$()*+.?[\\\]^{|}-]/g, '\\$&');
  const escapedAttribute = escapeRegExp(attribute);
  const attributePattern = new RegExp(
    `${escapedAttribute}\\s*=\\s*(?:("([^"]+)")|('([^']+)')|{\\s*['"]([^'"]+)['"]\\s*})`
  );
  const match = source.match(attributePattern);
  if (!match) {
    return '';
  }
  const value = match[2] ?? match[4] ?? match[5] ?? '';
  return value.trim();
}

async function loadDiffSourceAsync(source: string) {
  const url = resolveDocsUrl(source);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch diff: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Unable to load diff source for markdown conversion:', source, error);
    return '';
  }
}

function resolveDocsUrl(path: string) {
  if (!path) {
    return '';
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return `https://docs.expo.dev${path}`;
}

function formatPlatformAvailability(platforms: string[]) {
  const displayNames = getDisplayPlatformNames(platforms);
  if (displayNames.length === 0) {
    return '';
  }
  const label = displayNames.length === 1 ? 'platform' : 'platforms';
  return `Available on ${label} ${displayNames.join(', ')}`;
}

function getDisplayPlatformNames(platforms: string[]) {
  const toDisplayName = (platform: string) => {
    const trimmed = platform.trim();
    if (!trimmed) {
      return '';
    }
    const base = trimmed.replace(/\*+$/, '');
    const isDeviceOnly = trimmed.endsWith('*');
    if (isDeviceOnly && ['ios', 'android'].includes(base.toLowerCase())) {
      return `${base} (device-only)`;
    }
    return base;
  };

  return Array.from(
    new Set(
      platforms
        .map(toDisplayName)
        .map(name => name.trim())
        .filter(Boolean)
    )
  );
}

function extractSchemaImports(content: string) {
  const schemaImportRegex =
    /import\s+(\w+)\s+from\s+["']([^"']*\/public\/static\/schemas[^"']+)["']/g;
  const map: Record<string, string> = {};
  let match: RegExpExecArray | null;

  while ((match = schemaImportRegex.exec(content))) {
    const identifier = match[1];
    const importPath = match[2];
    map[identifier] = importPath;
  }

  return map;
}

function removeImportStatements(content: string) {
  const lines = content.split('\n');
  let insideCodeFence = false;
  let insideImportBlock = false;
  const importLinePattern = /^\s*import\s.+$/;

  const filtered = lines.filter(line => {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      insideCodeFence = !insideCodeFence;
      return true;
    }

    if (!insideCodeFence && insideImportBlock) {
      if (trimmed.endsWith(';')) {
        insideImportBlock = false;
      }
      return false;
    }

    if (!insideCodeFence && importLinePattern.test(line)) {
      insideImportBlock = !trimmed.endsWith(';');
      return false;
    }

    return true;
  });

  return filtered.join('\n');
}

async function replaceSchemaComponentsAsync(
  content: string,
  schemaImports: Record<string, string>,
  _context: MarkdownContext
) {
  let updatedContent = content;

  const replacers: SchemaMarkdownReplacer[] = [
    {
      regex: /<EasJsonPropertiesTable\s+schema={(\w+)}\s*\/>/g,
      generator: generateEasJsonPropertiesTableMarkdownAsync,
    },
    {
      regex: /<AppConfigSchemaTable\s+schema={(\w+)}\s*\/>/g,
      generator: generateAppConfigSchemaMarkdownAsync,
    },
  ];

  for (const replacer of replacers) {
    updatedContent = await replaceSchemaComponentAsync(
      updatedContent,
      schemaImports,
      replacer.regex,
      replacer.generator
    );
  }

  return updatedContent;
}

async function replaceDiffBlocksAsync(content: string) {
  const diffRegex = /<DiffBlock\b([\S\s]*?)\/>/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = diffRegex.exec(content))) {
    result += content.slice(lastIndex, match.index);
    const attributeString = match[1] ?? '';
    const attributes = parseComponentAttributes(attributeString);

    let diffContent = '';

    if (typeof attributes.raw === 'string') {
      diffContent = attributes.raw;
    } else if (typeof attributes.source === 'string' && attributes.source) {
      diffContent = await loadDiffSourceAsync(attributes.source);
    }

    if (diffContent.trim()) {
      result += `\n\`\`\`diff\n${diffContent.trim()}\n\`\`\`\n`;
    }

    lastIndex = diffRegex.lastIndex;
  }

  result += content.slice(lastIndex);
  return result;
}

async function replaceSchemaComponentAsync(
  content: string,
  schemaImports: Record<string, string>,
  regex: RegExp,
  generator: (importPath: string) => Promise<string>
) {
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content))) {
    result += content.slice(lastIndex, match.index);
    const identifier = match[1];
    const importPath = schemaImports[identifier];

    if (importPath) {
      try {
        const markdown = await generator(importPath);
        if (markdown) {
          result += `\n${markdown}\n`;
        }
      } catch (error) {
        console.error('Unable to generate schema markdown for', importPath, error);
      }
    }

    lastIndex = regex.lastIndex;
  }

  result += content.slice(lastIndex);
  return result;
}

function stripLayoutComponents(content: string) {
  let cleaned = content
    .replace(/<ConfigPluginExample>/g, '')
    .replace(/<\/ConfigPluginExample>/g, '')
    .replace(/^<SnackInline\b[^>]*>.*$/gm, '')
    .replace(/^<\/SnackInline>\s*$/gm, '');

  cleaned = cleaned.replace(/<RedirectNotification[^>]*>[\S\s]*?<\/RedirectNotification>/g, '');
  cleaned = cleaned.replace(/<CodeBlocksTable\b[^>]*>/g, '').replace(/<\/CodeBlocksTable>/g, '');
  cleaned = cleaned.replace(/<TabsGroup\b[^>]*>/g, '').replace(/<\/TabsGroup>/g, '');
  cleaned = cleaned.replace(/<\/PaddedAPIBox>/g, '');
  cleaned = cleaned.replace(/<PaddedAPIBox\b([^>]*)>/g, (_match, attributes) => {
    const header = extractAttributeValue(`<PaddedAPIBox ${attributes}>`, 'header');
    return header ? `\n#### ${header}\n\n` : '\n\n';
  });

  cleaned = cleaned.replace(/<Collapsible\b([^>]*)>/g, (_match, attributes) => {
    const summary = extractAttributeValue(`<Collapsible ${attributes}>`, 'summary');
    return summary ? `\n#### ${summary}\n\n` : '\n\n';
  });

  cleaned = cleaned.replace(/<\/Collapsible>/g, '');

  // Remove empty lines left by the replacements
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned;
}

function replaceApiInstallSections(content: string, context: MarkdownContext) {
  const installRegex = /<APIInstallSection\s*([^>]*)\/>/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = installRegex.exec(content))) {
    result += content.slice(lastIndex, match.index);
    const attributeString = match[1] ?? '';
    const attributes = parseComponentAttributes(attributeString);

    const commands = resolveInstallCommands(attributes, context);
    const note = buildInstallNote(attributes);

    if (commands.length > 0) {
      result += `\n\`\`\`bash\n${commands.join('\n')}\n\`\`\`\n`;
    }

    if (note) {
      result += `\n${note}\n`;
    }

    lastIndex = installRegex.lastIndex;
  }

  result += content.slice(lastIndex);
  return result;
}

function replaceInstallSections(content: string, context: MarkdownContext) {
  const installRegex = /<InstallSection\b([\S\s]*?)\/>/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = installRegex.exec(content))) {
    result += content.slice(lastIndex, match.index);
    const attributeString = match[1] ?? '';
    const attributes = parseComponentAttributes(attributeString);

    const commands = resolveInstallCommands(attributes, context);
    const note = buildInstallNote(attributes);

    if (commands.length > 0) {
      result += `\n\`\`\`bash\n${commands.join('\n')}\n\`\`\`\n`;
    }

    if (note) {
      result += `\n${note}\n`;
    }

    lastIndex = installRegex.lastIndex;
  }

  result += content.slice(lastIndex);
  return result;
}

function replaceConfigPluginPropertiesSections(content: string) {
  const propertiesRegex = /<ConfigPluginProperties\b([\S\s]*?)\/>/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = propertiesRegex.exec(content))) {
    result += content.slice(lastIndex, match.index);
    const attributeString = match[1] ?? '';
    const attributes = parseComponentAttributes(attributeString);

    const properties = Array.isArray(attributes.properties) ? attributes.properties : [];
    const tableMarkdown = renderPluginPropertiesTable(properties);
    if (tableMarkdown) {
      result += `\n${tableMarkdown}\n`;
    }

    lastIndex = propertiesRegex.lastIndex;
  }

  result += content.slice(lastIndex);
  return result;
}

function renderPluginPropertiesTable(properties: any[]) {
  if (!Array.isArray(properties) || properties.length === 0) {
    return '';
  }

  const header = ['| Name | Default | Description |', '| --- | --- | --- |'];
  const rows = properties.map(rawProperty => {
    const property = rawProperty ?? {};
    const name = typeof property.name === 'string' ? property.name : '';
    const defaultValueRaw = property.default;
    const defaultValue =
      defaultValueRaw === undefined || defaultValueRaw === null
        ? undefined
        : typeof defaultValueRaw === 'string'
          ? defaultValueRaw
          : JSON.stringify(defaultValueRaw);

    const description = typeof property.description === 'string' ? property.description : '';
    const platform = typeof property.platform === 'string' ? property.platform : '';
    const experimental = Boolean(property.experimental);
    const deprecated = Boolean(property.deprecated);

    const descriptionParts: string[] = [];
    if (deprecated) {
      descriptionParts.push('**Deprecated.**');
    }
    if (experimental) {
      descriptionParts.push('**Experimental.**');
    }
    if (platform) {
      descriptionParts.push(`Only for: ${platform}.`);
    }
    if (description) {
      descriptionParts.push(description);
    }

    const cellDescription = descriptionParts.join(' ').replace(/\n+/g, '<br>');
    const escapedName = escapeTableCell(name ? `\`${name}\`` : '');
    const escapedDefault = escapeTableCell(defaultValue ? `\`${defaultValue}\`` : '-');
    const escapedDescription = escapeTableCell(cellDescription || '-');

    return `| ${escapedName || '-'} | ${escapedDefault} | ${escapedDescription} |`;
  });

  return ['### Configurable properties', ...header, ...rows].join('\n');
}

function escapeTableCell(value: string) {
  return value.replace(/\|/g, '\\|');
}

function replaceCompatibilityTables(content: string, context: MarkdownContext) {
  const sdkVersion = resolveSdkVersionFromContext(context);
  const versionsToShow = getThreeVersions(sdkVersion);

  const reactNativeTable = renderReactNativeCompatibilityTable(versionsToShow);
  const androidIosTable = renderAndroidIosCompatibilityTable(versionsToShow);

  let updated = content;
  updated = updated.replace(
    /<ReactNativeCompatibilityTable\s*\/>/g,
    reactNativeTable ? `\n${reactNativeTable}\n` : ''
  );
  updated = updated.replace(
    /<AndroidIOSCompatibilityTable\s*\/>/g,
    androidIosTable ? `\n${androidIosTable}\n` : ''
  );

  return updated;
}

function renderReactNativeCompatibilityTable(versionsToShow: ReturnType<typeof getThreeVersions>) {
  if (versionsToShow.length === 0) {
    return '';
  }

  const header = [
    '| Expo SDK version | React Native version | React version | React Native Web version | Minimum Node.js version |',
    '| --- | --- | --- | --- | --- |',
  ];

  const rows = versionsToShow.map(version => {
    const sdk = getCellValue(version.sdk);
    const reactNative = getCellValue(version['react-native']);
    const react = getCellValue(version['react']);
    const reactNativeWeb = getCellValue(version['react-native-web']);
    const node = getCellValue(version['node']);
    return `| ${sdk} | ${reactNative} | ${react} | ${reactNativeWeb} | ${node} |`;
  });

  return [...header, ...rows].join('\n');
}

function renderAndroidIosCompatibilityTable(versionsToShow: ReturnType<typeof getThreeVersions>) {
  if (versionsToShow.length === 0) {
    return '';
  }

  const header = [
    '| Expo SDK version | Android version | `compileSdkVersion` | `targetSdkVersion` | iOS version | Xcode version |',
    '| --- | --- | --- | --- | --- | --- |',
  ];

  const rows = versionsToShow.map(version => {
    const sdk = getCellValue(version.sdk);
    const android = getCellValue(version.android);
    const compileSdk = getCellValue(version.compileSdkVersion);
    const targetSdk = getCellValue(version.targetSdkVersion);
    const ios = getCellValue(version.ios);
    const xcode = getCellValue(version.xcode);
    return `| ${sdk} | ${android} | ${compileSdk} | ${targetSdk} | ${ios} | ${xcode} |`;
  });

  return [...header, ...rows].join('\n');
}

function resolveSdkVersionFromContext(context: MarkdownContext) {
  const path = context.path ?? '';
  const match = path.match(/\/(?:versions|archives)\/([^/]+)/);
  let version = match ? match[1] : LATEST_VERSION;

  if (version === 'latest' || version === 'unversioned') {
    version = LATEST_VERSION;
  }

  return version;
}

function getCellValue(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value);
}

function resolveInstallCommands(attributes: Record<string, any>, context: MarkdownContext) {
  const rawCmd = attributes.cmd;
  let commands: string[] = [];

  if (Array.isArray(rawCmd)) {
    commands = rawCmd.map(value => String(value).trim()).filter(Boolean);
  } else if (typeof rawCmd === 'string') {
    commands = [rawCmd.trim()].filter(Boolean);
  }

  if (commands.length === 0 && rawCmd && typeof rawCmd === 'object') {
    const values = Object.values(rawCmd as Record<string, unknown>).map(value =>
      typeof value === 'string' ? value.trim() : ''
    );
    commands = values.filter(Boolean);
  }

  if (commands.length === 0) {
    let packageName = '';
    if (typeof attributes.packageName === 'string' && attributes.packageName) {
      packageName = attributes.packageName;
    } else if (typeof context.packageName === 'string' && context.packageName) {
      packageName = context.packageName;
    }

    if (packageName) {
      commands = [`$ npx expo install ${packageName}`];
    }
  }

  return commands;
}

function buildInstallNote(attributes: Record<string, any>) {
  const notes: string[] = [];
  const hideBare =
    attributes.hideBareInstructions === true || attributes.hideBareInstructions === 'true';

  if (!hideBare) {
    notes.push(
      'If you are installing this in an existing React Native app, make sure to install `expo` in your project.'
    );
  }

  if (typeof attributes.href === 'string' && attributes.href) {
    const href = attributes.href.startsWith('http')
      ? attributes.href
      : `https://docs.expo.dev${attributes.href}`;
    notes.push(`Follow the installation instructions at ${href}.`);
  }

  return notes.join(' ');
}

async function replaceApiSectionsAsync(content: string, context: MarkdownContext) {
  const apiSectionRegex = /<APISection\s+([^>]*)\/>/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = apiSectionRegex.exec(content))) {
    result += content.slice(lastIndex, match.index);
    const attributeString = match[1];
    const attributes = parseComponentAttributes(attributeString);

    if (attributes.packageName) {
      const markdown = await generateApiSectionMarkdownAsync(attributes, {
        path: context.path,
      });
      if (markdown) {
        result += `\n${markdown}\n`;
      }
    }

    lastIndex = apiSectionRegex.lastIndex;
  }

  result += content.slice(lastIndex);
  return result;
}

function parseComponentAttributes(attributeString: string) {
  const attributes: Record<string, any> = {};
  let index = 0;

  while (index < attributeString.length) {
    while (index < attributeString.length && /\s/.test(attributeString[index])) {
      index += 1;
    }

    const keyStart = index;
    while (index < attributeString.length && /\w/.test(attributeString[index])) {
      index += 1;
    }

    const key = attributeString.slice(keyStart, index);
    if (!key) {
      break;
    }

    while (index < attributeString.length && /\s/.test(attributeString[index])) {
      index += 1;
    }

    if (index >= attributeString.length || attributeString[index] !== '=') {
      attributes[key] = true;
      continue;
    }
    index += 1;

    while (index < attributeString.length && /\s/.test(attributeString[index])) {
      index += 1;
    }

    if (index >= attributeString.length) {
      break;
    }

    const delimiter = attributeString[index];
    let value = '';

    if (delimiter === '"' || delimiter === "'") {
      index += 1;
      const start = index;
      while (index < attributeString.length && attributeString[index] !== delimiter) {
        index += 1;
      }
      value = attributeString.slice(start, index);
      index += 1;
      attributes[key] = value;
    } else if (delimiter === '{') {
      let depth = 1;
      index += 1;
      const start = index;
      while (index < attributeString.length && depth > 0) {
        if (attributeString[index] === '{') {
          depth += 1;
        } else if (attributeString[index] === '}') {
          depth -= 1;
        }
        index += 1;
      }
      value = attributeString.slice(start, index - 1);
      attributes[key] = evaluateExpression(value.trim());
    } else {
      const start = index;
      while (index < attributeString.length && !/\s/.test(attributeString[index])) {
        index += 1;
      }
      value = attributeString.slice(start, index);
      attributes[key] = value;
    }
  }

  return attributes;
}

function evaluateExpression(expression: string) {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${expression})`);
    return fn();
  } catch (error) {
    console.warn('Unable to evaluate expression for markdown conversion:', expression, error);
    return undefined;
  }
}
