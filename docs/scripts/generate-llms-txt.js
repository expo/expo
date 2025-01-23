import frontmatter from 'front-matter';
import fs from 'node:fs';
import path from 'node:path';

import { home, learn, general, eas, reference } from '../constants/navigation.js';

const OUTPUT_FILENAME = 'llms.txt';
const TITLE = 'Expo Documentation';
const DESCRIPTION =
  'Expo is an open-source React Native framework for apps that run natively on Android, iOS, and the web. Expo brings together the best of mobile and the web and enables many important features for building and scaling an app such as live updates, instantly sharing your app, and web support. The company behind Expo also offers Expo Application Services (EAS), which are deeply integrated cloud services for Expo and React Native apps.';

function readFrontmatter(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`File does not exist: ${filePath}`);
      return {};
    }
    const { attributes, body } = frontmatter(fs.readFileSync(filePath, 'utf-8'));
    return {
      title: attributes.title || '',
      description: attributes.description || '',
      content: body,
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

  const filePath = path.join('pages', pageHref + '.mdx');
  const { title, description, content } = readFrontmatter(filePath);

  return title || pageName
    ? {
        title: title || pageName,
        url: `https://docs.expo.dev${pageHref}`,
        description,
        content,
      }
    : null;
}

function processPage(page) {
  return processPageData(page.href, page.name);
}

function processGroup(group) {
  const items = (group.children || [])
    .filter(child => child.type === 'page')
    .map(processPage)
    .filter(Boolean);

  return items.length ? { title: group.name, items } : null;
}

function processSection(node) {
  if (node.type !== 'section') {
    return null;
  }

  const section = {
    title: node.name,
    items: [],
    groups: [],
    sections: [],
  };

  let pageData = null;
  let groupData = null;
  let sectionData = null;

  (node.children || []).forEach(child => {
    switch (child.type) {
      case 'page':
        pageData = processPage(child);
        if (pageData) {
          section.items.push(pageData);
        }
        break;
      case 'group':
        groupData = processGroup(child);
        if (groupData) {
          section.groups.push(groupData);
        }
        break;
      case 'section':
        sectionData = processSection(child);
        if (hasContent(sectionData)) {
          section.sections.push(sectionData);
        }
        break;
    }
  });

  return section;
}

function hasContent(section) {
  return section?.items?.length || section?.groups?.length || section?.sections?.length;
}

function generateItemMarkdown(item) {
  return `- [${item.title}](${item.url})${item.description ? `: ${item.description}` : ''}\n`;
}

function generateSectionMarkdown(section) {
  let content = section.title ? `## ${section.title}\n\n` : '';

  content += section.items.map(generateItemMarkdown).join('');

  section.groups.forEach(group => {
    if (group.items.length) {
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
      !section.items.length &&
      !section.groups.length &&
      !section.sections.length
    ) {
      return false;
    }
    return true;
  });

  return (
    `# ${title}\n\n${description}\n\n` + filteredSections.map(generateSectionMarkdown).join('')
  );
}

async function generateLlmsTxt() {
  try {
    const sections = Object.values({ home, general, learn, eas, reference: reference.latest })
      .flat()
      .map(processSection)
      .filter(Boolean);

    await fs.promises.writeFile(
      path.join(process.cwd(), 'public', OUTPUT_FILENAME),
      generateFullMarkdown({
        title: TITLE,
        description: DESCRIPTION,
        sections,
      })
    );

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME}`);
    process.exit(0);
  } catch (error) {
    console.error('Error generating llms.txt:', error);
    process.exit(1);
  }
}

generateLlmsTxt();
