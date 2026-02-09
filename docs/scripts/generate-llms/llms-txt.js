import frontmatter from 'front-matter';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

import { home, learn, general, eas, reference } from '../../constants/navigation.js';

const OUTPUT_DIRECTORY_NAME = 'public';
const OUTPUT_FILENAME_LLMS_TXT = 'llms.txt';
const TITLE = 'Expo Documentation';
const DESCRIPTION =
  'Expo is an open-source React Native framework for apps that run natively on Android, iOS, and the web. Expo brings together the best of mobile and the web and enables many important features for building and scaling an app such as live updates, instantly sharing your app, and web support. The company behind Expo also offers Expo Application Services (EAS), which are deeply integrated cloud services for Expo and React Native apps.';
const TALKS_TS_PATH = path.join(process.cwd(), 'public/static/talks.ts');
const TALKS_JS_PATH = path.join(process.cwd(), 'scripts/generate-llms/talks.js');

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
    `# ${title}\n\n${description}\n\n` + filteredSections.map(generateSectionMarkdown).join('')
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
      title: attributes.title || '',
      description: attributes.description || '',
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

  return title || pageName
    ? {
        title: title || pageName,
        url: `https://docs.expo.dev${pageHref}`,
        description,
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

  return items.length > 0 ? { title: group.name, items } : null;
}

function hasContent(section) {
  return section?.items?.length || section?.groups?.length || section?.sections?.length;
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

  (node.children || []).forEach(child => {
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

function generateVideoUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function processTalks(talks, type = 'video') {
  return talks.map(talk => {
    if (type === 'podcast' && talk.link) {
      return {
        title: talk.title,
        url: talk.link,
      };
    }

    return {
      title: talk.title,
      url: talk.videoId ? generateVideoUrl(talk.videoId) : '',
    };
  });
}

async function exportTalksData() {
  const { TALKS, PODCASTS, LIVE_STREAMS, YOUTUBE_VIDEOS } = await import('./talks.js');
  return {
    title: 'Additional Resources',
    description: 'Collection of talks, podcasts, and live streams from the Expo team',
    sections: [
      {
        title: 'Conference Talks',
        items: processTalks(TALKS),
        groups: [],
        sections: [],
      },
      {
        title: 'Podcasts',
        items: processTalks(PODCASTS, 'podcast'),
        groups: [],
        sections: [],
      },
      {
        title: 'Live Streams',
        items: processTalks(LIVE_STREAMS),
        groups: [],
        sections: [],
      },
      {
        title: 'YouTube Tutorials',
        items: processTalks(YOUTUBE_VIDEOS),
        groups: [],
        sections: [],
      },
    ],
  };
}

function compileTalksFile() {
  const inputFileContent = fs.readFileSync(TALKS_TS_PATH, 'utf8');
  const outputFileContent = ts.transpileModule(inputFileContent, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Node10,
    },
  }).outputText;

  fs.writeFileSync(TALKS_JS_PATH, outputFileContent, 'utf8');
  console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully compiled talks.ts to talks.js`);
}

export async function generateLlmsTxt() {
  try {
    compileTalksFile();

    const docSections = Object.values({ home, general, learn, eas, reference: reference.latest })
      .flat()
      .map(processSection)
      .filter(Boolean);
    const talksData = await exportTalksData();
    const allSections = [...docSections, ...talksData.sections];

    await fs.promises.writeFile(
      path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, OUTPUT_FILENAME_LLMS_TXT),
      generateFullMarkdown({
        title: TITLE,
        description: DESCRIPTION,
        sections: allSections,
      })
    );

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME_LLMS_TXT}`);
  } catch (error) {
    console.error('Error generating llms.txt:', error);
    throw error;
  }
}
