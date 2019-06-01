'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { echo, exec, cp, find, rm, mkdir } = require('shelljs');
const escapeRegExp = require('lodash/escapeRegExp');

module.exports = function updateVendoredNativeModule(options) {
  options.recursive = options.recursive === undefined
    ? true
    : options.recursive;
  options.installableInManagedApps = options.installableInManagedApps === undefined
    ? true
    : options.installableInManagedApps;

  const TMP_DIR = path.join(os.tmpdir(), options.name);
  const REPO_URL = options.repoUrl;

  function findObjcFiles(dir, recursive) {
    const regex = recursive
      ? /.*\.[hmc]$/
      : new RegExp(
          `${escapeRegExp(dir.replace(/\\/g, '/'))}\\/[^\\/]+\\.[hmc]$`
        );
    return find(dir).filter(file => file.match(regex));
  }

  function findAndroidFiles(dir) {
    return find(dir).filter(file => file.match(/.*\.(java|kt)$/));
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

  function updateBundledNativeModules(updater) {
    echo('Updating bundledNativeModules.json...');
    let filename = path.join(__dirname, '../packages/expo/bundledNativeModules.json');
    let data = JSON.parse(fs.readFileSync(filename, 'utf8'));
    let json = JSON.stringify(updater(data), null, 2);
    fs.writeFileSync(filename, json + '\n');
  }

  let { argv } = options;

  const executeAndroid = (argv.android || argv.allPlatforms) && options.sourceAndroidPath && options.targetAndroidPath;
  const executeIOS = (argv.ios || argv.allPlatforms) && options.sourceIosPath && options.sourceIosPath;

  if (!(argv.ios || argv.android || argv.allPlatforms)) {
    echo(`Must specify --ios, --android, or --allPlatforms`);
    return Promise.reject();
  }

  echo(`Updating ${options.name} from GitHub...`);

  // Cleanup
  if (!options.skipCleanup) {
    rm('-rf', TMP_DIR);
  }

  exec(`git clone ${REPO_URL} ${TMP_DIR}`);
  if (argv.commit) {
    exec(`git checkout ${argv.commit}`, { cwd: TMP_DIR });
  }
  echo(`Using version at ${argv.commit || 'master'}`);

  // iOS
  if (executeIOS) {

    const TMP_IOS_DIR = path.join(TMP_DIR, options.sourceIosPath);
    const TARGET_IOS_DIR = path.resolve(
      __filename,
      `../../ios/Exponent/Versioned/Core/${options.targetIosPath}`
    );

    if(!options.skipCleanup) {
      echo(`Removing iOS files...`);
      rm('-rf', TARGET_IOS_DIR);
      mkdir('-p', TARGET_IOS_DIR);
    }
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
  if (executeAndroid) {
    
    const TMP_ANDROID_DIR = path.join(TMP_DIR, options.sourceAndroidPath);
    const TARGET_ANDROID_DIR = path.resolve(
      __filename,
      `../../android/expoview/src/main/java/versioned/host/exp/exponent/${options.targetAndroidPath}`
    );

    if(!options.skipCleanup) {
      echo(`Removing Android files...`);
      rm('-rf', TARGET_ANDROID_DIR);
      mkdir('-p', TARGET_ANDROID_DIR);
    }
    echo(`Copying Android files...`);
    let javaFiles = findAndroidFiles(TMP_ANDROID_DIR);
    for (let javaFile of javaFiles) {
      let javaFileRelativePath = path.relative(TMP_ANDROID_DIR, javaFile);
      let javaFileTargetPath = path.join(TARGET_ANDROID_DIR, javaFileRelativePath);
      mkdir('-p', path.dirname(javaFileTargetPath));
      cp(javaFile, javaFileTargetPath);
    }

    findAndroidFiles(TARGET_ANDROID_DIR).forEach(file => {
      renamePackageAndroid(file);
    });
  }

  updateBundledNativeModules(bundledNativeModules => {
    let { name, version } = JSON.parse(fs.readFileSync(path.join(TMP_DIR, 'package.json'), 'utf8'));
    if (options.installableInManagedApps) {
      bundledNativeModules[name] = `~${version}`;
      echo(`Updated ${name} version number in bundledNativeModules.json`);
    } else if (bundledNativeModules[name]) {
      delete bundledNativeModules[name];
      echo(`Removed non-installable package ${name} from bundledNativeModules.json`);
    }
    return bundledNativeModules;
  });

  echo(
    `Finished updating ${options.name}, make sure to update files in the Xcode project (if you updated iOS) ` +
      `(Exponent/Versioned/Modules/${options.targetIosPath}) and test that it still works. :)`
  );

  return Promise.resolve();
};
