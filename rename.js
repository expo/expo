const fs = require('fs');
const path = require('path');

const transformRules = [
  {
    find: /EXUpdates(\w*)App/g,
    replace: 'EXSync$1',
    shouldTransformFilename: true,
  },
  {
    find: /EXUpdates(\w*)Update/g,
    replace: 'EXSync$1Manifest',
    shouldTransformFilename: true,
  },
  {
    find: /EXUpdates(?=\w)/g,
    replace: 'EXSync',
    shouldTransformFilename: true,
  },
  {
    find: /EXAppLoaderExpoUpdates/g,
    replace: 'EXAppLoaderNew',
    shouldTransformFilename: true,
  },
  {
    find: /\+Updates/g,
    replace: '+Sync',
    shouldTransformFilename: true,
  },
];

const transformSingleFile = async filename => {
  const dirname = path.dirname(filename);

  let fileString = fs.readFileSync(filename, 'utf8');
  let basename = path.basename(filename);
  for (const transform of transformRules) {
    if (transform.pathMatch && !transform.pathMatch.test(filename)) {
      continue;
    }
    fileString = fileString.replace(transform.find, transform.replace);
    if (transform.shouldTransformFilename) {
      basename = basename.replace(transform.find, transform.replace);
    }
  }

  const newFilename = path.join(dirname, basename);
  if (newFilename !== filename) {
    fs.unlinkSync(filename);
  }
  fs.writeFileSync(newFilename, fileString);
};

const directoryTransformRules = [
  {
    dirname: /EXUpdates/,
    find: /App/,
    replace: '',
  },
  {
    dirname: /EXUpdates/,
    find: /(?<!EX)Update(?!s)/,
    replace: 'Manifest',
  },
];

const transformDirectory = async directory => {
  for (const name of fs.readdirSync(directory)) {
    const fullPath = path.join(directory, name);
    if (fs.statSync(fullPath).isDirectory()) {
      await transformDirectory(fullPath);

      let transformedName = name;
      for (const transform of directoryTransformRules) {
        if (!transform.dirname.test(directory)) {
          continue;
        }
        transformedName = transformedName.replace(transform.find, transform.replace);
      }
      fs.renameSync(fullPath, path.join(directory, transformedName));
    } else if (name.endsWith('.h') || name.endsWith('.m') || name.endsWith('.mm')) {
      await transformSingleFile(fullPath);
    }
  }
};

(async function processFiles() {
  await transformDirectory('/Users/eric/expo/expo/packages/expo-updates/ios/EXUpdates/');
  await transformDirectory('/Users/eric/expo/expo/ios/Exponent/Kernel/');
  await transformDirectory('/Users/eric/expo/expo/ios/Exponent/Versioned/');
  await transformDirectory('/Users/eric/expo/expo/ios/versioned-react-native/');
})();
