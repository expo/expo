const path = require('path');
const fs = require('fs-extra');
const jsonfile = require('jsonfile');

const generatePage = require('./generatePage');
const generateNavLinks = require('./generateNav');

const ORIGINAL_PATH_PREFIX = './versions';
const DESTINATION_PATH_PREFIX = './pages/versions';

const generateJsFromMd = path_ => {
  let items = fs.readdirSync(path_);

  for (var i = 0; i < items.length; i++) {
    const filePath = path.join(path_, items[i]);
    if (fs.statSync(filePath).isDirectory()) {
      generateJsFromMd(filePath);
    } else {
      const { ext, name } = path.parse(filePath);
      if (ext === '.md') {
        const relativePath = path
          .resolve(filePath)
          .replace(path.resolve(ORIGINAL_PATH_PREFIX) + '/', '');
        generatePage(path.dirname(relativePath), name);
      } else {
        const relativePath = path
          .resolve(filePath)
          .replace(path.resolve(ORIGINAL_PATH_PREFIX) + '/', '');
        fs.ensureDirSync(`./static/images/generated`);
        fs.copySync(filePath, `./static/images/generated/${relativePath}`);
      }
    }
  }
};

let versions = fs.readdirSync(ORIGINAL_PATH_PREFIX);

// Compile all files initially

console.time('initial compile');

const navigationData = [];

versions.forEach(dir => {
  if (!fs.lstatSync(`${ORIGINAL_PATH_PREFIX}/${dir}`).isDirectory()) return;
  const version = dir === 'unversioned' ? 'unversioned' : dir.replace('.0.0', '');

  fs.emptyDirSync(`${DESTINATION_PATH_PREFIX}/${dir}`);

  console.log(`Processing markdown files in ${dir}`);
  generateJsFromMd(`${ORIGINAL_PATH_PREFIX}/${dir}`);

  navigationData.push({
    version,
    navigation: generateNavLinks(`${ORIGINAL_PATH_PREFIX}/${dir}`, []),
  });
});

console.log(`Generating navigation JSON, writing to ./navigation-data.json`);
jsonfile.writeFileSync(`./navigation-data.json`, navigationData);

console.log(`Create an index page under pages/version`);
fs.writeFileSync(
  `${DESTINATION_PATH_PREFIX}/index.js`,
  `
import redirect from '~/lib/redirect';
export default redirect('/versions/latest');
`
);

console.timeEnd('initial compile');

// Watch for changes in directory

if (process.argv.length < 3) {
  fs.watch(`${ORIGINAL_PATH_PREFIX}`, { recursive: true }, (eventType, filename) => {
    let filePath = path.join(`${ORIGINAL_PATH_PREFIX}`, filename);
    const { ext, name } = path.parse(filePath);
    if (ext === '.md') {
      const relativePath = path
        .resolve(filePath)
        .replace(path.resolve(ORIGINAL_PATH_PREFIX) + '/', '');
      console.log(`Processing changes for ${filePath} | ${path.dirname(relativePath)} | ${name}`);
      generatePage(path.dirname(relativePath), name);
    }
  });
}
