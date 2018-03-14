// Copyright 2015-present 650 Industries. All rights reserved.
'use strict';

const assert = require('assert');
const fs = require('fs');
const gulp = require('gulp');
const shell = require('gulp-shell');
const minimist = require('minimist');
const path = require('path');
const { IosIcons, IosShellApp, AndroidShellApp } = require('xdl');

const { startReactNativeServer } = require('./react-native-tasks');
const {
  generateDynamicMacrosAsync,
  cleanupDynamicMacrosAsync,
  runFabricIOSAsync,
} = require('./generate-dynamic-macros');
const logger = require('./logger');

const ptool = './ptool';
const _projects = './_projects';

const argv = minimist(process.argv.slice(2));

/**
 * Reads a _projects file and returns the project paths in it.
 */
function pathsFromProjectsFile(projectsFile) {
  let projectPaths = [];
  let text = fs.readFileSync(projectsFile, 'utf8');
  let regex = /\nproject=([^\n]*)/gm;
  let match;
  while ((match = regex.exec(text))) {
    projectPaths.push(match[1]);
  }
  return projectPaths;
}

function generateDynamicMacrosWithArguments() {
  if (!argv.buildConstantsPath) {
    throw new Error('Must run with `--buildConstantsPath BUILD_CONSTANTS_PATH`');
  }

  if (!argv.platform) {
    throw new Error('Must run with `--platform PLATFORM`');
  }

  if (argv.platform === 'ios' && !argv.infoPlistPath) {
    throw new Error('iOS must run with `--infoPlistPath INFO_PLIST_PATH`');
  }

  return generateDynamicMacrosAsync(argv);
}

function cleanupDynamicMacrosWithArguments() {
  if (argv.platform === 'ios' && !argv.infoPlistPath) {
    throw new Error('iOS must run with `--infoPlistPath INFO_PLIST_PATH`');
  }

  return cleanupDynamicMacrosAsync(argv);
}

function runFabricIOSWithArguments() {
  if (!argv.fabricPath || !argv.iosPath) {
    throw new Error('Must run with `--fabricPath` and `--iosPath`');
  }

  return runFabricIOSAsync(argv);
}

function createAndroidShellAppWithArguments() {
  if (!argv.url) {
    throw new Error('Must run with `--url MANIFEST_URL`');
  }

  if (!argv.sdkVersion) {
    throw new Error('Must run with `--sdkVersion SDK_VERSION`');
  }

  return AndroidShellApp.createAndroidShellAppAsync(argv);
}

function updateAndroidShellAppWithArguments() {
  if (!argv.url) {
    throw new Error('Must run with `--url MANIFEST_URL`');
  }

  if (!argv.sdkVersion) {
    throw new Error('Must run with `--sdkVersion SDK_VERSION`');
  }

  return AndroidShellApp.updateAndroidShellAppAsync(argv);
}

function createIOSShellAppWithArguments() {
  const { resizeIconWithSharpAsync, getImageDimensionsWithSharpAsync } = require('./image-helpers');
  logger.info(
    { buildPhase: 'icons setup' },
    'IosIcons: setting image functions to alternative sharp implementations'
  );
  IosIcons.setResizeImageFunction(resizeIconWithSharpAsync);
  IosIcons.setGetImageDimensionsFunction(getImageDimensionsWithSharpAsync);
  return IosShellApp.createIOSShellAppAsync(argv);
}

let watcher = null;

gulp.task('watch', function(done) {
  assert(!watcher, 'gulp is already watching the Xcode projects');
  let projectPaths = pathsFromProjectsFile(_projects);
  let pbxprojPaths = projectPaths.map(function(projectPath) {
    return path.join('..', projectPath, 'project.pbxproj');
  });
  watcher = gulp.watch(pbxprojPaths, gulp.series('ptool:pause-watch'));
  done();
});

gulp.task('watch:stop', function(done) {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
  done();
});

// Shell app (android)
gulp.task('android-shell-app', createAndroidShellAppWithArguments);
gulp.task('update-android-shell-app', updateAndroidShellAppWithArguments);

// iOS
gulp.task('ios-shell-app', createIOSShellAppWithArguments);

gulp.task('ptool', shell.task([`${ptool} ${_projects}`]));
gulp.task('ptool:watch', gulp.series('ptool', 'watch'));
gulp.task('ptool:pause-watch', gulp.series('watch:stop', 'ptool', 'watch'));

gulp.task('react-native-server', startReactNativeServer);

gulp.task('generate-dynamic-macros', generateDynamicMacrosWithArguments);
gulp.task('cleanup-dynamic-macros', cleanupDynamicMacrosWithArguments);
gulp.task('run-fabric-ios', runFabricIOSWithArguments);
