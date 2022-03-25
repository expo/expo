#!/usr/bin/env node
'use strict';

const process = require('process');

const spawnSync = require('../common/cross-spawn-sync');

function checkWorkspaceDependencies() {
  const workspacesInfo = getWorkspacesInfo();
  if (!workspacesInfo) {
    console.error(`Couldn't generate Yarn's workspace root information.`);
    return false;
  }

  const count = countMismatchedWorkspaceDependencies(workspacesInfo);
  if (count === 0) {
    console.log(`✅  Verified that all workspace dependencies are symlinked.`);
    return true;
  } else {
    const singular = count === 1;
    console.warn(
      `⚠️  Found ${count} ${
        singular ? 'dependency' : 'dependencies'
      } installed from npm instead of being symlinked because the semver ranges in package.json are not satisfied by the workspaces in this repository.`
    );
  }

  for (const workspaceName in workspacesInfo) {
    const workspaceInfo = workspacesInfo[workspaceName];
    const { mismatchedWorkspaceDependencies } = workspaceInfo;
    if (mismatchedWorkspaceDependencies.length) {
      const singular = mismatchedWorkspaceDependencies.length === 1;
      console.warn(
        `   ${workspaceName} has ${mismatchedWorkspaceDependencies.length} ${
          singular ? 'dependency' : 'dependencies'
        } that ${singular ? `isn't` : `aren't`} symlinked:`
      );
      for (const dependency of mismatchedWorkspaceDependencies) {
        console.warn(`     ${dependency}`);
      }
    }
  }

  return false;
}

function getWorkspacesInfo() {
  const result = spawnSync('yarn', ['--silent', 'workspaces', 'info']);

  if (result.error) {
    console.error(`Could not run yarn: ${result.error.message}`);
    return null;
  }

  if (result.signal) {
    console.error(`yarn exited due to ${result.signal}`);
    return null;
  }

  if (result.status !== 0) {
    console.error(`yarn exited with status code ${result.status}:`);
    const stdout = result.stdout.toString();
    const stderr = result.stderr.toString();
    if (stdout) {
      console.error(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
    return null;
  }

  try {
    return JSON.parse(result.stdout);
  } catch {
    console.error(`yarn did not print valid JSON:`);
    const stdout = result.stdout.toString();
    const stderr = result.stderr.toString();
    if (stdout) {
      console.error(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
    return null;
  }
}

function countMismatchedWorkspaceDependencies(workspacesInfo) {
  let count = 0;
  for (const workspaceName in workspacesInfo) {
    count += workspacesInfo[workspaceName].mismatchedWorkspaceDependencies.length;
  }
  return count;
}

if (module === require.main) {
  if (!checkWorkspaceDependencies()) {
    process.exit(1);
  }
}
