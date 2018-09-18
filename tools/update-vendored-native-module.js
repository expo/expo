'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { echo, exec, cp, find, rm, mkdir } = require('shelljs');
const escapeRegExp = require('lodash.escaperegexp');

module.exports = function updateVendoredNativeModule(options) {
  options.recursive = options.recursive === undefined
    ? true
    : options.recursive;

  const TMP_DIR = path.join(os.tmpdir(), options.name);
  const TMP_IOS_DIR = path.join(TMP_DIR, options.sourceIosPath);
  const TMP_ANDROID_DIR = path.join(TMP_DIR, options.sourceAndroidPath);
  const REPO_URL = options.repoUrl;
  const TARGET_IOS_DIR = path.resolve(
    __filename,
    `../../ios/Exponent/Versioned/Core/${options.targetIosPath}`
  );
  const TARGET_ANDROID_DIR = path.resolve(
    __filename,
    `../../android/expoview/src/main/java/versioned/host/exp/exponent/${options.targetAndroidPath}`
  );

  function findObjcFiles(dir, recursive) {
    const regex = recursive
      ? /.*\.[hmc]$/
      : new RegExp(
          `${escapeRegExp(dir.replace(/\\/g, '/'))}\\/[^\\/]+\\.[hmc]$`
        );
    return find(dir).filter(file => file.match(regex));
  }

  function findJavaFiles(dir) {
    return find(dir).filter(file => file.match(/.*\.java$/));
  }

  function renamePackageAndroid(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Note: this only works for a single package. If react-native-svg separates
    // its code into multiple packages we will have to do something more
    // sophisticated here.
    content = content.replace(
      new RegExp(options.sourceAndroidPackage, 'g'),
      options.targetAndroidPackage
    );

    fs.writeFileSync(file, content, 'utf8');
  }

  function renameIOSSymbols(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Do something more sophisticated if this causes issues with more complex
    // modules.
    content = content.replace(new RegExp(`${options.iosPrefix}`, 'g'), 'EX');

    let newFileName = file.replace(options.iosPrefix, 'EX');
    fs.writeFileSync(newFileName, content, 'utf8');
    rm(file);
  }

  let { argv } = options;

  if (!(argv.ios || argv.android || argv.allPlatforms)) {
    echo(`Must specify --ios, --android, or --allPlatforms`);
    return Promise.reject();
  }

  echo(`Updating ${options.name} from GitHub...`);

  // Cleanup
  if (!options.skipCleanup) {
    rm('-rf', TMP_DIR);
    if (argv.ios || argv.allPlatforms) {
      rm('-rf', TARGET_IOS_DIR);
      mkdir('-p', TARGET_IOS_DIR);
    }
    if (argv.android || argv.allPlatforms) {
      rm('-rf', TARGET_ANDROID_DIR);
      mkdir('-p', TARGET_ANDROID_DIR);
    }
  }

  exec(`git clone ${REPO_URL} ${TMP_DIR}`);
  if (argv.commit) {
    exec(`git checkout ${argv.commit}`, { cwd: TMP_DIR });
  }
  echo(`Using version at ${argv.commit || 'master'}`);

  // iOS
  if (argv.ios || argv.allPlatforms) {
    echo(`Copying iOS files...`);
    let objcFiles = findObjcFiles(TMP_IOS_DIR, options.recursive);
    for (let objcFile of objcFiles) {
      let objcFileRelativePath = path.relative(TMP_IOS_DIR, objcFile);
      let objcFileTargetPath = path.join(TARGET_IOS_DIR, objcFileRelativePath);
      mkdir('-p', path.dirname(objcFileTargetPath));
      cp(objcFile, objcFileTargetPath);
    }

    if (options.iosPrefix) {
      echo(`Updating classes prefix from ${options.iosPrefix} to EX`);
      findObjcFiles(TARGET_IOS_DIR, options.recursive).forEach(
        renameIOSSymbols
      );
    }
  }

  // Android
  if (argv.android || argv.allPlatforms) {
    echo(`Copying Android files...`);
    let javaFiles = findJavaFiles(TMP_ANDROID_DIR);
    for (let javaFile of javaFiles) {
      let javaFileRelativePath = path.relative(TMP_ANDROID_DIR, javaFile);
      let javaFileTargetPath = path.join(TARGET_ANDROID_DIR, javaFileRelativePath);
      mkdir('-p', path.dirname(javaFileTargetPath));
      cp(javaFile, javaFileTargetPath);
    }

    findJavaFiles(TARGET_ANDROID_DIR).forEach(file => {
      renamePackageAndroid(file);
    });
  }

  echo(
    `Finished updating ${options.name}, make sure to update files in the Xcode project (if you updated iOS) ` +
      `(Exponent/Versioned/Modules/${options.targetIosPath}) and test that it still works. :)`
  );

  return Promise.resolve();
};
