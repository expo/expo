// Copyright 2015-present 650 Industries. All rights reserved.
'use strict';

require('instapromise');

const path = require('path');
const JsonFile = require('@exponent/json-file');
const mux = require('@expo/mux');

function sdkVersionAsync(packageJsonFilePath) {
  return new JsonFile(packageJsonFilePath).getAsync('exp').then(exp => {
    if (!exp.hasOwnProperty('sdkVersion')) {
      throw new Error(`SDK version is missing from the project's package.json file`);
    }
    return exp.sdkVersion;
  });
}

function getProjectVersionsAsync() {
  let exponentPath = path.join(__dirname, '..');
  return mux({
    sdkVersion: sdkVersionAsync(path.join(exponentPath, 'package.json')),
  });
}

exports.getProjectVersionsAsync = getProjectVersionsAsync;
