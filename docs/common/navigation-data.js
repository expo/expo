// @preval

const path = require('path');
const fm = require('front-matter');
const fs = require('fs-extra');

// TODO(brentvatne): move this to navigation.js so it's all in one place!
// Map directories in a version directory to a section name
const DIR_MAPPING = {
  introduction: 'Introduction',
  guides: 'Guides',
  'managed-workflow': 'Managed Workflow',
  bare: 'Essentials',
  tutorials: 'Tutorials',
  sdk: 'Expo SDK',
  'react-native': 'React Native',
  'get-started': 'Get Started',
  'next-steps': 'Next Steps',
  workflow: 'Fundamentals',
  distribution: 'Distributing Your App',
  expokit: 'ExpoKit',
};

const generateNavLinks = (path_, arr) => {
  let items = fs.readdirSync(path_);

  let processUrl = path => {
    let newPath = path.replace(/^pages\/versions/, '/versions').replace(/.mdx?$/, '');
    return newPath;
  };

  for (var i = 0; i < items.length; i++) {
    const filePath = path.join(path_, items[i]);
    if (fs.statSync(filePath).isDirectory()) {
      const { name } = path.parse(filePath);
      let initArr = [];

      // Make sure to add '/' at the end of index pages so that relative links in the markdown work correctly
      let href = fs.existsSync(path.join(filePath, 'index.md')) ? processUrl(filePath) + '/' : '';

      // 'Introduction' section has a 'Getting to know Expo' page that's actually at the root i.e. `/versions/v25.0/`, etc.
      if (name === 'introduction') {
        let rootPath = path_.replace('./pages', '');
        // TODO: find what's eating the final slash
        initArr.push({ name: 'What is Expo?', href: rootPath + '//' });
      }

      arr.push({
        name: DIR_MAPPING[name.toLowerCase()],
        href,
        posts: generateNavLinks(filePath, initArr),
      });
    } else {
      const { ext, name } = path.parse(filePath);
      // Only process markdown files that are not index pages
      if (ext === '.md' && name !== 'index') {
        try {
          let title = fm(fs.readFileSync(filePath, 'utf8')).attributes.title;
          let sidebarTitle = fm(fs.readFileSync(filePath, 'utf8')).attributes.sidebar_title;
          let obj = {
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

const ORIGINAL_PATH_PREFIX = './pages/versions';

let versionDirectories = fs
  .readdirSync(ORIGINAL_PATH_PREFIX, { withFileTypes: true })
  .filter(f => f.isDirectory())
  .map(f => f.name);

module.exports = versionDirectories.reduce(
  (obj, version) => ({
    ...obj,
    [version]: generateNavLinks(`${ORIGINAL_PATH_PREFIX}/${version}`, []),
  }),
  {}
);
