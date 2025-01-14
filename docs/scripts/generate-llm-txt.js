import fs from 'fs';
import path from 'path';

const DOCS_DIR = 'pages';
const TITLE = 'Expo Documentation';
const DESCRIPTION =
  'Expo is an open-source React Native framework for apps that run natively on Android, iOS, and the web. Expo brings together the best of mobile and the web and enables many important features for building and scaling an app such as live updates, instantly sharing your app, and web support. The company behind Expo also offers Expo Application Services (EAS), which are deeply integrated cloud services for Expo and React Native apps.';

const SECTIONS = {
  'get-started': ['get-started'],
  'core-concepts': ['core-concepts'],
  'general-faq': ['faq'],
  develop: ['develop', 'user-interface', 'config-plugins', 'debugging'],
  deploy: ['deploy'],
  review: ['review'],
  guides: ['guides', 'workflow', 'troubleshooting'],
  learn: ['tutorial', 'additional-resources'],
  reference: ['versions', 'technical-specs', 'more'],
  router: ['router'],
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
  'expo-modules': ['modules', 'module-api'],
  'push-notifications': ['push-notifications'],
};

function extractFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) return {};

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
      title: metadata.title || '',
      description: metadata.description || '',
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
  if (baseFilename === 'core-concepts') return 'core-concepts';
  if (baseFilename === 'faq') return 'general-faq';

  // Handle "get-started" section because there are
  // multiple files that includes "/get-started/"
  if (pathParts[0] === 'get-started') {
    return 'get-started';
  }

  for (const [section, patterns] of Object.entries(SECTIONS)) {
    for (const pattern of patterns) {
      const patternParts = pattern.split('/');
      if (pathParts.slice(0, patternParts.length).join('/') === pattern) {
        return section;
      }
    }
  }
  return 'other';
}

function shouldIncludePath(filePath) {
  const relativePath = path.relative(DOCS_DIR, filePath);
  const pathParts = relativePath.split(path.sep);

  if (!pathParts[0] || pathParts[0] !== 'versions') {
    return true;
  }

  // For paths starting with "versions", only include "latest" versions
  if (pathParts[0] === 'versions') {
    if (relativePath.includes('latest')) {
      return true;
    }
    if (
      relativePath.match(/versions\/v\d+\.\d+\.\d+/) ||
      relativePath.includes('versions/unversioned')
    ) {
      return false;
    }
  }

  return true;
}

async function generateLlmsTxt() {
  try {
    let markdownContent = `# ${TITLE}\n\n${DESCRIPTION}\n\n`;
    const urlsBySection = {};

    Object.keys(SECTIONS).forEach(section => {
      urlsBySection[section] = [];
    });
    urlsBySection.other = [];

    // eslint-disable-next-line no-inner-declarations
    function walkDir(currentPath, depth = 0) {
      const files = fs.readdirSync(currentPath);

      for (const file of files) {
        const filePath = path.join(currentPath, file);
        const stat = fs.statSync(filePath);

        if (!shouldIncludePath(filePath)) {
          continue;
        }

        if (stat.isDirectory()) {
          walkDir(filePath, depth + 1);
        } else if (file.endsWith('.mdx')) {
          const section = getSectionForPath(filePath);
          const { title, description } = readMDXFile(filePath);

          const urlPath = path
            .relative(DOCS_DIR, filePath)
            .replace(/\.mdx$/, '')
            .replace(/index$/, '')
            .replace(/\\/g, '/');

          const url = `https://docs.expo.dev/${urlPath}`;

          urlsBySection[section].push({
            title: title || formatTitle(urlPath),
            url,
            description,
            depth: depth + 1,
          });
        }
      }
    }

    walkDir(DOCS_DIR);

    Object.keys(SECTIONS).forEach(section => {
      if (urlsBySection[section].length > 0) {
        const sectionTitle = formatSectionTitle(section);
        markdownContent += `## ${sectionTitle}\n\n`;

        urlsBySection[section]
          .sort((a, b) => {
            if (a.depth !== b.depth) return a.depth - b.depth;
            return a.title.localeCompare(b.title);
          })
          .forEach(({ title, url, description, depth }, index, array) => {
            const indent = '  '.repeat(Math.max(0, depth - 3));
            markdownContent += `${indent}- [${title}](${url})`;
            if (description) {
              markdownContent += `: ${description}`;
            }
            markdownContent += index < array.length - 1 ? '\n' : '';
          });
        markdownContent += '\n\n';
      }
    });

    const outputPath = path.join(process.cwd(), 'public', 'llms.txt');
    fs.writeFileSync(outputPath, markdownContent);
    console.log('Successfully generated llms.txt.');
    process.exit(0);
  } catch (error) {
    console.error('Error generating llms.txt:', error);
    process.exit(1);
  }
}

// Helper functions
function formatTitle(urlPath) {
  const parts = urlPath.split('/').filter(Boolean);
  if (parts.length === 0) return 'Home';

  const lastPart = parts[parts.length - 1];
  return lastPart
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatSectionTitle(section) {
  const specialCases = {
    'get-started': 'Get Started',
    'core-concepts': 'Core Concepts',
    eas: 'EAS',
    'general-faq': 'General FAQ',
    'expo-modules': 'Expo Modules API',
    'push-notifications': 'Push Notifications',
  };

  if (specialCases[section]) {
    return specialCases[section];
  }

  return section
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

generateLlmsTxt();
