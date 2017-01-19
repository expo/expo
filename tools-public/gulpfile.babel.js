// Copyright 2015-present 650 Industries. All rights reserved.

'use strict';

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import username from 'username';

import gulp from 'gulp';
import shell from 'gulp-shell';
let argv = require('minimist')(process.argv.slice(2));

import { startReactNativeServer } from './react-native-tasks';
import { createAndroidShellApp } from './android-shell-app';
import { IosShellApp } from 'xdl';
let { createIOSShellAppAsync } = IosShellApp;
import { generateDynamicMacrosAsync, cleanupDynamicMacrosAsync, runFabricIOSAsync } from './generate-dynamic-macros';

const ptool = './ptool';
const _projects = './_projects';

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

  return createAndroidShellApp(argv);
}

function createIOSShellAppWithArguments() {
  return createIOSShellAppAsync(argv);
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

// iOS
gulp.task('ios-shell-app', createIOSShellAppWithArguments);

gulp.task('ptool', shell.task([`${ptool} ${_projects}`]));
gulp.task('ptool:watch', gulp.series('ptool', 'watch'));
gulp.task('ptool:pause-watch', gulp.series('watch:stop', 'ptool', 'watch'));

gulp.task('react-native-server', startReactNativeServer);

gulp.task('generate-dynamic-macros', generateDynamicMacrosWithArguments);
gulp.task('cleanup-dynamic-macros', cleanupDynamicMacrosWithArguments);
gulp.task('run-fabric-ios', runFabricIOSWithArguments);
