/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script tests that React Native end to end installation/bootstrap works for different platforms
 * Available arguments:
 * --ios - 'react-native init' and check iOS app doesn't redbox
 * --android - 'react-native init' and check Android app doesn't redbox
 * --js - 'react-native init' and only check the packager returns a bundle
 * --skip-cli-install - to skip react-native-cli global installation (for local debugging)
 * --retries [num] - how many times to retry possible flaky commands: yarn add and running tests, default 1
 */

const {cd, cp, echo, exec, exit, mv} = require('shelljs');
const spawn = require('child_process').spawn;
const argv = require('yargs').argv;
const path = require('path');

const forEachPackage = require('./monorepo/for-each-package');
const setupVerdaccio = require('./setup-verdaccio');

const SCRIPTS = __dirname;
const ROOT = path.normalize(path.join(__dirname, '..'));
const tryExecNTimes = require('./try-n-times');

const REACT_NATIVE_TEMP_DIR = exec(
  'mktemp -d /tmp/react-native-XXXXXXXX',
).stdout.trim();
const REACT_NATIVE_APP_DIR = `${REACT_NATIVE_TEMP_DIR}/template`;
const numberOfRetries = argv.retries || 1;

const VERDACCIO_CONFIG_PATH = path.join(ROOT, '.circleci/verdaccio.yml');

let SERVER_PID;
let APPIUM_PID;
let VERDACCIO_PID;
let exitCode;

function describe(message) {
  echo(`\n\n>>>>> ${message}\n\n\n`);
}

try {
  if (argv.android) {
    describe('Compile Android binaries');
    if (
      exec(
        './gradlew :ReactAndroid:installArchives -Pjobs=1 -Dorg.gradle.jvmargs="-Xmx512m -XX:+HeapDumpOnOutOfMemoryError"',
      ).code
    ) {
      echo('Failed to compile Android binaries');
      exitCode = 1;
      throw Error(exitCode);
    }
  }

  describe('Create react-native package');
  if (exec('node ./scripts/set-rn-version.js --version 1000.0.0').code) {
    echo('Failed to set version and update package.json ready for release');
    exitCode = 1;
    throw Error(exitCode);
  }

  if (exec('npm pack').code) {
    echo('Failed to pack react-native');
    exitCode = 1;
    throw Error(exitCode);
  }

  const REACT_NATIVE_PACKAGE = path.join(ROOT, 'react-native-*.tgz');

  describe('Set up Verdaccio');
  VERDACCIO_PID = setupVerdaccio(ROOT, VERDACCIO_CONFIG_PATH);

  describe('Publish packages');
  forEachPackage(
    (packageAbsolutePath, packageRelativePathFromRoot, packageManifest) => {
      if (packageManifest.private) {
        return;
      }

      exec(
        'npm publish --registry http://localhost:4873 --yes --access public',
        {cwd: packageAbsolutePath},
      );
    },
  );

  describe('Scaffold a basic React Native app from template');
  exec(`rsync -a ${ROOT}/template ${REACT_NATIVE_TEMP_DIR}`);
  cd(REACT_NATIVE_APP_DIR);

  mv('_bundle', '.bundle');
  mv('_eslintrc.js', '.eslintrc.js');
  mv('_prettierrc.js', '.prettierrc.js');
  mv('_watchmanconfig', '.watchmanconfig');

  describe('Install React Native package');
  exec(`npm install ${REACT_NATIVE_PACKAGE}`);

  describe('Install node_modules');
  if (
    tryExecNTimes(
      () => {
        return exec('npm install').code;
      },
      numberOfRetries,
      () => exec('sleep 10s'),
    )
  ) {
    echo('Failed to execute npm install');
    echo('Most common reason is npm registry connectivity, try again');
    exitCode = 1;
    throw Error(exitCode);
  }
  exec('rm -rf ./node_modules/react-native/template');

  if (argv.android) {
    describe('Install end-to-end framework');
    if (
      tryExecNTimes(
        () =>
          exec(
            'yarn add --dev appium@1.11.1 mocha@2.4.5 wd@1.11.1 colors@1.0.3 pretty-data2@0.40.1',
            {silent: true},
          ).code,
        numberOfRetries,
      )
    ) {
      echo('Failed to install appium');
      echo('Most common reason is npm registry connectivity, try again');
      exitCode = 1;
      throw Error(exitCode);
    }
    cp(`${SCRIPTS}/android-e2e-test.js`, 'android-e2e-test.js');
    cd('android');
    describe('Download Maven deps');
    exec('./gradlew :app:copyDownloadableDepsToLibs');
    cd('..');

    describe('Generate key');
    exec('rm android/app/debug.keystore');
    if (
      exec(
        'keytool -genkey -v -keystore android/app/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"',
      ).code
    ) {
      echo('Key could not be generated');
      exitCode = 1;
      throw Error(exitCode);
    }

    describe(`Start appium server, ${APPIUM_PID}`);
    const appiumProcess = spawn('node', ['./node_modules/.bin/appium']);
    APPIUM_PID = appiumProcess.pid;

    describe('Build the app');
    if (exec('react-native run-android').code) {
      echo('could not execute react-native run-android');
      exitCode = 1;
      throw Error(exitCode);
    }

    describe(`Start Metro, ${SERVER_PID}`);
    // shelljs exec('', {async: true}) does not emit stdout events, so we rely on good old spawn
    const packagerProcess = spawn('yarn', ['start', '--max-workers 1']);
    SERVER_PID = packagerProcess.pid;
    // wait a bit to allow packager to startup
    exec('sleep 15s');
    describe('Test: Android end-to-end test');
    if (
      tryExecNTimes(
        () => {
          return exec('node node_modules/.bin/_mocha android-e2e-test.js').code;
        },
        numberOfRetries,
        () => exec('sleep 10s'),
      )
    ) {
      echo('Failed to run Android end-to-end tests');
      echo('Most likely the code is broken');
      exitCode = 1;
      throw Error(exitCode);
    }
  }

  if (argv.ios) {
    cd('ios');
    // shelljs exec('', {async: true}) does not emit stdout events, so we rely on good old spawn
    const packagerEnv = Object.create(process.env);
    packagerEnv.REACT_NATIVE_MAX_WORKERS = 1;
    describe('Start Metro');
    const packagerProcess = spawn('yarn', ['start'], {
      stdio: 'inherit',
      env: packagerEnv,
    });
    SERVER_PID = packagerProcess.pid;
    exec('sleep 15s');
    // prepare cache to reduce chances of possible red screen "Can't find variable __fbBatchedBridge..."
    exec(
      'response=$(curl --write-out %{http_code} --silent --output /dev/null localhost:8081/index.bundle?platform=ios&dev=true)',
    );
    echo(`Metro is running, ${SERVER_PID}`);

    describe('Install CocoaPod dependencies');
    exec('bundle exec pod install');

    describe('Test: iOS end-to-end test');
    if (
      // TODO: Get target OS and simulator from .tests.env
      tryExecNTimes(
        () => {
          return exec(
            [
              'xcodebuild',
              '-workspace',
              '"HelloWorld.xcworkspace"',
              '-destination',
              '"platform=iOS Simulator,name=iPhone 8,OS=13.3"',
              '-scheme',
              '"HelloWorld"',
              '-sdk',
              'iphonesimulator',
              '-UseModernBuildSystem=NO',
              'test',
            ].join(' ') +
              ' | ' +
              [
                'xcpretty',
                '--report',
                'junit',
                '--output',
                '"~/react-native/reports/junit/iOS-e2e/results.xml"',
              ].join(' ') +
              ' && exit ${PIPESTATUS[0]}',
          ).code;
        },
        numberOfRetries,
        () => exec('sleep 10s'),
      )
    ) {
      echo('Failed to run iOS end-to-end tests');
      echo('Most likely the code is broken');
      exitCode = 1;
      throw Error(exitCode);
    }
    cd('..');
  }

  if (argv.js) {
    // Check the packager produces a bundle (doesn't throw an error)
    describe('Test: Verify packager can generate an Android bundle');
    if (
      exec(
        'yarn react-native bundle --verbose --entry-file index.js --platform android --dev true --bundle-output android-bundle.js --max-workers 1',
      ).code
    ) {
      echo('Could not build Android bundle');
      exitCode = 1;
      throw Error(exitCode);
    }

    describe('Test: Verify packager can generate an iOS bundle');
    if (
      exec(
        'yarn react-native bundle --entry-file index.js --platform ios --dev true --bundle-output ios-bundle.js --max-workers 1',
      ).code
    ) {
      echo('Could not build iOS bundle');
      exitCode = 1;
      throw Error(exitCode);
    }

    describe('Test: TypeScript typechecking');
    if (exec('yarn tsc').code) {
      echo('Typechecking errors were found');
      exitCode = 1;
      throw Error(exitCode);
    }

    describe('Test: Jest tests');
    if (exec('yarn test').code) {
      echo('Jest tests failed');
      exitCode = 1;
      throw Error(exitCode);
    }

    // TODO: ESLint infinitely hangs when running in the environment created by
    // this script, but not projects generated by `react-native init`.
    /*
    describe('Test: ESLint/Prettier linting and formatting');
    if (exec('yarn lint').code) {
      echo('linting errors were found');
      exitCode = 1;
      throw Error(exitCode);
    }*/
  }
  exitCode = 0;
} finally {
  describe('Clean up');
  if (SERVER_PID) {
    echo(`Killing packager ${SERVER_PID}`);
    exec(`kill -9 ${SERVER_PID}`);
    // this is quite drastic but packager starts a daemon that we can't kill by killing the parent process
    // it will be fixed in April (quote David Aurelio), so until then we will kill the zombie by the port number
    exec("lsof -i tcp:8081 | awk 'NR!=1 {print $2}' | xargs kill");
  }
  if (APPIUM_PID) {
    echo(`Killing appium ${APPIUM_PID}`);
    exec(`kill -9 ${APPIUM_PID}`);
  }
  if (VERDACCIO_PID) {
    echo(`Killing verdaccio ${VERDACCIO_PID}`);
    exec(`kill -9 ${VERDACCIO_PID}`);
  }
}
exit(exitCode);
