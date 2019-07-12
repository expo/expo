'use strict';

const gulp = require('gulp');
const { resolve } = require('path');
const shell = require('gulp-shell');
const argv = require('minimist')(process.argv.slice(2));
const { Modules } = require('@expo/xdl');
const chalk = require('chalk');
const fs = require('fs-extra');

const { renameJNILibsAsync, updateExpoViewAsync } = require('./android-tasks');
const outdatedVendoredNativeModules = require('./outdated-vendored-native-modules');
const AndroidExpolib = require('./android-versioning/android-expolib');
const androidVersionLibraries = require('./android-versioning/android-version-libraries');

function updateExpoViewWithArguments() {
  if (!argv.abi) {
    throw new Error('Run with `--abi <abi version>`');
  }
  return updateExpoViewAsync(argv.abi);
}

function renameJNILibsWithABIArgument() {
  if (!argv.abi) {
    throw new Error('Must run with `--abi ABI_VERSION`');
  }

  return renameJNILibsAsync(argv.abi);
}

function runShellScriptWithABIArgument(script) {
  return gulp.series('assert-abi-argument', shell.task([`${script} ${argv.abi}`]));
}

gulp.task('assert-abi-argument', function(done) {
  if (!argv.abi) {
    throw new Error('Must run with `--abi ABI_VERSION`');
  }

  done();
});

gulp.task(
  'android-update-rn',
  gulp.series(
    shell.task([`pushd ../android; ./gradlew :tools:execute --args='${argv.abi}'; popd`]),
    gulp.parallel(
      AndroidExpolib.namespaceExpolibImportsAsync,
      AndroidExpolib.namespaceExpolibGradleDependenciesAsync
    )
  )
);

// Versioning (android)
gulp.task(
  'android-update-versioned-rn',
  shell.task([
    'rm -rf ../android/versioned-react-native/{ReactAndroid,ReactCommon}',
    'cp -r ../android/ReactCommon ../android/versioned-react-native/ReactCommon',
    'cp -r ../android/ReactAndroid ../android/versioned-react-native/ReactAndroid',
  ])
);
gulp.task('android-rename-jni-libs', renameJNILibsWithABIArgument);
gulp.task('android-build-aar', runShellScriptWithABIArgument('./android-build-aar.sh'));
gulp.task(
  'android-copy-native-modules',
  runShellScriptWithABIArgument('./android-copy-native-modules.sh')
);
gulp.task(
  'android-copy-universal-modules',
  gulp.series(...Modules.getVersionableModulesForPlatform('android', argv.abi || 'UNVERSIONED').map(
    module => shell.task([
      `./android-copy-universal-module.sh ${argv.abi} ../packages/${module.libName}/${module.subdirectory}`
    ])
  ))
);
gulp.task('update-exponent-view', updateExpoViewWithArguments);
gulp.task(
  'android-add-rn-version',
  gulp.series(
    'android-update-versioned-rn',
    'android-rename-jni-libs',
    'android-build-aar',
    'android-copy-native-modules',
    'android-copy-universal-modules'
  )
);

// Update external dependencies
gulp.task('outdated-native-dependencies', async () => {
  const bundledNativeModules = JSON.parse(await fs.readFile('../packages/expo/bundledNativeModules.json', 'utf8'));
  const isModuleLinked = async packageName => await fs.pathExists(`../packages/${packageName}/package.json`);
  return await outdatedVendoredNativeModules({ bundledNativeModules, isModuleLinked });
});

gulp.task('android-jarjar-on-aar', androidVersionLibraries.runJarJarOnAAR);
gulp.task('android-version-libraries', androidVersionLibraries.versionLibrary);

const GENERATE_LIBRARY_WRAPPERS = 'android-generate-library-wrappers';

const versioningArgs = task => {
  const obj = {};
  Object.keys(argv).forEach(k => {
    if (k !== '_') {
      if (k === 'apiLevel') {
        obj[k] = argv[k];
      } else if (k === 'wrapLibraries' || k === 'wrapGroupIds') {
        obj[k] = argv[k].split(',').filter(s => s !== '');
      } else {
        obj[k] = resolve(argv[k]);
      }
    }
  });
  return obj;
};

gulp.task(GENERATE_LIBRARY_WRAPPERS, async () =>
  androidVersionLibraries.generateSharedObjectWrappers(versioningArgs(GENERATE_LIBRARY_WRAPPERS))
);
