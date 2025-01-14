import fs from 'fs';
import path from 'path';

const DOCS_DIR = 'pages';
const OUTPUT_FILENAME = 'llms-full.txt';
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
  router: ['router'],
  'expo-modules': ['modules', 'module-api'],
  'push-notifications': ['push-notifications'],
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
  'general-faq': ['faq'],
};

function extractContent(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) return { metadata: {}, content };

  const frontmatter = match[1];
  const metadata = {};

  frontmatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      metadata[key.trim()] = valueParts.join(':').trim();
    }
  });

  const mainContent = content.replace(frontmatterRegex, '').trim();

  return { metadata, content: mainContent };
}

function readMDXFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return extractContent(content);
  } catch (error) {
    console.error(`Error reading MDX file ${filePath}:`, error);
    return { metadata: {}, content: '' };
  }
}

function getSectionForPath(filePath) {
  const relativePath = path.relative(DOCS_DIR, filePath);
  const pathParts = relativePath.split(path.sep);

  const baseFilename = path.basename(filePath, '.mdx');
  if (baseFilename === 'core-concepts') return 'core-concepts';
  if (baseFilename === 'faq') return 'general-faq';

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

async function generateLlmsFullTxt() {
  try {
    let fullContent = `# ${TITLE}\n\n${DESCRIPTION}\n\n`;
    const contentBySection = {};

    Object.keys(SECTIONS).forEach(section => {
      contentBySection[section] = [];
    });
    contentBySection.other = [];

    // eslint-disable-next-line no-inner-declarations
    function walkDir(currentPath) {
      const files = fs.readdirSync(currentPath);

      for (const file of files) {
        const filePath = path.join(currentPath, file);
        const stat = fs.statSync(filePath);

        if (!shouldIncludePath(filePath)) {
          continue;
        }

        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.mdx')) {
          const section = getSectionForPath(filePath);
          const { metadata, content } = readMDXFile(filePath);
          const relativePath = path.relative(DOCS_DIR, filePath);

          contentBySection[section].push({
            title: metadata.title || formatTitle(relativePath),
            content,
            path: relativePath,
          });
        }
      }
    }

    walkDir(DOCS_DIR);

    Object.keys(SECTIONS).forEach(section => {
      if (contentBySection[section].length > 0) {
        const sectionTitle = formatSectionTitle(section);
        fullContent += `\n# ${sectionTitle}\n\n`;

        contentBySection[section]
          .sort((a, b) => a.path.localeCompare(b.path))
          .forEach(({ title, content }) => {
            fullContent += `## ${title}\n\n${content}\n\n`;
          });
      }
    });

    const outputPath = path.join(process.cwd(), 'public', OUTPUT_FILENAME);
    fs.writeFileSync(outputPath, fullContent);
    console.log(`Successfully generated ${OUTPUT_FILENAME}`);
    process.exit(0);
  } catch (error) {
    console.error('Error concatenating documentation:', error);
    process.exit(1);
  }
}

// Helper function for formatting titles from paths
function formatTitle(urlPath) {
  const parts = urlPath.split('/').filter(Boolean);
  if (parts.length === 0) return 'Home';

  const lastPart = parts[parts.length - 1];
  return lastPart
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

generateLlmsFullTxt();
