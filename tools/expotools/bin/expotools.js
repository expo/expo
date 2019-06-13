#!/usr/bin/env node
'use strict';

// This script is just a wrapper around expotools that ensures node modules are installed
// and TypeScript files are compiled. To make it work even when node_modules are empty,
// we shouldn't eagerly require any dependency - we have to run yarn first.

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const ROOT_PATH = path.dirname(__dirname);
const BUILD_PATH = path.join(ROOT_PATH, 'build');
const CHECKSUM_PATH = path.join(BUILD_PATH, '.checksum');

maybeRebuildAndRun().catch(error => {
  console.error(require('chalk').red(error.stack));
});

async function maybeRebuildAndRun() {
  const { projectHash, isRebuildingRequired } = await checkForUpdates();

  if (isRebuildingRequired) {
    console.log(' 🧶  Yarning...');

    // Install expotools dependencies.
    await spawnAsync('yarn', ['install']);

    const chalk = require('chalk');

    console.log(
      ` 🛠  ${chalk.bold.cyan('expotools')} ${chalk.italic(`are not up to date - rebuilding...`)}`
    );

    // Clean up build folder. Use fs-extra as it can remove a directory with contents.
    await require('fs-extra').remove(BUILD_PATH);

    try {
      // Compile TypeScript files into build folder.
      await spawnAsync('yarn', ['run', 'build']);

      // TypeScript compiler might fail due to compilation errors but the code might have been generated anyway (code = 2).
      // Unfortunately, when running it in Xcode, it always returns code = 1 (why?). Let's just check whether build folder isn't empty.
      if (!fs.existsSync(BUILD_PATH) || fs.readdirSync(BUILD_PATH).length === 0) {
        throw new Error(
          `There are some TypeScript compilation errors that make it impossible to generate JavaScript files.
    Run \`yarn run build\` in expotools to see more details.`
        );
      }
    } catch (error) {
      console.error(
        chalk.red(` 💥 Rebuilding failed: ${error.message}`)
      );
      process.exit(1);
      return;
    }

    console.log(
      ` ✨ Successfully built ${chalk.bold.cyan('expotools')}\n`
    );
  }

  // Write checksum to the file. Recalculate project's hash if it wasn't present.
  fs.writeFileSync(CHECKSUM_PATH, projectHash || await calculateProjectHash());

  run();
}

async function checkForUpdates() {
  const projectHash = await calculateProjectHash();
  const currentHash = readCurrentHash();

  return {
    projectHash,
    isRebuildingRequired: !projectHash || projectHash !== currentHash,
  };
}

function readCurrentHash() {
  if (!fs.existsSync(CHECKSUM_PATH)) {
    return '';
  }
  return fs.readFileSync(CHECKSUM_PATH, 'utf8');
}

async function calculateProjectHash() {
  if (canRequire('folder-hash')) {
    const { hashElement } = require('folder-hash');
    const { hash } = await hashElement(ROOT_PATH, {
      folders: {
        exclude: ['build', 'node_modules'],
      },
      files: {
        include: ['*.ts', 'expotools.js', 'yarn.lock', 'tsconfig.js'],
      },
    });
    return hash;
  }
  return null;
}

function spawnAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = child_process.spawn(command, args, options || {
      stdio: ['pipe', 'ignore', 'pipe'],
      ignoreStdio: true,
      cwd: ROOT_PATH,
    });

    child.on('exit', code => {
      child.removeAllListeners();
      resolve({ code });
    });
    child.on('error', error => {
      child.removeAllListeners();
      reject(error);
    });
  });
}

function canRequire(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch (error) {
    return false;
  }
}

function run() {
  const chalk = require('chalk');
  const semver = require('semver');
  const nodeVersion = process.versions.node.split('-')[0]; // explode and truncate tag from version

  // Validate that used Node version is supported
  if (semver.satisfies(nodeVersion, '>=8.9.0')) {
    require('../build/expotools-cli.js').run();
  } else {
    console.log(
      chalk.red(
        `Node version ${chalk.cyan(nodeVersion)} is not supported. Please use Node.js ${chalk.cyan('8.9.0')} or higher.`
      ),
    );
    process.exit(1);
  }
}
