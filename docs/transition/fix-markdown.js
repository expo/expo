const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const mkdirp = require('mkdirp');

// This is a one-time script used for copied over markdown files from Gatsby docs to next.js docs
// Makes a couple of straightforward regex replacements, and moves markdown files in the workflow section into a seperate directory

const ORIGINAL_PATH_PREFIX = 'versions';
const DESTINATION_PATH_PREFIX = 'versions';

const workflowFiles = [
  'advanced-expokit-topics.md',
  'building-standalone-apps.md',
  'configuration.md',
  'create-react-native-app.md',
  'debugging-host.png',
  'debugging.md',
  'detach.md',
  'developer-menu.png',
  'development-mode.md',
  'development-mode.png',
  'exp-cli.md',
  'expo-refresh.png',
  'expokit.md',
  'fetch-app-from-xde.png',
  'fetch-app-production.png',
  'genymotion-android-sdk-location.png',
  'genymotion-android-tools.png',
  'genymotion-configure-sdk.png',
  'genymotion.md',
  'glossary-of-terms.md',
  'how-expo-works.md',
  'icloud-entitlement.png',
  'linking.md',
  'logging.md',
  'publishing.md',
  'release-channels.md',
  'advanced-release-channels.md',
  'release-channels-pub-details-1.png',
  'release-channels-flowchart.png',
  'toggle-development-mode.png',
  'up-and-running.md',
  'upgrading-expo.md',
  'xde-logs-device-picker.png',
  'xde-logs.png',
];

const expokitFiles = [
  'advanced-expokit-topics.md',
  'icloud-entitlement.png',
  'expokit.md',
  'detach.md',
];

const distributionFiles = [
  { src: 'workflow/building-standalone-apps.md', dest: 'distribution/building-standalone-apps.md' },
  { src: 'guides/app-stores.md', dest: 'distribution/app-stores.md' },
  { src: 'workflow/release-channels.md', dest: 'distribution/release-channels.md' },
  {
    src: 'workflow/advanced-release-channels.md',
    dest: 'distribution/advanced-release-channels.md',
  },
  {
    src: 'workflow/release-channels-pub-details-1.png',
    dest: 'distribution/release-channels-pub-details-1.png',
  },
  {
    src: 'workflow/release-channels-flowchart.png',
    dest: 'distribution/release-channels-flowchart.png',
  },
];

const makeFixes = (markdown, name, version) => {
  if (name === 'facedetector' || name === 'camera' || name === 'glview') {
    markdown = markdown.replace(/\(_({.*})_\)/gi, (match, group1) => {
      return `(\`${group1}\`)`;
    });
  }

  // Convert sketch 'tags' to React components
  markdown = markdown.replace(
    /!\[(sketch|snack)\]\(([\w\-/@]+)\)/gi,
    '${<SnackEmbed snackId="$2" />}'
  );
  return markdown;
};

const processAllMarkdownFiles = (path_, version) => {
  try {
    let items = fs.readdirSync(path_);
    for (var i = 0; i < items.length; i++) {
      const filePath = path.join(path_, items[i]);
      if (fs.statSync(filePath).isDirectory()) {
        processAllMarkdownFiles(filePath, version);
      } else {
        const { ext, name } = path.parse(filePath);
        let destinationPath = filePath;
        mkdirp.sync(path.dirname(destinationPath));
        if (ext === '.md') {
          let markdown = fs.readFileSync(filePath, 'utf8');
          fs.writeFileSync(destinationPath, makeFixes(markdown, name, version), {
            overwrite: true,
          });
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
};

let versions = ['unversioned', 'v25', 'v24', 'v23', 'v22', 'v21', 'v20', `v19`, `v18`];

versions.forEach(version => {
  let pathPrefix =
    version === 'unversioned'
      ? `${ORIGINAL_PATH_PREFIX}/unversioned`
      : `${ORIGINAL_PATH_PREFIX}/${version}.0.0`;
  pathPrefix = path.resolve(pathPrefix);
  processAllMarkdownFiles(pathPrefix, version);

  pathPrefix =
    version === 'unversioned'
      ? `${DESTINATION_PATH_PREFIX}/unversioned`
      : `${DESTINATION_PATH_PREFIX}/${version}.0.0`;
  pathPrefix = path.resolve(pathPrefix);

  // Move markdown files from guides dir to workflow dir
  workflowFiles.forEach(filename => {
    if (fs.existsSync(`${pathPrefix}/guides/${filename}`)) {
      fs.moveSync(`${pathPrefix}/guides/${filename}`, `${pathPrefix}/workflow/${filename}`, {
        overwrite: true,
      });
    }
  });

  // For v24, also move appropriate files to the distribution and expokit files
  if (version === 'v24' || version === 'v25' || version === 'unversioned') {
    distributionFiles.forEach(filename => {
      const srcFile = `${pathPrefix}/${filename.src}`;
      const destFile = `${pathPrefix}/${filename.dest}`;
      if (fs.existsSync(srcFile)) {
        fs.moveSync(srcFile, destFile, { overwrite: true });
      }
    });

    expokitFiles.forEach(filename => {
      const srcFile = `${pathPrefix}/workflow/${filename}`;
      const destFile = `${pathPrefix}/expokit/${filename}`;

      if (fs.existsSync(srcFile)) {
        fs.moveSync(srcFile, destFile, { overwrite: true });
      }
    });
  }
});

console.log('Done fixing markdown');
