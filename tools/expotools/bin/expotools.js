#!/usr/bin/env node
'use strict';

const ora = require('ora');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const semver = require('semver');
const process = require('process');
const { hashElement } = require('folder-hash');
const spawnAsync = require('@expo/spawn-async');

const nodeVersion = process.versions.node.split('-')[0]; // explode and truncate tag from version

// Validate that used Node version is supported
if (semver.satisfies(nodeVersion, '>=8.9.0')) {
  maybeRebuildAndRun();
} else {
  console.log(
    chalk.red(
      `Node version ${chalk.cyan(nodeVersion)} is not supported. Please use Node.js ${chalk.cyan('8.9.0')} or higher.`
    ),
  );
  process.exit(1);
}

async function maybeRebuildAndRun() {
  const rootDir = path.dirname(__dirname);
  const checksumFilePath = path.join(rootDir, 'build', '.checksum');

  const projectHash = await calculateProjectHash(rootDir);
  const currentHash = await readCurrentHash(checksumFilePath);

  if (projectHash !== currentHash) {
    const spinner = ora().start(
      `${chalk.cyan(chalk.bold('expotools'))} ${chalk.italic(`are not up to date - rebuilding...\n`)}`
    );
    await spawnAsync('yarn', { cwd: rootDir });
    await spawnAsync('yarn', ['run', 'clean'], { cwd: rootDir });
    await spawnAsync('yarn', ['run', 'prepare'], { cwd: rootDir });
    spinner.succeed();
  }

  // Write checksum to the file.
  await fs.writeFile(checksumFilePath, projectHash);

  run();
}

async function readCurrentHash(checksumFilePath) {
  if (!await fs.exists(checksumFilePath)) {
    return '';
  }
  return await fs.readFile(checksumFilePath, 'utf8');
}

async function calculateProjectHash(rootDir) {
  const { hash } = await hashElement(rootDir, {
    folders: {
      exclude: ['build', 'node_modules'],
    },
    files: {
      include: ['*.ts', 'expotools.js', 'yarn.lock', 'tsconfig.js'],
    },
  });
  return hash;
}

function run() {
  require('../build/expotools-cli.js').run();
}
