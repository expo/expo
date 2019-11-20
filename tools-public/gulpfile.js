// Copyright 2015-present 650 Industries. All rights reserved.
'use strict';

const gulp = require('gulp');
const minimist = require('minimist');
const { ImageUtils, IosShellApp } = require('@expo/xdl');

const argv = minimist(process.argv.slice(2));

function createIOSShellAppWithArguments() {
  setImageFunctions();

  if (argv.action === 'build') {
    return IosShellApp.buildAndCopyArtifactAsync(argv);
  } else if (argv.action === 'configure') {
    return IosShellApp.configureAndCopyArchiveAsync(argv);
  } else if (argv.action === 'create-workspace') {
    return IosShellApp.createTurtleWorkspaceAsync(argv);
  } else {
    throw new Error(`Unsupported action '${argv.action}'.`);
  }
}

function setImageFunctions() {
  const { resizeIconWithSharpAsync, getImageDimensionsWithSharpAsync } = require('./image-helpers');
  console.info('ImageUtils: setting image functions to alternative sharp implementations');
  ImageUtils.setResizeImageFunction(resizeIconWithSharpAsync);
  ImageUtils.setGetImageDimensionsFunction(getImageDimensionsWithSharpAsync);
}

// iOS
gulp.task('ios-shell-app', createIOSShellAppWithArguments);
