#!/usr/bin/env node
'use strict';

const child_process = require('child_process');

function checkWorkspaceDependencies() {
  let workspacesInfo = _getWorkspacesInfo();
  if (!workspacesInfo) {
    console.error(`Couldn't generate Yarn's workspace root information.`);
    return;
  }

  let count = _countMismatchedWorkspaceDependencies(workspacesInfo);
  if (count === 0) {
    console.log(`✅  Verified that all workspace dependencies are symlinked.`);
    return;
  } else {
    let singular = count === 1;
    console.warn(
      `⚠️  Found ${count} ${
        singular ? 'dependency' : 'dependencies'
      } installed from npm instead of being symlinked because the semver ranges in package.json are not satisfied by the workspaces in this repository.`
    );
  }

  for (let workspaceName in workspacesInfo) {
    let workspaceInfo = workspacesInfo[workspaceName];
    let { mismatchedWorkspaceDependencies } = workspaceInfo;
    if (mismatchedWorkspaceDependencies.length) {
      let singular = mismatchedWorkspaceDependencies.length === 1;
      console.warn(
        `   ${workspaceName} has ${mismatchedWorkspaceDependencies.length} ${
          singular ? 'dependency' : 'dependencies'
        } that ${singular ? `isn't` : `aren't`} symlinked:`
      );
      for (let dependency of mismatchedWorkspaceDependencies) {
        console.warn(`     ${dependency}`);
      }
    }
  }
}

function _getWorkspacesInfo() {
  let result = child_process.spawnSync('yarn', ['--silent', 'workspaces', 'info']);

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
    let stdout = result.stdout.toString();
    let stderr = result.stderr.toString();
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
  } catch (e) {
    console.error(`yarn did not print valid JSON:`);
    let stdout = result.stdout.toString();
    let stderr = result.stderr.toString();
    if (stdout) {
      console.error(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
    return null;
  }
}

function _countMismatchedWorkspaceDependencies(workspacesInfo) {
  let count = 0;
  for (let workspaceName in workspacesInfo) {
    count += workspacesInfo[workspaceName].mismatchedWorkspaceDependencies.length;
  }
  return count;
}

if (module === require.main) {
  checkWorkspaceDependencies();
}
