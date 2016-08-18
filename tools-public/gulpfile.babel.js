// Copyright 2015-present 650 Industries. All rights reserved.

'use strict';

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import ngrok from 'ngrok';
import username from 'username';

import gulp from 'gulp';
import shell from 'gulp-shell';
let argv = require('minimist')(process.argv.slice(2));

import { startReactNativeServer } from './react-native-tasks';
import { createAndroidShellApp } from './android-shell-app';
import { createIOSShellAppAsync } from './ios-shell-app';
import { generateDynamicMacrosAsync, cleanupDynamicMacrosAsync, runFabricIOSAsync } from './generate-dynamic-macros';

const ptool = './ptool';
const _projects = './_projects';
const kernelNgrokFile = '.kernel-ngrok-url';

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


gulp.task('kernel-ngrok:clean', function(done) {
  if (fs.existsSync(kernelNgrokFile)) {
    fs.unlinkSync(kernelNgrokFile);
    done();
  }
});

gulp.task('kernel-ngrok', async function(done) {
  let user = await username();
  let hostname = [Math.ceil(10000 * Math.random()).toString(16), 'kernel', user.toLowerCase(), 'exp.pub'].join('.');
  let url = await ngrok.promise.connect({
    hostname,
    port: 8081,
  });
  url = url.replace(/^https/, 'http');
  console.log(`Started ngrok at url: ${url}`);

  fs.writeFile(kernelNgrokFile, url);

  process.on('exit', gulp.series('kernel-ngrok:clean'));
  process.on('SIGINT', gulp.series('kernel-ngrok:clean'));
});

// Shell app (android)
gulp.task('android-shell-app', createAndroidShellAppWithArguments);

// Shell app (ios)
gulp.task('ios-shell-app', createIOSShellAppWithArguments);

gulp.task('ptool', shell.task([`${ptool} ${_projects}`]));
gulp.task('ptool:watch', gulp.series('ptool', 'watch'));
gulp.task('ptool:pause-watch', gulp.series('watch:stop', 'ptool', 'watch'));

gulp.task('react-native-server', startReactNativeServer);

gulp.task('generate-dynamic-macros', generateDynamicMacrosWithArguments);
gulp.task('cleanup-dynamic-macros', cleanupDynamicMacrosWithArguments);
gulp.task('run-fabric-ios', runFabricIOSWithArguments);

// Used to also run 'ptool:watch' here but was causing issues
gulp.task('default', gulp.parallel('react-native-server'));
