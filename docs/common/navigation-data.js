// @preval

const path = require('path');
const fm = require('front-matter');
const fs = require('fs-extra');

// TODO(brentvatne): move this to navigation.js so it's all in one place!
// Map directories in a version directory to a section name
const DIR_MAPPING = {
  introduction: 'Conceptual Overview',
  guides: 'Guides',
  'managed-workflow': 'Managed Workflow',
  bare: 'Essentials',
  tutorials: 'Tutorials',
  sdk: 'Expo SDK',
  'react-native': 'React Native',
  'get-started': 'Get Started',
  tutorial: 'Tutorial',
  'next-steps': 'Next Steps',
  workflow: 'Fundamentals',
  distribution: 'Distributing Your App',
  expokit: 'ExpoKit',
};

const processUrl = path => {
  return path.replace(/^pages\//, '/').replace(/.mdx?$/, '');
};

const generateGeneralNavLinks = (path_, arr = null) => {
  const { name } = path.parse(path_);

  if (arr === null) {
    const initArr = [];

    // Make sure to add '/' at the end of index pages so that relative links in the markdown work correctly
    const href = fs.existsSync(path.join(path_, 'index.md')) ? processUrl(path_) + '/' : '';

    return {
      name: DIR_MAPPING[name.toLowerCase()],
      href,
      posts: generateGeneralNavLinks(path_, initArr),
    };
  }

  const items = fs.readdirSync(path_);
  for (var i = 0; i < items.length; i++) {
    const filePath = path.join(path_, items[i]);
    const { ext, name } = path.parse(filePath);
    // Only process markdown files that are not index pages
    if (ext === '.md' && name !== 'index') {
      try {
        const title = fm(fs.readFileSync(filePath, 'utf8')).attributes.title;
        const sidebarTitle = fm(fs.readFileSync(filePath, 'utf8')).attributes.sidebar_title;
        const obj = {
          name: title,
          sidebarTitle,
          href: processUrl(filePath),
        };
        arr.push(obj);
      } catch (e) {
        console.log(`Error reading frontmatter of ${filePath}`, e);
      }
    }
  }

  return arr;
};

const generateReferenceNavLinks = (path_, arr) => {
  const items = fs.readdirSync(path_);

  for (var i = 0; i < items.length; i++) {
    const filePath = path.join(path_, items[i]);
    if (fs.statSync(filePath).isDirectory()) {
      const { name } = path.parse(filePath);
      const initArr = [];

      // Make sure to add '/' at the end of index pages so that relative links in the markdown work correctly
      const href = fs.existsSync(path.join(filePath, 'index.md')) ? processUrl(filePath) + '/' : '';

      arr.push({
        name: DIR_MAPPING[name.toLowerCase()],
        href,
        posts: generateReferenceNavLinks(filePath, initArr),
      });
    } else {
      const { ext, name } = path.parse(filePath);
      // Only process markdown files that are not index pages
      if (ext === '.md' && name !== 'index') {
        try {
          const title = fm(fs.readFileSync(filePath, 'utf8')).attributes.title;
          const sidebarTitle = fm(fs.readFileSync(filePath, 'utf8')).attributes.sidebar_title;
          const obj = {
            name: title,
            sidebarTitle,
            href: processUrl(filePath),
          };
          arr.push(obj);
        } catch (e) {
          console.log(`Error reading frontmatter of ${filePath}`, e);
        }
      }
    }
  }

  return arr;
};

const REFERENCE_PATH_PREFIX = './pages/versions';
const referenceDirectories = fs
  .readdirSync(REFERENCE_PATH_PREFIX, { withFileTypes: true })
  .filter(f => f.isDirectory())
  .map(f => f.name);

const ROOT_PATH_PREFIX = './pages';
const generalDirectories = fs
  .readdirSync(ROOT_PATH_PREFIX, { withFileTypes: true })
  .filter(f => f.isDirectory())
  .map(f => f.name)
  .filter(name => name !== 'versions' && name !== 'api');

module.exports = {
  general: generalDirectories.map(directory =>
    generateGeneralNavLinks(`${ROOT_PATH_PREFIX}/${directory}`, null)
  ),
  reference: referenceDirectories.reduce(
    (obj, version) => ({
      ...obj,
      [version]: generateReferenceNavLinks(`${REFERENCE_PATH_PREFIX}/${version}`, []),
    }),
    {}
  ),
};
