// Copyright 2015-present 650 Industries. All rights reserved.

'use strict';

import fs from 'fs';
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

export {
  saveUrlToPathAsync,
  getManifestAsync,
  spawnAsyncThrowError,
  spawnAsync,
};
