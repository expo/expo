import frontmatter from 'front-matter';
import fs from 'node:fs';

import { PLATFORM_AND_DEVICE_MARKDOWN, DEVELOPMENT_MODE_MARKDOWN } from './constants.js';
import { generateEnvironmentInstructionsMarkdown } from './environment-instructions.js';
import { generateProjectStructureMarkdown, generateTemplateFeaturesMarkdown } from './scenes.js';
import { generateApiSectionMarkdown } from './api-section.js';
import { generateEasCliReferenceMarkdown } from './eas-cli.js';
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
} from './component-replacers.js';
import { extractAttribute, resolveInternalLinks } from './shared-utils.js';
import { cleanContent } from '../utils.js';

export async function processPage(filePath, href) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { attributes, body } = frontmatter(raw);
  const title = attributes.title || '';
  const description = attributes.description || '';
  const packageName = attributes.packageName || '';

  if (!title && !body) return null;

  let content = body || '';

  // Extract schema imports before removing them
  const schemaImportRegex = /import\s+(\w+)\s+from\s+["']([^"']*\/public\/static\/schemas[^"']+)["']/g;
  const schemaImports = {};
  let schemaMatch;
  while ((schemaMatch = schemaImportRegex.exec(content))) {
    schemaImports[schemaMatch[1]] = schemaMatch[2];
  }

  // Replace data-driven components BEFORE cleanContent strips them
  // PlatformAndDeviceForm / DevelopmentModeForm
  content = content.replace(/<PlatformAndDeviceForm\s*\/?>/g, `\n${PLATFORM_AND_DEVICE_MARKDOWN}\n`);
  content = content.replace(/<DevelopmentModeForm\s*\/?>/g, `\n${DEVELOPMENT_MODE_MARKDOWN}\n`);

  // DevelopmentEnvironmentInstructions
  if (content.includes('<DevelopmentEnvironmentInstructions')) {
    const instructions = generateEnvironmentInstructionsMarkdown();
    content = content.replace(/<DevelopmentEnvironmentInstructions\s*\/>/, `\n${instructions}\n`);
  }

  // ProjectStructure
  if (content.includes('<ProjectStructure')) {
    const structure = generateProjectStructureMarkdown();
    content = content.replace(/<ProjectStructure\s*\/>/, `\n${structure}\n`);
  }

  // TemplateFeatures
  if (content.includes('<TemplateFeatures')) {
    const features = generateTemplateFeaturesMarkdown();
    content = content.replace(/<TemplateFeatures\s*\/>/, `\n${features}\n`);
  }

  // EASCLIReference
  if (content.includes('<EASCLIReference')) {
    const cliRef = generateEasCliReferenceMarkdown();
    content = content.replace(/<EASCLIReference\s*\/>/g, `\n${cliRef}\n`);
  }

  // APISection
  content = content.replace(/<APISection\s+([^>]*)\/>/g, (_m, attrs) => {
    const md = generateApiSectionMarkdown(attrs, href);
    return md ? `\n${md}\n` : '';
  });

  // DiffBlock with source attribute (read from local filesystem)
  content = content.replace(/<DiffBlock\b([\S\s]*?)\/>/g, (_m, attrs) => {
    const rawMatch = attrs.match(/raw={`([\S\s]*?)`}/);
    if (rawMatch) return `\n\`\`\`diff\n${rawMatch[1].trim()}\n\`\`\`\n`;
    const source = extractAttribute(attrs, 'source');
    if (source) {
      const diffContent = resolveDiffSource(source);
      if (diffContent.trim()) return `\n\`\`\`diff\n${diffContent.trim()}\n\`\`\`\n`;
    }
    return '';
  });

  // InstallSection / APIInstallSection
  content = replaceInstallSections(content, packageName);

  // ConfigPluginProperties
  content = replaceConfigPluginProperties(content);

  // AppConfigSchemaTable
  content = replaceAppConfigSchemaTables(content, schemaImports);

  // --- New handlers (data-preserving, run before cleanContent) ---

  // Strip multiline imports (outside code blocks)
  content = stripMultilineImports(content);

  // ConfigPluginExample wrapper tags → strip
  content = replaceConfigPluginExample(content);

  // AndroidPermissions / IOSPermissions → permission list
  content = replacePermissionComponents(content);

  // APIBoxSectionHeader → heading
  content = replaceApiBoxSectionHeader(content);

  // CALLOUT blocks → markdown
  content = replaceCalloutBlocks(content);

  // CornerDownRightIcon and similar inline icons → strip
  content = stripInlineIcons(content);

  // ContentSpotlight with videoId → video link
  content = replaceContentSpotlightVideoId(content);

  // Collapsible with spaced summary attribute
  content = replaceCollapsibleSpacedSummary(content);

  // PlatformTag with class attribute
  content = replacePlatformTagsWithClass(content);

  // MONOSPACE, NUMBER, Project → strip tags keep content
  content = stripDataDisplayComponents(content);

  // headerNestingLevel attribute cleanup
  content = stripHeaderNestingLevel(content);

  // Scene-based instruction components
  content = replaceInstructionScenes(content);

  // MetadataTable + MD.* → markdown tables
  content = replaceMetadataTables(content);

  // ReactNavigationOptions → markdown table from JSON
  content = replaceReactNavigationOptions(content);

  // CollapsibleTalksGridWrapper → talks list (async)
  content = await replaceCollapsibleTalksGrid(content);

  // Icons → text equivalents
  content = replaceIcons(content);

  // Prerequisites / Requirement → markdown sections
  content = replacePrerequisites(content);

  // PlatformTag / PlatformTags → inline text labels
  content = replacePlatformTags(content);

  // StatusTag → inline text
  content = replaceStatusTags(content);

  // CopyTextButton → keep inner text
  content = replaceCopyTextButtons(content);

  // ConfigReactNative → markdown section
  content = replaceConfigReactNative(content);

  // BuildResourceList → hardcoded resource specs
  content = replaceBuildResourceList(content);

  // Terminal with object cmd format
  content = replaceTerminalObjectCmd(content);

  // VideoBoxLink (multiline)
  content = replaceVideoBoxLinks(content);

  // APIMethod → markdown function signature
  content = replaceApiMethods(content);

  // ProgressTracker → "Next chapter" link
  content = replaceProgressTracker(content);

  // DownloadSlide → markdown image link
  content = replaceDownloadSlide(content);

  // Collapsible with JSX fragment summary
  content = replaceCollapsibleJsxFragments(content);

  // Icon components in heading spans
  content = replaceIconHeadingSpans(content);

  // Box components → markdown sections
  content = replaceBoxComponents(content);

  // ContentSpotlight with file= attribute (video)
  content = replaceContentSpotlightFiles(content);

  // Step with single-quoted labels
  content = replaceStepSingleQuote(content);

  // Strip non-convertible components
  content = stripNonConvertibleComponents(content);

  // BoxLink → markdown links (before cleanContent strips them)
  content = replaceBoxLinks(content);

  // ContentSpotlight → image links (before cleanContent strips them)
  content = replaceContentSpotlights(content);

  // JSX expression cleanup (comments, whitespace, fragments, className)
  content = replaceJsxExpressions(content);

  // Now run cleanContent for the remaining JSX stripping
  content = cleanContent(content);

  // Internal link resolution
  content = resolveInternalLinks(content);

  // Ensure blank lines before headings and after paragraphs
  content = content
    .split('\n')
    .map(l => l.trimEnd())
    .join('\n')
    // Blank line before any heading that doesn't already have one
    .replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2')
    // Blank line after code blocks
    .replace(/(```)\n([^\n])/g, '$1\n\n$2')
    // Blank line before code blocks
    .replace(/([^\n])\n(```)/g, '$1\n\n$2')
    // Collapse 3+ newlines to 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Build final output
  const parts = [];
  if (title) parts.push(`# ${title}`);
  if (description) parts.push(`_${description}_`);
  if (content) parts.push(content);
  return parts.join('\n\n');
}
