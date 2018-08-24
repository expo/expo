// Copyright 2015-present 650 Industries. All rights reserved.
'use strict';

const child_process = require('child_process');
const path = require('path');
const util = require('util');
const fs = require('fs');

exports.startReactNativeServer = function startReactNativeServer(callback) {
  let rootPath = path.join(__dirname, '..');
  let reactNativePath = path.join(rootPath, 'react-native-lab/react-native/');
  let isInUniverse = true;
  try {
    if (!fs.statSync(reactNativePath).isDirectory()) {
      isInUniverse = false;
    }
  } catch (e) {
    isInUniverse = false;
  }

  if (!isInUniverse) {
    reactNativePath = path.join(rootPath, 'home/node_modules/react-native/');
  }

  let cliPath = path.join(reactNativePath, 'local-cli/cli.js');

  let exponentPath = rootPath;
  let exponentReactPath = path.join(exponentPath, 'home');
  let exponentAssetsPath = path.join(exponentPath, 'ios/Exponent/Images.xcassets');
  let exponentConfigPath = path.join(exponentReactPath, 'rn-cli.config.js');

  let serverArgs = [
    'start',
    //    '--root', exponentReactPath,
    //    '--assetRoots', exponentAssetsPath,
    '--config',
    exponentConfigPath,
    // '--reset-cache',
  ];
  if (isInUniverse) {
    let exponentTransformerPath = path.join(rootPath, 'react-native-lab/transformer.js');
    serverArgs.push('--transformer', exponentTransformerPath);
  }

  let serverOptions = {
    stdio: 'inherit',
    cwd: reactNativePath,
  };

  let serverProcess = child_process.fork(cliPath, serverArgs, serverOptions);

  serverProcess.on('error', function(error) {
    serverProcess.removeAllListeners();
    callback(error);
  });

  serverProcess.on('exit', function(code, signal) {
    serverProcess.removeAllListeners();
    if (code === 0) {
      callback(null, code);
    } else {
      let message = util.format('React Native server exited with code %d (%s)', code, signal);
      callback(new Error(message));
    }
  });
};
