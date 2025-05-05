#!/usr/bin/env yarn --silent ts-node --transpile-only

import { v4 as uuid } from 'uuid';

import { Filter as PathsFilter } from './paths-filter/filter';
import type { FilterResults } from './paths-filter/filter';
import * as git from './paths-filter/git';

const spawnAsync = require('@expo/spawn-async');
const picomatch = require('picomatch');

/**
 *
 * Check for any changes or additions from a specific github branch or commit,
 * that match a set of paths/globs.
 *
 * This script should be compiled with ncc using the `build:check-paths` script, and then
 * the compiled bin/check-for-changed-paths/index.js should be check in so it can be run from an EAS workflow.
 *
 * Arguments:
 *  - git_event_name: The name of the github event that triggered this workflow ('push' or 'pull_request')
 *  - branch: The name of the branch to compare against
 *  - paths: The paths to check for changes/additions
 */

(async function () {
  const args = [...process['argv'].slice(2)];
  if (args.length < 1) {
    throw new Error(
      'Usage: check-for-changed-paths <git_event_name> <branch> [<path1> <path2> ...]'
    );
  }

  // Until paths support is added to EAS workflows, we should do the paths check
  // for push and pull request workflows
  const github_event_name = args.shift() as unknown as string;
  if (!shouldDoPathsCheck(github_event_name)) {
    console.log(`didChange: true`);
    await setOutput('result', 'true');
    return;
  }

  const branch: string = args.shift() as unknown as string;
  const pathsToCheck: string[] = [...args];
  if (pathsToCheck.length === 0) {
    console.log('false');
    return;
  }
  console.log(`branch: ${branch}`);
  console.log(`pathsToCheck: ${JSON.stringify(pathsToCheck, null, 2)}`);
  const currentBranchName = uuid();
  const fetchHeadBranchName = uuid();
  await prepareGit(branch, currentBranchName, fetchHeadBranchName);
  const changedFiles = await git.getChanges(fetchHeadBranchName, currentBranchName);
  const filter = new Filter();
  filter.loadFromEntries(pathsToCheck);
  const results = filter.match(changedFiles);
  console.log(`results: ${JSON.stringify(results, null, 2)}`);
  const didChange = (await didAnyFilesChange(results)) ? 'true' : 'false';
  console.log(`didChange: ${didChange}`);
  await setOutput('result', didChange);
})();

// Minimatch options used in all matchers
const MatchOptions = {
  dot: true,
};

class Filter extends PathsFilter {
  loadFromEntries(entries: string[]) {
    for (const entry of entries) {
      this.rules[entry] = [{ status: undefined, isMatch: picomatch(entry, MatchOptions) }];
    }
  }
}

function shouldDoPathsCheck(github_event_name: string) {
  console.log(`git_event_name: ${github_event_name}`);
  return github_event_name === 'pull_request' || github_event_name === 'push';
}

async function didAnyFilesChange(result: FilterResults) {
  return Object.values(result).some((files) => files.length > 0);
}

async function setOutput(name: string, value: string) {
  await spawnAsync('set-output', [name, value], { stdio: 'inherit' });
}

/*
async function doesCommandExist(command: string) {
  try {
    await spawnAsync('command', ['-v', command]);
    return true;
  } catch {
    return false;
  }
}
  */

async function prepareGit(branch: string, currentBranchName: string, fetchHeadBranchName: string) {
  await spawnAsync('git', ['config', 'user.email', process.env.GIT_AUTHOR_EMAIL], {
    stdio: 'ignore',
  });
  await spawnAsync('git', ['config', 'user.name', process.env.GIT_AUTHOR_NAME], {
    stdio: 'ignore',
  });
  await spawnAsync('git', ['checkout', '-b', currentBranchName], {
    stdio: 'ignore',
  });
  await spawnAsync('git', ['add', '.'], {
    stdio: 'ignore',
  });
  await spawnAsync('git', ['commit', '--allow-empty', '-m', 'tmp'], {
    stdio: 'ignore',
  });
  await spawnAsync('git', ['fetch', 'origin', branch], {
    stdio: 'ignore',
  });
  await spawnAsync('git', ['checkout', 'FETCH_HEAD'], {
    stdio: 'ignore',
  });
  await spawnAsync('git', ['switch', '-c', fetchHeadBranchName], {
    stdio: 'ignore',
  });
  await spawnAsync('git', ['checkout', currentBranchName], {
    stdio: 'ignore',
  });
}
