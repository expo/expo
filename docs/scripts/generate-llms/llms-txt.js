import frontmatter from 'front-matter';
import fs from 'node:fs';
import path from 'node:path';

import { home, learn, general, eas, reference } from '../../constants/navigation.js';
import { generateCrossLinksSection, toBlockquote } from './shared.js';
import { EXPO_DESCRIPTION, PAGE_DESCRIPTION_OVERRIDES } from './transforms/descriptions.js';
import { MISCONCEPTIONS_SECTION } from './transforms/misconceptions.js';
import { PERFORMANCE_SECTION } from './transforms/performance.js';
import { buildTalksSections } from './transforms/talks-section.js';

const OUTPUT_DIRECTORY_NAME = 'public';
const OUTPUT_FILENAME_LLMS_TXT = 'llms.txt';
const TITLE = 'Expo Documentation';

function generateItemMarkdown(item) {
  return `- [${item.title}](${item.url})${item.description ? `: ${item.description}` : ''}\n`;
}

function generateSectionMarkdown(section) {
  let content = section.title ? `## ${section.title}\n\n` : '';

  content += section.items.map(generateItemMarkdown).join('');

  section.groups.forEach(group => {
    if (group.items.length > 0) {
      content += `\n### ${group.title}\n`;
      content += group.items.map(generateItemMarkdown).join('');
    }
  });

  section.sections.forEach(subSection => {
    if (subSection.title) {
      content += `\n### ${subSection.title}\n`;
    }
    content += subSection.items.map(generateItemMarkdown).join('');
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
    filteredSections.map(generateSectionMarkdown).join('') +
    '\n' +
    generateCrossLinksSection(OUTPUT_FILENAME_LLMS_TXT)
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
        url: `https://docs.expo.dev${pageHref}`,
        description: finalDescription,
      }
    : null;
}

function processPage(page) {
  return processPageData(page.href, page.name);
}

function processGroup(group) {
  const items = (group.children ?? [])
    .filter(child => child.type === 'page')
    .map(processPage)
    .filter(Boolean);

  return items.length > 0 ? { title: group.name, items } : null;
}

function hasContent(section) {
  return section?.items?.length ?? section?.groups?.length ?? section?.sections?.length;
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
        const sectionData = processSection(child);
        if (hasContent(sectionData)) {
          section.sections.push(sectionData);
        }
        break;
      }
    }
  });

  return section;
}

export async function generateLlmsTxt() {
  try {
    const docSections = Object.values({ home, general, learn, eas, reference: reference.latest })
      .flat()
      .map(processSection)
      .filter(Boolean);
    const talksSections = await buildTalksSections();
    const allSections = [...docSections, ...talksSections];

    await fs.promises.writeFile(
      path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, OUTPUT_FILENAME_LLMS_TXT),
      generateFullMarkdown({
        title: TITLE,
        description: EXPO_DESCRIPTION,
        sections: allSections,
      })
    );

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME_LLMS_TXT}`);
  } catch (error) {
    console.error('Error generating llms.txt:', error);
    throw error;
  }
}
