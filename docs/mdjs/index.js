const path = require('path');
const fs = require('fs-extra');
const jsonfile = require('jsonfile');

const { VERSIONS } = require('../common/versions');
const generatePage = require('./generate-page');

const ORIGINAL_PATH_PREFIX = './versions';
const DESTINATION_PATH_PREFIX = './pages/versions';

const generateJsFromMd = recursionPath => {
  if (!fs.existsSync(recursionPath)) {
    return;
  }
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

// Compile all files initially
fs.emptyDirSync(DESTINATION_PATH_PREFIX);

VERSIONS.forEach(dir => generateJsFromMd(`${ORIGINAL_PATH_PREFIX}/${dir}`));

console.log(`Generating index.js at:                ./pages/version`);
fs.writeFileSync(
  `${DESTINATION_PATH_PREFIX}/index.js`,
  `
import redirect from '~/common/redirect';

export default redirect('/versions/latest/');
`
);

// copy versions/v(latest version) to versions/latest
// (Next.js only half-handles symlinks)
const LATEST_VERSION = 'v' + require('../package.json').version;
const vLatest = path.join(DESTINATION_PATH_PREFIX, LATEST_VERSION + '/');
const latest = path.join(DESTINATION_PATH_PREFIX, 'latest/');
fs.removeSync(latest);
fs.copySync(vLatest, latest);

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
