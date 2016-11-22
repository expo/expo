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

function getAppleIconQualifier(iconSize, iconResolution) {
  let iconQualifier;
  if (iconResolution !== 1) {
    // e.g. "29x29@3x"
    iconQualifier = `${iconSize}x${iconSize}@${iconResolution}x`;
  } else {
    iconQualifier = `${iconSize}x${iconSize}`;
  }
  if (iconSize === 76 || iconSize === 83.5) {
    // ipad sizes require ~ipad at the end
    iconQualifier = `${iconQualifier}~ipad`;
  }
  return iconQualifier;
}

/**
 * Based on keys in the given manifest,
 * ensure that the proper iOS icon images exist -- assuming Info.plist already
 * points at them under CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles.
 *
 * This only works on MacOS (as far as I know) because it uses the sips utility.
 */
async function configureIOSIconsAsync(manifest, destinationIconPath) {
  let defaultIconFilename;
  if (manifest.iconUrl) {
     defaultIconFilename = 'exp-icon.png';
     await saveUrlToPathAsync(manifest.iconUrl, `${destinationIconPath}/${defaultIconFilename}`);
   }

  let iconSizes = [29, 40, 60, 76, 83.5];
  iconSizes.forEach(iconSize => {
    let iconResolutions;
    if (iconSize === 76) {
      // iPad has 1x and 2x icons for this size only
      iconResolutions = [1, 2];
    } else {
      iconResolutions = [2, 3];
    }
    iconResolutions.forEach(async (iconResolution) => {
      let iconQualifier = getAppleIconQualifier(iconSize, iconResolution);
      let iconKey = `iconUrl${iconQualifier}`;
      let rawIconFilename;
      let usesDefault = false;
      if (manifest.ios && manifest.ios.hasOwnProperty(iconKey)) {
        // manifest specifies an image just for this size/resolution, use that
        rawIconFilename = `exp-icon${iconQualifier}.png`;
        await saveUrlToPathAsync(manifest.ios[iconKey], `${destinationIconPath}/${rawIconFilename}`);
      } else {
        // use default manifest.iconUrl
        usesDefault = true;
        if (defaultIconFilename) {
          rawIconFilename = defaultIconFilename;
        } else {
          console.warn(`Manifest does not specify ios.${iconKey} nor a default iconUrl. Bundle will use the Exponent logo.`);
          return;
        }
      }
      let iconFilename = `AppIcon${iconQualifier}.png`;
      let iconSizePx = iconSize * iconResolution;
      await spawnAsyncThrowError('/bin/cp', [rawIconFilename, iconFilename], {
        stdio: 'inherit',
        cwd: destinationIconPath,
      });
      await spawnAsyncThrowError('sips', ['-Z', iconSizePx, iconFilename], {
        stdio: 'inherit',
        cwd: destinationIconPath,
      });
      if (!usesDefault) {
        // non-default icon used, clean up the downloaded version
        await spawnAsyncThrowError('/bin/rm', [path.join(destinationIconPath, rawIconFilename)]);
      }
    });
  });

  // clean up default icon
  if (defaultIconFilename) {
    await spawnAsyncThrowError('/bin/rm', [path.join(destinationIconPath, defaultIconFilename)]);
  }
  return;
}

export {
  saveUrlToPathAsync,
  getManifestAsync,
  spawnAsyncThrowError,
  spawnAsync,
  modifyIOSPropertyListAsync,
  cleanIOSPropertyListBackupAsync,
  configureIOSIconsAsync,
};
