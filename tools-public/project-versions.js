// Copyright 2015-present 650 Industries. All rights reserved.
'use strict';

const path = require('path');
const JsonFile = require('@expo/json-file').default;
const mux = require('@expo/mux');

const EXPONENT_DIR = process.env.EXPONENT_DIR || path.join(__dirname, '..');

function sdkVersionAsync(packageJsonFilePath) {
  return new JsonFile(packageJsonFilePath).getAsync('exp').then(exp => {
    if (!exp.hasOwnProperty('sdkVersion')) {
      throw new Error(
        `SDK version is missing from the project's package.json file`
      );
    }
    return exp.sdkVersion;
  });
}

function getProjectVersionsAsync() {
  return mux({
    sdkVersion: sdkVersionAsync(path.join(EXPONENT_DIR, 'package.json')),
  });
}

exports.getProjectVersionsAsync = getProjectVersionsAsync;
