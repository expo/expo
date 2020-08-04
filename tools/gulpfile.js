'use strict';

const gulp = require('gulp');
const { resolve } = require('path');
const argv = require('minimist')(process.argv.slice(2));

const androidVersionLibraries = require('./android-versioning/android-version-libraries');

gulp.task('assert-abi-argument', function(done) {
  if (!argv.abi) {
    throw new Error('Must run with `--abi ABI_VERSION`');
  }

  done();
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
