// Copyright 2015-present 650 Industries. All rights reserved.

'use strict';

import {
  getManifestAsync,
  spawnAsyncThrowError,
  spawnAsync,
  modifyIOSPropertyListAsync,
  cleanIOSPropertyListBackupAsync,
} from './tools-utils';
import {
  configureStandaloneIOSInfoPlistAsync,
  configureStandaloneIOSShellPlistAsync,
  configureIOSIconsAsync,
} from './ios-shell-app';

const EXPONENT_SRC_URL = 'https://github.com/exponentjs/exponent.git';
const EXPONENT_ARCHIVE_URL = 'https://api.github.com/repos/exponentjs/exponent/tarball/master';

function validateArgs(args) {
  if (!args.outputDirectory) {
    throw new Error(`Must specify --outputDirectory <path to create detached project>`);
  }
  if (!args.sdkVersion) {
    // TODO: maybe just default to newest?
    // we will need to figure out newest SDK version anyway to configure the kernel properly.
    throw new Error(`Must specify --sdkVersion <sdk version of project to detach>`);
  }
  if (!args.url) {
    throw new Error(`Must specify --url <url of project to detach>`);
  }
  return args;
}

function validateManifest(manifest) {
  if (!manifest.name) {
    throw new Error('Manifest is missing `name`');
  }
  return manifest;
}

async function configureDetachedVersionsPlistAsync(configFilePath, detachedSDKVersion, kernelSDKVersion) {
  await modifyIOSPropertyListAsync(configFilePath, 'EXSDKVersions', (versionConfig) => {
    versionConfig.sdkVersions = [detachedSDKVersion];
    versionConfig.detachedNativeVersions = {
      shell: detachedSDKVersion,
      kernel: kernelSDKVersion,
    };
    return versionConfig;
  });
}

async function cleanPropertyListBackupsAsync(configFilePath) {
  console.log('Cleaning up...');
  await cleanIOSPropertyListBackupAsync(configFilePath, 'EXShell', false);
  await cleanIOSPropertyListBackupAsync(configFilePath, 'Info', false);
  await cleanIOSPropertyListBackupAsync(configFilePath, 'EXSDKVersions', false);
}

/**
 *  Create a detached Exponent iOS app pointing at the given project.
 *  @param args.url url of the Exponent project.
 *  @param args.outputDirectory directory to create the detached project.
 */
export async function detachIOSAsync(args) {
  args = validateArgs(args);

  console.log('Validating output directory...');
  await spawnAsyncThrowError('/bin/mkdir', ['-p', args.outputDirectory]);

  console.log('Downloading and validating project manifest...');
  let manifest = await getManifestAsync(args.url, {
    'Exponent-SDK-Version': args.sdkVersion,
    'Exponent-Platform': 'ios',
  });
  manifest = validateManifest(manifest);

  console.log('Downloading Exponent kernel...');
  let tmpExponentDirectory = `${args.outputDirectory}/exponent-src-tmp`;
  // TODO: Make this method work
  // await spawnAsync(`/usr/bin/curl -L ${EXPONENT_ARCHIVE_URL} | tar xzf -`, null, { shell: true });
  await spawnAsyncThrowError('/usr/bin/git', ['clone', EXPONENT_SRC_URL, tmpExponentDirectory]);

  console.log('Moving project files...');
  let exponentDirectory = `${args.outputDirectory}/exponent`;
  let iosProjectDirectory = `${args.outputDirectory}/ios`;
  await spawnAsyncThrowError('/bin/mkdir', ['-p', exponentDirectory]);
  await spawnAsync('/bin/cp', ['-r', `${tmpExponentDirectory}/ios`, `${exponentDirectory}/ios`]);
  await spawnAsync('/bin/cp', ['-r', `${tmpExponentDirectory}/cpp`, `${exponentDirectory}/cpp`]);
  await spawnAsync('/bin/cp', [`${tmpExponentDirectory}/ExponentView.podspec`, `${exponentDirectory}/.`]);
  await spawnAsync('/bin/cp', ['-r', `${tmpExponentDirectory}/exponent-view-template/ios`, iosProjectDirectory]);

  console.log('Naming project...');
  let projectName = manifest.name;
  await spawnAsyncThrowError('sed', [
    '-i', `''`, '--',
    `s/exponent-view-template/${projectName}/g`,
    `${iosProjectDirectory}/exponent-view-template.xcodeproj/project.pbxproj`,
  ]);
  await spawnAsyncThrowError('sed', [
    '-i', `''`,
    `s/exponent-view-template/${projectName}/g`,
    `${iosProjectDirectory}/exponent-view-template.xcodeproj/xcshareddata/xcschemes/exponent-view-template.xcscheme`,
  ]);
  await spawnAsync('/bin/mv', [`${iosProjectDirectory}/exponent-view-template`, `${iosProjectDirectory}/${projectName}`]);
  await spawnAsync('/bin/mv', [
    `${iosProjectDirectory}/exponent-view-template.xcodeproj/xcshareddata/xcschemes/exponent-view-template.xcscheme`,
    `${iosProjectDirectory}/exponent-view-template.xcodeproj/xcshareddata/xcschemes/${projectName}.xcscheme`,
  ]);
  await spawnAsync('/bin/mv', [`${iosProjectDirectory}/exponent-view-template.xcodeproj`, `${iosProjectDirectory}/${projectName}.xcodeproj`]);
  await spawnAsync('/bin/mv', [`${iosProjectDirectory}/exponent-view-template.xcworkspace`, `${iosProjectDirectory}/${projectName}.xcworkspace`]);

  console.log('Configuring project...');
  let infoPlistPath = `${iosProjectDirectory}/${projectName}/Supporting`;
  let iconPath = `${iosProjectDirectory}/${projectName}/Images.xcassets/AppIcon.appiconset`;
  await configureStandaloneIOSInfoPlistAsync(infoPlistPath, manifest);
  await configureStandaloneIOSShellPlistAsync(infoPlistPath, manifest, args.url);
  // TODO: logic for when kernel sdk version is different from detached sdk version
  await configureDetachedVersionsPlistAsync(infoPlistPath, args.sdkVersion, args.sdkVersion);
  await configureIOSIconsAsync(manifest, iconPath);
  // we don't pre-cache JS in this case, TODO: think about whether that's correct

  console.log('Cleaning up...');
  await cleanPropertyListBackupsAsync(infoPlistPath);
  await spawnAsync('/bin/rm', ['-rf', tmpExponentDirectory]);

  /*
  TODO:
  - generate myproj/ios/Podfile
  --- ExponentView local pod
  --- ExponentCPP local pod
  --- React remote pod, on correct sdk branch or tag
  ----- postinstall
  --- versioned React local pod, if needed
  ----- postinstall
   */
  return;
}
