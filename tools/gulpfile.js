'use strict';

const gulp = require('gulp');
const { resolve } = require('path');
const shell = require('gulp-shell');
const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs-extra');

const outdatedVendoredNativeModules = require('./outdated-vendored-native-modules');
const AndroidExpolib = require('./android-versioning/android-expolib');
const androidVersionLibraries = require('./android-versioning/android-version-libraries');

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
