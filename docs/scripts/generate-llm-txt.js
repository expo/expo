import fs from 'fs';
import https from 'https';
import path from 'path';
import xml2js from 'xml2js';

const SITEMAP_URL = 'https://docs.expo.dev/sitemap.xml';
const TITLE = 'Expo Documentation';

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

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, response => {
        if (response.statusCode === 200) {
          let data = '';
          response.on('data', chunk => (data += chunk));
          response.on('end', () => resolve(data));
        } else {
          resolve(''); // Return empty string for non-200 responses
        }
      })
      .on('error', () => resolve('')); // Return empty string on error
  });
}

async function getPageMetadata(url) {
  try {
    const content = await fetchUrl(url);
    if (!content) return { title: '', description: '' };

    // Extract title
    let title = '';
    const titleMatch = content.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      title = titleMatch[1];

      // For SDK pages, special handling
      if (url.includes('/versions/latest/sdk/')) {
        // Extract just the first part before any " - " sequence
        title = title.split(' - ')[0];

        // Split and capitalize each word
        title = title
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else {
        // For non-SDK pages, just remove the "- Expo Documentation" suffix
        title = title.replace(' - Expo Documentation', '').trim();
      }
    }

    // Extract description
    let description = '';
    const metaMatch = content.match(/<meta\s+name="description"\s+content="([^"]+)"/);
    if (metaMatch) {
      description = metaMatch[1];
    } else {
      const pMatch = content.match(/<p>([^<]+)<\/p>/);
      if (pMatch) {
        description = pMatch[1];
      }
    }

    return { title, description };
  } catch (error) {
    console.error(`Error fetching metadata for ${url}:`, error);
    return { title: '', description: '' };
  }
}

async function generateDocsList() {
  try {
    const sitemapContent = await fetchUrl(SITEMAP_URL);
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(sitemapContent);

    let markdownContent = `# ${TITLE}\n\n`;

    const urlsBySection = {};
    Object.keys(SECTIONS).forEach(section => {
      urlsBySection[section] = [];
    });
    urlsBySection.other = [];

    // Process URLs and fetch metadata
    const urls = result.urlset.url.map(url => url.loc[0]);

    for (const url of urls) {
      // Skip URLs ending with /next-steps/
      if (url.endsWith('/next-steps/')) {
        continue;
      }

      // Skip any URL that contains /versions/ but doesn't contain /versions/latest/
      if (url.includes('/versions/') && !url.includes('/versions/latest/')) {
        continue;
      }

      const section = getSectionForUrl(url);
      const urlParts = new URL(url).pathname.split('/').filter(Boolean);

      const { title, description } = await getPageMetadata(url);

      urlsBySection[section].push({
        title: title || formatTitle(url),
        url: url,
        depth: urlParts.length,
        description: description,
      });

      console.log(`Processed: ${url}`);
    }

    // Generate markdown for each section
    Object.keys(SECTIONS).forEach(section => {
      if (urlsBySection[section].length > 0) {
        const sectionTitle = formatSectionTitle(section);
        markdownContent += `## ${sectionTitle}\n\n`;

        urlsBySection[section]
          .sort((a, b) => {
            if (a.depth !== b.depth) return a.depth - b.depth;
            return a.title.localeCompare(b.title);
          })
          .forEach(({ title, url, description, depth }) => {
            const indent = '  '.repeat(Math.max(0, depth - 3));
            markdownContent += `${indent}- [${title}](${url})\n`;
            if (description) {
              markdownContent += `${indent}  ${description}\n\n`;
            }
          });
        markdownContent += '\n';
      }
    });

    const outputPath = path.join(process.cwd(), 'public', 'expo-docs.md');
    fs.writeFileSync(outputPath, markdownContent);
    console.log('Successfully generated expo-docs.md');
    process.exit(0);
  } catch (error) {
    console.error('Error generating documentation list:', error);
    process.exit(1);
  }
}

// Helper functions remain the same
function formatTitle(url) {
  const urlPath = new URL(url).pathname;
  const parts = urlPath.split('/').filter(Boolean);

  if (parts.length === 0) return 'Home';

  const lastPart = parts[parts.length - 1];
  const secondLastPart = parts[parts.length - 2] || '';

  if (!lastPart) return 'Home';

  if (parts.includes('sdk')) {
    return `${lastPart} - ${secondLastPart}`;
  }

  if (lastPart.match(/^v\d+/)) return lastPart;

  return lastPart
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatSectionTitle(section) {
  const specialCases = {
    'get-started': 'Get Started',
    'core-concepts': 'Core Concepts',
    'general-faq': 'General FAQ',
    eas: 'EAS',
    sdk: 'SDK (Latest Version)',
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

function getSectionForUrl(url) {
  const urlPath = new URL(url).pathname;
  const pathParts = urlPath.split('/').filter(Boolean);

  // Special handling for get-started section
  if (pathParts[0] === 'get-started') {
    return 'get-started';
  }

  for (const [section, patterns] of Object.entries(SECTIONS)) {
    for (const pattern of patterns) {
      if (pattern === '') {
        if (pathParts.length <= 1) return section;
      } else if (section === 'get-started') {
        // Skip get-started section as it's handled above
        continue;
      } else if (urlPath.includes(`/${pattern}/`)) {
        return section;
      }
    }
  }
  return 'other';
}

generateDocsList();
