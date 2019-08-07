'use strict';

const shell = require('shelljs');
const fs = require('fs-extra');
const semver = require('semver');
const chalk = require('chalk');

module.exports = async function outdatedVendoredNativeModules({ bundledNativeModules, isModuleLinked }) {
  let outdatedNativeModules = [];
  let postdatedNativeModules = [];

  for (let packageName in bundledNativeModules) {
    if (await isModuleLinked(packageName)) {
      console.log(`Module ${packageName} is linked inside workspace, skipping...`);
      continue;
    }

    const bundledVersionRange = bundledNativeModules[packageName];
    const bundledVersion = semver.minVersion(bundledVersionRange).version;
    process.stdout.write(`Checking \`${packageName}\`...`);
    const { currentVersion: npmVersion } = await _getPackageViewFromRegistryAsync(packageName);
    // console.log({ bundledVersion, bundledVersionRange, npmVersion });
    if (semver.gt(bundledVersion, npmVersion)) {
      postdatedNativeModules.push({ packageName, bundledVersion, npmVersion });
      console.log(' postdated!');
    } else if (semver.gt(npmVersion, bundledVersion)) {
      // latest version from npm is greater than bundled
      outdatedNativeModules.push({ packageName, bundledVersion, npmVersion });
      console.log(' outdated!');
    } else {
      console.log(' looks ok!');
    }
  }

  console.log();
  if (postdatedNativeModules.length > 0) {
    console.log(chalk.blue(`Postdated native modules:`));
    for (let { packageName, bundledVersion, npmVersion } of postdatedNativeModules) {
      console.log(chalk.blue(`- ${packageName}: ${bundledVersion} bundled, latest on NPM is ${npmVersion}`));
    }
  } else {
    console.log(chalk.blue('No postdated native modules found!'));
  }
  
  console.log();
  if (outdatedNativeModules.length > 0) {
    console.warn(chalk.yellow(`Outdated native modules:`));
    for (let { packageName, bundledVersion, npmVersion } of outdatedNativeModules) {
      console.log(chalk.yellow(`- ${packageName}: ${bundledVersion} bundled, latest on NPM is ${npmVersion}`));
    }
  } else {
    console.log(chalk.green('No outdated native modules found!'));
  }
}

// copied from publish-packages.js
function _runCommand(command, silent = true) {
  const { stderr, stdout } = shell.exec(command, { silent });

  if (stderr) {
    stderr.split(/\r?\n/g).forEach(line => {
      console.error(chalk.red('stderr >'), line);
    });
  }
  return stdout;
}

function _runJSONCommand(command) {
  return JSON.parse(_runCommand(command));
}

async function _getPackageViewFromRegistryAsync(packageName) {
  const json = await _runJSONCommand(`npm view ${packageName} --json`);

  if (json && !json.error) {
    const currentVersion = json.versions[json.versions.length - 1];
    const publishedDate = json.time[currentVersion];

    if (!publishedDate || !currentVersion) {
      return null;
    }

    json.currentVersion = currentVersion;
    json.publishedDate = new Date(publishedDate);

    return json;
  }

  throw new Error(json.error || `Unexpected error fetching information about ${packageName} from NPM`);
}
