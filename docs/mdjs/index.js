const path = require('path');
const fs = require('fs-extra');
const jsonfile = require('jsonfile');

const generatePage = require('./generate-page');
const generateNavLinks = require('./generate-navigation');

const ORIGINAL_PATH_PREFIX = './versions';
const DESTINATION_PATH_PREFIX = './pages/versions';

const generateJsFromMd = recursionPath => {
  let items = fs.readdirSync(recursionPath);

  for (var i = 0; i < items.length; i++) {
    const filePath = path.join(recursionPath, items[i]);
    if (fs.statSync(filePath).isDirectory()) {
      generateJsFromMd(filePath);
    } else {
      const { ext, name } = path.parse(filePath);
      const relativePath = path
        .resolve(filePath)
        .replace(path.resolve(ORIGINAL_PATH_PREFIX) + '/', '');
      generatePage(path.dirname(relativePath), name);
    }
  }
};

let versions = fs.readdirSync(ORIGINAL_PATH_PREFIX);

// Compile all files initially

console.time('Compiling *.md files to *.js');

const navigationData = [];

versions.forEach(dir => {
  if (!fs.lstatSync(`${ORIGINAL_PATH_PREFIX}/${dir}`).isDirectory()) return;
  const version = dir === 'unversioned' ? 'unversioned' : dir.replace('.0.0', '');

  fs.emptyDirSync(`${DESTINATION_PATH_PREFIX}/${dir}`);

  console.log(`Processing markdown files for version: ${dir}`);
  generateJsFromMd(`${ORIGINAL_PATH_PREFIX}/${dir}`);

  navigationData.push({
    version,
    navigation: generateNavLinks(`${ORIGINAL_PATH_PREFIX}/${dir}`, []),
  });
});

console.log(`Script is running from:                `, __dirname);
console.log(`Generating navigation-data.json at:    ./generated/navigation-data.json`);

// NOTE(jim): CircleCI seems to forget where it is? With __dirname the path begins where the
// mdjs script was executed.
jsonfile.writeFileSync(`${__dirname}/../generated/navigation-data.json`, navigationData);

console.log(`Generating index.js at:                ./pages/version`);
fs.writeFileSync(
  `${DESTINATION_PATH_PREFIX}/index.js`,
  `
import redirect from '~/common/redirect';

export default redirect('/versions/latest/');
`
);

console.timeEnd('Compiling *.md files to *.js');

// copy versions/v(latest version) to versions/latest
// (next only half-handles symlinks)
const LATEST_VERSION = 'v' + require('../package.json').version;
const vLatest = path.join(DESTINATION_PATH_PREFIX, LATEST_VERSION + "/");
const latest = path.join(DESTINATION_PATH_PREFIX, "latest/");
console.log(vLatest, latest);
fs.removeSync(latest)
fs.copySync(vLatest, latest)

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
