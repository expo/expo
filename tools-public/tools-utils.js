// Copyright 2015-present 650 Industries. All rights reserved.

'use strict';

import fs from 'fs';
import path from 'path';
import request from 'request';
import spawnAsyncQuiet from '@exponent/spawn-async';

function saveUrlToPathAsync(url, path) {
  return new Promise(function(resolve, reject) {
    let stream = fs.createWriteStream(path);
    stream.on('close', () => {
      if (getFilesizeInBytes(path) < 10) {
        throw new Error(`{filename} is too small`);
      }
      resolve();
    });
    stream.on('error', reject);
    request(url).pipe(stream);
  });
}

function getFilesizeInBytes(path) {
  let stats = fs.statSync(path);
  let fileSizeInBytes = stats['size'];
  return fileSizeInBytes;
}

async function getManifestAsync(url, headers) {
  let requestOptions = {
    url: url.replace('exp://', 'http://') + '/index.exp',
    headers,
  };

  let response = await request.promise(requestOptions);
  let responseBody = response.body;
  console.log('Using manifest:', responseBody);
  let manifest = JSON.parse(responseBody);

  return manifest;
}

async function spawnAsyncThrowError(...args) {
  if (args.length === 2) {
    return spawnAsyncQuiet(args[0], args[1], {
      stdio: 'inherit',
      cwd: __dirname,
    });
  } else {
    return spawnAsyncQuiet(...args);
  }
}

async function spawnAsync(...args) {
  try {
    return await spawnAsyncThrowError(...args);
  } catch (e) {
    console.error(e.message);
  }
}

async function modifyIOSPropertyListAsync(plistPath, plistName, transform) {
  let configPlistName = path.join(plistPath, `${plistName}.plist`);
  let configFilename = path.join(plistPath, `${plistName}.json`);

  // grab original plist as json object
  await spawnAsyncThrowError('plutil', ['-convert', 'json', configPlistName, '-o', configFilename]);
  let configContents = await fs.promise.readFile(configFilename, 'utf8');
  let config;

  try {
    config = JSON.parse(configContents);
  } catch (e) {
    console.log(`Error parsing ${configFilename}`, e);
    console.log('The erroneous file contents was:', configContents);
    config = {};
  }

  // apply transformation
  config = transform(config);

  // back up old plist and swap in modified one
  await spawnAsyncThrowError('/bin/cp', [configPlistName, `${configPlistName}.bak`]);
  await fs.promise.writeFile(configFilename, JSON.stringify(config));
  await spawnAsyncThrowError('plutil', ['-convert', 'xml1', configFilename, '-o', configPlistName]);
  return;
}

async function cleanIOSPropertyListBackupAsync(plistPath, plistName, restoreOriginal = true) {
  let configPlistName = path.join(plistPath, `${plistName}.plist`);
  let configFilename = path.join(plistPath, `${plistName}.json`);

  if (restoreOriginal) {
    await spawnAsyncThrowError('/bin/cp', [`${configPlistName}.bak`, configPlistName]);
  }

  await spawnAsyncThrowError('/bin/rm', [`${configPlistName}.bak`]);
  await spawnAsyncThrowError('/bin/rm', [configFilename]);
  return;
}

export {
  saveUrlToPathAsync,
  getManifestAsync,
  spawnAsyncThrowError,
  spawnAsync,
  modifyIOSPropertyListAsync,
  cleanIOSPropertyListBackupAsync,
};
