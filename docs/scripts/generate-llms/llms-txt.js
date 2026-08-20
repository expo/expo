import frontmatter from 'front-matter';
import fs from 'node:fs';
import path from 'node:path';

import { home, learn, general, eas, reference } from '../../constants/navigation.js';
import { getMarkdownUrl, toBlockquote } from './shared.js';
import { EXPO_DESCRIPTION, PAGE_DESCRIPTION_OVERRIDES } from './transforms/descriptions.js';
import { MISCONCEPTIONS_SECTION } from './transforms/misconceptions.js';
import { PERFORMANCE_SECTION } from './transforms/performance.js';

const OUTPUT_DIRECTORY_NAME = 'public';
const OUTPUT_FILENAME_LLMS_TXT = 'llms.txt';
const TITLE = 'Expo Documentation';

function isOverviewItem(item) {
  return item.overview === true || item.url.endsWith('/overview.md');
}

function generateItemMarkdown(item, withDescription) {
  return `- [${item.title}](${item.url})${withDescription && item.description ? `: ${item.description}` : ''}\n`;
}

const FULLY_DESCRIBED_SECTIONS = new Set(['Configuration files']);

function generateSectionMarkdown(section) {
  let content = section.title ? `## ${section.title}\n\n` : '';

  const describeAll = FULLY_DESCRIBED_SECTIONS.has(section.title);

  content += section.items
    .map((item, index) =>
      generateItemMarkdown(item, describeAll || index === 0 || isOverviewItem(item))
    )
    .join('');

  section.groups.forEach(group => {
    if (group.items.length > 0) {
      content += `\n### ${group.title}\n`;
      content += group.items
        .map(item => generateItemMarkdown(item, describeAll || isOverviewItem(item)))
        .join('');
    }
  });

  section.sections.forEach(subSection => {
    if (subSection.title) {
      content += `\n### ${subSection.title}\n`;
    }
    content += subSection.items
      .map(item => generateItemMarkdown(item, describeAll || isOverviewItem(item)))
      .join('');
  });

  return content + '\n';
}

function generateFullMarkdown({ title, description, sections }) {
  const filteredSections = sections.filter(section => {
    if (
      section.title === 'React Native' &&
      section.items.length === 0 &&
      section.groups.length === 0 &&
      section.sections.length === 0
    ) {
      return false;
    }
    return true;
  });

  return (
    `# ${title}\n\n${toBlockquote(description)}\n\n` +
    MISCONCEPTIONS_SECTION +
    PERFORMANCE_SECTION +
    filteredSections.map(generateSectionMarkdown).join('').trimEnd() +
    '\n'
  );
}

function resolveMdxPath(pageHref) {
  const mdxPath = path.join('pages', `${pageHref}.mdx`);
  if (fs.existsSync(mdxPath)) {
    return mdxPath;
  }

  const indexMdxPath = path.join('pages', pageHref, 'index.mdx');
  if (fs.existsSync(indexMdxPath)) {
    return indexMdxPath;
  }

  return null;
}

function readFrontmatterAttributes(filePath) {
  if (!filePath) {
    return {};
  }

  try {
    const { attributes } = frontmatter(fs.readFileSync(filePath, 'utf-8'));
    return {
      title: attributes.title ?? '',
      description: attributes.description ?? '',
    };
  } catch (error) {
    console.warn(`Error reading MDX file ${filePath}:`, error.message);
    return {};
  }
}

function processPageData(pageHref, pageName) {
  if (!pageHref || pageHref.startsWith('http')) {
    return null;
  }

  const filePath = resolveMdxPath(pageHref);
  if (!filePath) {
    console.warn(`No MDX source found for ${pageHref}`);
  }

  const { title, description } = readFrontmatterAttributes(filePath);
  const finalDescription = PAGE_DESCRIPTION_OVERRIDES[pageHref] ?? description;

  return title || pageName
    ? {
        title: title ?? pageName,
        url: getMarkdownUrl(pageHref),
        description: finalDescription,
      }
    : null;
}

function processPage(page) {
  return processPageData(page.href, page.name);
}

function collectPages(node) {
  return (node.children ?? [])
    .flatMap(child => (child.type === 'page' ? processPage(child) : collectPages(child)))
    .filter(Boolean);
}

function processGroup(group) {
  const items = collectPages(group);

  return items.length > 0 ? { title: group.name, items } : null;
}

function hasContent(section) {
  return section?.items.length > 0 || section?.groups.length > 0 || section?.sections.length > 0;
}

export const COLLAPSED_SECTIONS = new Set(['Expo UI']);

function collapseToOverviews(section) {
  if (!COLLAPSED_SECTIONS.has(section.title)) {
    return section;
  }

  const overviews = [...section.groups, ...section.sections]
    .map(child => child.items[0])
    .filter(Boolean)
    .map(item => ({ ...item, overview: true }));

  return { ...section, items: [...section.items, ...overviews], groups: [], sections: [] };
}

function processNestedSection(node) {
  return { title: node.name, items: collectPages(node), groups: [], sections: [] };
}

function processSection(node) {
  if (!node || node.type !== 'section') {
    return null;
  }

  const section = {
    title: node.name,
    items: [],
    groups: [],
    sections: [],
  };

  (node.children ?? []).forEach(child => {
    switch (child.type) {
      case 'page': {
        const pageData = processPage(child);
        if (pageData) {
          section.items.push(pageData);
        }
        break;
      }
      case 'group': {
        const groupData = processGroup(child);
        if (groupData) {
          section.groups.push(groupData);
        }
        break;
      }
      case 'section': {
        const sectionData = processNestedSection(child);
        if (hasContent(sectionData)) {
          section.sections.push(sectionData);
        }
        break;
      }
    }
  });

  return section;
}

export function generateLlmsTxtMarkdown(nodes) {
  const sections = nodes.map(processSection).filter(Boolean).map(collapseToOverviews);

  return generateFullMarkdown({
    title: TITLE,
    description: EXPO_DESCRIPTION,
    sections,
  });
}

export async function generateLlmsTxt() {
  try {
    const nodes = Object.values({ home, general, learn, eas, reference: reference.latest }).flat();

    await fs.promises.writeFile(
      path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, OUTPUT_FILENAME_LLMS_TXT),
      generateLlmsTxtMarkdown(nodes)
    );

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME_LLMS_TXT}`);
  } catch (error) {
    console.error('Error generating llms.txt:', error);
    throw error;
  }
}
