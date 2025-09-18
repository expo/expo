import { generateApiSectionMarkdownAsync } from './apiSectionMarkdown';
import { generateAppConfigSchemaMarkdownAsync } from './appConfigSchema';
import { DEVELOPMENT_MODE_MARKDOWN, PLATFORM_AND_DEVICE_MARKDOWN } from './constants';
import { generateEasJsonPropertiesTableMarkdownAsync } from './easJsonTables';
import {
  formatTerminalCommands,
  generateEnvironmentInstructionsMarkdownAsync,
} from './environmentInstructions';
import {
  BOX_LINK_PATTERN,
  FRONTMATTER_PATTERN,
  INTERNAL_LINK_PATTERN,
  PRETTIER_IGNORE_PATTERN,
  VIDEO_BOX_LINK_PATTERN,
} from './patterns';
import {
  generateProjectStructureMarkdownAsync,
  generateTemplateFeaturesMarkdownAsync,
} from './startDevelopingScenes';

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
  content = replaceConfigPluginPropertiesSections(content);

  content = await replaceSchemaComponentsAsync(content, schemaImports, enrichedContext);
  content = await replaceApiSectionsAsync(content, enrichedContext);

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
  const importLinePattern = /^\s*import\s.+$/;

  const filtered = lines.filter(line => {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      insideCodeFence = !insideCodeFence;
      return true;
    }

    if (!insideCodeFence && importLinePattern.test(line)) {
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
