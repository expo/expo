// Copyright 2015-present 650 Industries. All rights reserved.
'use strict';

const assert = require('assert');
const fs = require('fs');
const gulp = require('gulp');
const shell = require('gulp-shell');
const minimist = require('minimist');
const path = require('path');
const _ = require('lodash');
const {
  IosClient,
  IosIcons,
  IosShellApp,
  AndroidShellApp,
  AndroidKeystore,
  IosKeychain,
  IosIPABuilder: createIPABuilder,
} = require('xdl');

const { startReactNativeServer } = require('./react-native-tasks');
const {
  generateDynamicMacrosAsync,
  cleanupDynamicMacrosAsync,
  runFabricIOSAsync,
} = require('./generate-dynamic-macros');
const logger = require('./logger');

const ptool = './ptool';
const _projects = './_projects';

const argv = minimist(process.argv.slice(2));

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
  validateArgv({
    url: 'Must run with `--url MANIFEST_URL`',
    sdkVersion: 'Must run with `--sdkVersion SDK_VERSION`',
  });

  return AndroidShellApp.createAndroidShellAppAsync(argv);
}

function updateAndroidShellAppWithArguments() {
  validateArgv({
    url: 'Must run with `--url MANIFEST_URL`',
    sdkVersion: 'Must run with `--sdkVersion SDK_VERSION`',
  });

  return AndroidShellApp.updateAndroidShellAppAsync(argv);
}

function createAndroidKeystoreWithArguments() {
  validateArgv({
    keystorePassword: 'Must run with `--keystorePassword KEYSTORE_PASSWORD`',
    keyPassword: 'Must run with `--keyPassword KEY_PASSWORD`',
    keystoreFilename: 'Must run with `--keystoreFilename KEYSTORE_FILENAME`',
    keystoreAlias: 'Must run with `--keystoreAlias KEYSTORE_ALIAS`',
    androidPackage: 'Must run with `--androidPackage ANDROID_PACKAGE`',
  });

  return AndroidKeystore.createKeystore(argv);
}

function createIOSShellAppWithArguments() {
  const { resizeIconWithSharpAsync, getImageDimensionsWithSharpAsync } = require('./image-helpers');
  logger.info(
    { buildPhase: 'icons setup' },
    'IosIcons: setting image functions to alternative sharp implementations'
  );
  IosIcons.setResizeImageFunction(resizeIconWithSharpAsync);
  IosIcons.setGetImageDimensionsFunction(getImageDimensionsWithSharpAsync);

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

function buildIOSClientWithArguments() {
  const { type, configuration, verbose } = argv;
  return IosClient.buildAsync(type, configuration, verbose);
}

function configureIOSClientBundleWithArguments() {
  const { archivePath, bundleId, appleTeamId } = argv;
  return IosClient.configureBundleAsync(archivePath, bundleId, appleTeamId);
}

function createIOSKeychainWithArguments() {
  validateArgv({
    appUUID: 'Must run with `--appUUID APP_UUID`',
  });

  return IosKeychain.createKeychain(argv.appUUID);
}

function importCertIntoIOSKeychainWithArguments() {
  validateArgv({
    keychainPath: 'Must run with `--keychainPath KEYCHAIN_PATH`',
    certPath: 'Must run with `--certPath CERTIFICATE_PATH`',
    certPassword: 'Must run with `--certPassword CERTIFICATE_PASSWORD`',
  });

  return IosKeychain.importIntoKeychain(argv);
}

function deleteIOSKeychainWithArguments() {
  validateArgv({
    keychainPath: 'Must run with `--keychainPath KEYCHAIN_PATH`',
    appUUID: 'Must run with `--appUUID APP_UUID`',
  });

  return IosKeychain.deleteKeychain({ path: argv.keychainPath, appUUID: argv.appUUID });
}

function buildAndSignIpaWithArguments() {
  validateArgv({
    keychainPath: 'Must run with `--keychainPath KEYCHAIN_PATH`',
    provisioningProfilePath: 'Must run with `--provisioningProfilePath PROVISIONING_PROFILE_PATH`',
    appUUID: 'Must run with `--appUUID APP_UUID`',
    certPath: 'Must run with `--certPath CERT_PATH`',
    certPassword: 'Must run with `--certPassword CERT_PASSWORD`',
    teamID: 'Must run with `--teamID TEAM_ID`',
    bundleIdentifier: 'Must run with `--bundleIdentifier BUNDLE_IDENTIFIER`',
  });

  const builder = createIPABuilder(argv);
  return builder.build();
}

function validateArgv(errors) {
  Object.keys(errors).forEach(fieldName => {
    if (!(fieldName in argv)) {
      throw new Error(errors[fieldName]);
    }
  });
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

// Shell app (android)
gulp.task('android-shell-app', createAndroidShellAppWithArguments);
gulp.task('update-android-shell-app', updateAndroidShellAppWithArguments);
gulp.task('android:create-keystore', createAndroidKeystoreWithArguments);

// iOS
gulp.task('ios-shell-app', createIOSShellAppWithArguments);
gulp.task('build-ios-client', buildIOSClientWithArguments);
gulp.task('ios:configure-client-bundle', configureIOSClientBundleWithArguments);
gulp.task('ios:create-keychain', createIOSKeychainWithArguments);
gulp.task('ios:import-cert-into-keychain', importCertIntoIOSKeychainWithArguments);
gulp.task('ios:delete-keychain', deleteIOSKeychainWithArguments);
gulp.task('ios:build-and-sign-ipa', buildAndSignIpaWithArguments);

gulp.task('ptool', shell.task([`${ptool} ${_projects}`]));
gulp.task('ptool:watch', gulp.series('ptool', 'watch'));
gulp.task('ptool:pause-watch', gulp.series('watch:stop', 'ptool', 'watch'));

gulp.task('react-native-server', startReactNativeServer);

gulp.task('generate-dynamic-macros', generateDynamicMacrosWithArguments);
gulp.task('cleanup-dynamic-macros', cleanupDynamicMacrosWithArguments);
gulp.task('run-fabric-ios', runFabricIOSWithArguments);
