'use strict';

require('instapromise');

let JsonFile = require('@exponent/json-file');

let path = require('path');
let promiseProps = require('promise-props');

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
  return promiseProps({
    sdkVersion: sdkVersionAsync(path.join(exponentPath, 'package.json')),
  });
}

exports.getProjectVersionsAsync = getProjectVersionsAsync;
