import frontmatter from 'front-matter';
import fs from 'node:fs';

import { generateApiSectionMarkdown } from './api-section.js';
import {
  replaceBoxLinks,
  replaceContentSpotlights,
  replaceInstallSections,
  replaceConfigPluginProperties,
  replaceAppConfigSchemaTables,
  resolveDiffSource,
  replaceIcons,
  replacePrerequisites,
  replacePlatformTags,
  replaceStatusTags,
  replaceCopyTextButtons,
  replaceConfigReactNative,
  replaceBuildResourceList,
  replaceTerminalObjectCmd,
  replaceVideoBoxLinks,
  replaceApiMethods,
  replaceProgressTracker,
  replaceDownloadSlide,
  replaceCollapsibleJsxFragments,
  replaceJsxExpressions,
  replaceMetadataTables,
  replaceReactNavigationOptions,
  replaceCollapsibleTalksGrid,
  replaceInstructionScenes,
  stripNonConvertibleComponents,
  replaceIconHeadingSpans,
  replaceBoxComponents,
  replaceContentSpotlightFiles,
  replaceStepSingleQuote,
  stripMultilineImports,
  replaceConfigPluginExample,
  replacePermissionComponents,
  replaceApiBoxSectionHeader,
  replaceCalloutBlocks,
  stripInlineIcons,
  replaceContentSpotlightVideoId,
  replaceCollapsibleSpacedSummary,
  replacePlatformTagsWithClass,
  stripDataDisplayComponents,
  stripHeaderNestingLevel,
  replaceReactNativeCompatibilityTable,
  replaceAndroidIOSCompatibilityTable,
} from './component-replacers.js';
import { PLATFORM_AND_DEVICE_MARKDOWN, DEVELOPMENT_MODE_MARKDOWN } from './constants.js';
import { generateEasCliReferenceMarkdown } from './eas-cli.js';
import { generateEnvironmentInstructionsMarkdown } from './environment-instructions.js';
import { generateProjectStructureMarkdown, generateTemplateFeaturesMarkdown } from './scenes.js';
import { extractAttribute, resolveInternalLinks } from './shared-utils.js';
import { cleanContent } from '../utils.js';

export async function processPage(filePath, href) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { attributes, body } = frontmatter(raw);
  const title = attributes.title || '';
  const description = attributes.description || '';
  const packageName = attributes.packageName || '';

  if (!title && !body) {
    return null;
  }

  let content = body || '';

  const schemaImportRegex =
    /import\s+(\w+)\s+from\s+["']([^"']*\/public\/static\/schemas[^"']+)["']/g;
  const schemaImports = {};
  let schemaMatch;
  while ((schemaMatch = schemaImportRegex.exec(content))) {
    schemaImports[schemaMatch[1]] = schemaMatch[2];
  }

  content = content.replace(
    /<PlatformAndDeviceForm\s*\/?>/g,
    `\n${PLATFORM_AND_DEVICE_MARKDOWN}\n`
  );
  content = content.replace(/<DevelopmentModeForm\s*\/?>/g, `\n${DEVELOPMENT_MODE_MARKDOWN}\n`);

  if (content.includes('<DevelopmentEnvironmentInstructions')) {
    const instructions = generateEnvironmentInstructionsMarkdown();
    content = content.replace(/<DevelopmentEnvironmentInstructions\s*\/>/, `\n${instructions}\n`);
  }

  if (content.includes('<ProjectStructure')) {
    const structure = generateProjectStructureMarkdown();
    content = content.replace(/<ProjectStructure\s*\/>/, `\n${structure}\n`);
  }

  if (content.includes('<TemplateFeatures')) {
    const features = generateTemplateFeaturesMarkdown();
    content = content.replace(/<TemplateFeatures\s*\/>/, `\n${features}\n`);
  }

  if (content.includes('<EASCLIReference')) {
    const cliRef = generateEasCliReferenceMarkdown();
    content = content.replace(/<EASCLIReference\s*\/>/g, `\n${cliRef}\n`);
  }

  content = content.replace(/<APISection\s+([^>]*)\/>/g, (_m, attrs) => {
    const md = generateApiSectionMarkdown(attrs, href);
    return md ? `\n${md}\n` : '';
  });

  content = content.replace(/<DiffBlock\b([\S\s]*?)\/>/g, (_m, attrs) => {
    const rawMatch = attrs.match(/raw={`([\S\s]*?)`}/);
    if (rawMatch) {
      return `\n\`\`\`diff\n${rawMatch[1].trim()}\n\`\`\`\n`;
    }
    const source = extractAttribute(attrs, 'source');
    if (source) {
      const diffContent = resolveDiffSource(source);
      if (diffContent.trim()) {
        return `\n\`\`\`diff\n${diffContent.trim()}\n\`\`\`\n`;
      }
    }
    return '';
  });

  content = replaceInstallSections(content, packageName);

  content = replaceConfigPluginProperties(content);

  content = replaceAppConfigSchemaTables(content, schemaImports);

  content = stripMultilineImports(content);

  content = replaceConfigPluginExample(content);

  content = replacePermissionComponents(content);

  content = replaceApiBoxSectionHeader(content);

  content = replaceCalloutBlocks(content);

  content = stripInlineIcons(content);

  content = replaceContentSpotlightVideoId(content);

  content = replaceCollapsibleSpacedSummary(content);

  content = replacePlatformTagsWithClass(content);

  content = stripDataDisplayComponents(content);

  content = stripHeaderNestingLevel(content);

  content = replaceReactNativeCompatibilityTable(content, href);

  content = replaceAndroidIOSCompatibilityTable(content, href);

  content = replaceInstructionScenes(content);

  content = replaceMetadataTables(content);

  content = replaceReactNavigationOptions(content);

  content = await replaceCollapsibleTalksGrid(content);

  content = replaceIcons(content);

  content = replacePrerequisites(content);

  content = replacePlatformTags(content);

  content = replaceStatusTags(content);

  content = replaceCopyTextButtons(content);

  content = replaceConfigReactNative(content);

  content = replaceBuildResourceList(content);

  content = replaceTerminalObjectCmd(content);

  content = replaceVideoBoxLinks(content);

  content = replaceApiMethods(content);

  content = replaceProgressTracker(content);

  content = replaceDownloadSlide(content);

  content = replaceCollapsibleJsxFragments(content);

  content = replaceIconHeadingSpans(content);

  content = replaceBoxComponents(content);

  content = replaceContentSpotlightFiles(content);

  content = replaceStepSingleQuote(content);

  content = stripNonConvertibleComponents(content);

  content = replaceBoxLinks(content);

  content = replaceContentSpotlights(content);

  content = replaceJsxExpressions(content);

  content = cleanContent(content);

  content = resolveInternalLinks(content);

  content = content
    .split('\n')
    .map(l => l.trimEnd())
    .join('\n')
    .replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2')
    .replace(/(#{1,6} .+)\n([^\n#])/g, '$1\n\n$2')
    .replace(/(\*\*[^*]+\*\*)\n([^\n*-])/g, '$1\n\n$2')
    .replace(/(\*\*[^*]+\*\*)\n(-)/g, '$1\n\n$2')
    .replace(/(```)\n([^\n])/g, '$1\n\n$2')
    .replace(/([^\n])\n(```)/g, '$1\n\n$2')
    .replace(/([^\n|])\n(\|)/g, '$1\n\n$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  /**
   * Build final output
   */
  const parts = [];

  if (title) {
    parts.push(`# ${title}`);
  }
  if (description) {
    parts.push(`_${description}_`);
  }
  if (content) {
    parts.push(content);
  }
  return parts.join('\n\n');
}
