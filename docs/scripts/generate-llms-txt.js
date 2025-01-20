import startCase from 'lodash/startCase.js';
import fs from 'node:fs';
import path from 'node:path';

const DOCS_DIR = 'pages';
const OUTPUT_FILENAME = 'llms.txt';
const TITLE = 'Expo Documentation';
const DESCRIPTION =
  'Expo is an open-source React Native framework for apps that run natively on Android, iOS, and the web. Expo brings together the best of mobile and the web and enables many important features for building and scaling an app such as live updates, instantly sharing your app, and web support. The company behind Expo also offers Expo Application Services (EAS), which are deeply integrated cloud services for Expo and React Native apps.';

const SECTIONS = {
  'get-started': ['get-started'],
  'core-concepts': ['core-concepts'],
  develop: ['develop', 'user-interface', 'config-plugins', 'debugging'],
  deploy: ['deploy'],
  review: ['review'],
  guides: ['guides', 'workflow', 'troubleshooting'],
  learn: ['tutorial', 'additional-resources'],
  reference: ['versions', 'technical-specs', 'more'],
  'push-notifications': ['push-notifications'],
  router: ['router'],
  'expo-modules': ['modules', 'module-api'],
  sdk: ['versions/latest/sdk'],
  eas: [
    'eas',
    'build',
    'app-signing',
    'build-reference',
    'submit',
    'eas-update',
    'eas-insights',
    'distribution',
    'custom-builds',
    'eas-workflows',
    'billing',
    'accounts',
  ],
  faq: ['faq'],
};

function extractFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\S\s]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {};
  }

  const frontmatter = match[1];
  const metadata = {};

  frontmatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      metadata[key.trim()] = valueParts.join(':').trim();
    }
  });

  return metadata;
}

function readMDXFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const metadata = extractFrontmatter(content);
    return {
      title: metadata.title ?? '',
      description: metadata.description ?? '',
    };
  } catch (error) {
    console.error(`Error reading MDX file ${filePath}:`, error);
    return { title: '', description: '' };
  }
}

function getSectionForPath(filePath) {
  const relativePath = path.relative(DOCS_DIR, filePath);
  const pathParts = relativePath.split(path.sep);

  const baseFilename = path.basename(filePath, '.mdx');
  if (baseFilename === 'core-concepts') {
    return 'core-concepts';
  }
  if (baseFilename === 'faq') {
    return 'faq';
  }
  if (pathParts[0] === 'get-started') {
    return 'get-started';
  }

  for (const [section, patterns] of Object.entries(SECTIONS)) {
    if (
      patterns.some(pattern => pathParts.slice(0, pattern.split('/').length).join('/') === pattern)
    ) {
      return section;
    }
  }

  return 'other';
}

function shouldIncludePath(filePath) {
  const relativePath = path.relative(DOCS_DIR, filePath);
  if (!relativePath.startsWith('versions')) {
    return true;
  }
  if (relativePath.includes('latest')) {
    return true;
  }
  return !(
    /versions\/v\d+\.\d+\.\d+/.test(relativePath) || relativePath.includes('versions/unversioned')
  );
}

function formatTitle(urlPath) {
  const parts = urlPath.split('/').filter(Boolean);
  return parts.length === 0 ? 'Home' : startCase(parts.at(-1));
}

function formatSectionTitle(section) {
  const specialCases = {
    'get-started': 'Get Started',
    'core-concepts': 'Core Concepts',
    eas: 'EAS',
    'expo-modules': 'Expo Modules API',
    'push-notifications': 'Push Notifications',
    faq: 'FAQs',
  };
  return specialCases[section] || startCase(section);
}

function walkDir(urlsBySection, currentPath = DOCS_DIR, depth = 0) {
  fs.readdirSync(currentPath).forEach(file => {
    const filePath = path.join(currentPath, file);
    if (!shouldIncludePath(filePath)) {
      return;
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(urlsBySection, filePath, depth + 1);
      return;
    }

    if (file.endsWith('.mdx')) {
      const section = getSectionForPath(filePath);
      const { title, description } = readMDXFile(filePath);
      const urlPath = path
        .relative(DOCS_DIR, filePath)
        .replace(/\.mdx$/, '')
        .replace(/index$/, '')
        .replace(/\\/g, '/');

      (urlsBySection[section] = urlsBySection[section] || []).push({
        title: title || formatTitle(urlPath),
        url: `https://docs.expo.dev/${urlPath}`,
        description,
        depth: depth + 1,
      });
    }
  });
}

function generateMarkdownContent({ title, description, sections, urlsBySection }) {
  return Object.keys(sections).reduce((content, section) => {
    if (!urlsBySection[section]?.length) {
      return content;
    }

    return (
      content +
      `## ${formatSectionTitle(section)}\n\n` +
      urlsBySection[section]
        .sort((a, b) => (a.depth !== b.depth ? a.depth - b.depth : a.title.localeCompare(b.title)))
        .map(
          ({ title, url, description, depth }) =>
            `${'  '.repeat(Math.max(0, depth - 3))}- [${title}](${url})${description ? `: ${description}` : ''}`
        )
        .join('\n') +
      '\n\n'
    );
  }, `# ${title}\n\n${description}\n\n`);
}

async function generateLlmsTxt() {
  try {
    const urlsBySection = {};
    Object.keys(SECTIONS).forEach(section => {
      urlsBySection[section] = [];
    });
    urlsBySection.other = [];

    walkDir(urlsBySection);

    await fs.promises.writeFile(
      path.join(process.cwd(), 'public', OUTPUT_FILENAME),
      generateMarkdownContent({
        title: TITLE,
        description: DESCRIPTION,
        sections: SECTIONS,
        urlsBySection,
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
