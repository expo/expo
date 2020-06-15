import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';

import { Directories } from '../expotools';

type Options = {
  sdk: string;
  from: string;
  to: string;
};

type DocsSummary = {
  removed: string[];
  added: string[];
  changed: string[];
};

const EXPO_DIR = Directories.getExpoRepositoryRootDir();
const DOCS_DIR = path.join(EXPO_DIR, 'docs');
const SDK_DOCS_DIR = path.join(DOCS_DIR, 'pages', 'versions');

const RN_REPO_DIR = path.join(DOCS_DIR, 'react-native-website');
const RN_WEBSITE_DIR = path.join(RN_REPO_DIR, 'website');
const RN_DOCS_DIR = path.join(RN_REPO_DIR, 'docs');

const PREFIX_ADDED = 'ADDED_';
const PREFIX_REMOVED = 'REMOVED_';

const DOCS_IGNORED = [
  'appregistry',
  'components-and-apis',
  'drawerlayoutandroid',
  'linking',
  'settings',
  'systrace',
];

async function action(input: Options) {
  const options = getOptions(input);

  if (!await validateGitStatusAsync()) {
    return;
  }

  await updateDocsAsync(options);

  const summary = getDocsSummary(
    await getLocalFilesAsync(options),
    await getUpstreamFilesAsync(options),
  );

  console.log();

  await applyChangedFilesAsync(options, summary);
  await applyAddedFilesAsync(options, summary);
  await applyRemovedFilesAsync(options, summary);

  console.log();
  console.log('Update completed successfully.');
  console.log('Please check the files in the versioned react-native folder.');
  console.log('To revert the changes, use `git clean -xdf .` and `git checkout .` in the versioned folder.');
}

function getOptions(input: Options): Options {
  if (!input.sdk) {
    throw new Error('Must run with `--sdk SDK_VERSION` to know which SDK version the docs belongs to.');
  }

  if (!input.from) {
    throw new Error('Must run with `--from RN_COMMIT` to know the start of the changes.');
  }

  return {
    sdk: input.sdk,
    from: input.from,
    to: input.to || 'master',
  };
}

async function validateGitStatusAsync() {
  console.log('Checking local repository status...');

  const result = await spawnAsync('git', ['status', '--porcelain']);
  const status = result.stdout === '' ? 'clean' : 'dirty';

  if (status === 'clean') {
    return true;
  }

  console.log(`${chalk.bold('Warning!')} Your git working tree is ${chalk.red('dirty')}.`);
  console.log(`It's recommended to ${chalk.bold('commit all your changes before proceeding')}, so you can revert the changes made by this command if necessary.`);

  const { useDirtyGit } = await inquirer.prompt({
    type: 'confirm',
    name: 'useDirtyGit',
    message: `Would you like to proceed?`,
    default: false,
  });

  console.log();

  return useDirtyGit;
}

async function updateDocsAsync(options: Options) {
  console.log(`Updating ${chalk.cyan('react-native-website')} submodule...`);

  await spawnAsync('git', ['checkout', 'master'], { cwd: RN_REPO_DIR });
  await spawnAsync('git', ['pull'], { cwd: RN_REPO_DIR });

  try {
    await spawnAsync('git', ['checkout', options.from], { cwd: RN_REPO_DIR });
  } catch (error) {
    throw new Error(`The --from commit "${options.from}" doesn't exists in the submodule.`);
  }

  try {
    await spawnAsync('git', ['checkout', options.to], { cwd: RN_REPO_DIR });
  } catch (error) {
    throw new Error(`The --to commit "${options.to}" doesn't exists in the submodule.`);
  }
}

async function getLocalFilesAsync(options: Options) {
  console.log(`Resolving local docs from ${chalk.yellow(options.sdk)} folder...`);

  const versionedDocsPath = path.join(SDK_DOCS_DIR, options.sdk, 'react-native');
  const files = await fs.promises.readdir(versionedDocsPath);

  return files.map(entry => entry.replace('.md', ''));
}

async function getUpstreamFilesAsync(options: Options) {
  console.log(`Resolving upstream docs from ${chalk.cyan('react-native-website')} submodule...`);

  const sidebarPath = path.join(RN_WEBSITE_DIR, 'sidebars.json');
  const sidebarData = await fs.readJson(sidebarPath);

  let relevantNestedDocs: any[] = [];
  try {
    relevantNestedDocs = [
      ...sidebarData.api.APIs,
      ...sidebarData.components['Core Components'],
      ...sidebarData.components.Props,
    ];
  } catch (error) {
    console.log();
    console.log(`There was an ${chalk.red('error')} extracting the sidebar information.`);
    console.log(`Please double-check the sidebar and update the relevant sections in this script.`);
    console.log(`${chalk.dim(`- ${sidebarPath}`)}`);
    console.log();
    throw error;
  }

  const upstreamDocs: any[] = [];
  const relevantDocs: any = relevantNestedDocs.map(entry => {
    if (typeof entry === 'object' && Array.isArray(entry.ids)) {
      return entry.ids;
    }

    if (typeof entry === 'string') {
      return entry;
    }
  });

  for (const entry of relevantDocs.flat()) {
    const docExists = await fs.pathExists(path.join(RN_DOCS_DIR, `${entry}.md`));
    const docIsIgnored = DOCS_IGNORED.includes(entry);

    if (docExists && !docIsIgnored) {
      upstreamDocs.push(entry);
    }
  }

  return upstreamDocs;
}

function getDocsSummary(localFiles: string[], upstreamFiles: string[]): DocsSummary {
  const removed = localFiles.filter(entry => !upstreamFiles.includes(entry));
  const added = upstreamFiles.filter(entry => !localFiles.includes(entry));

  const changed = upstreamFiles.filter(entry => (
    !(removed.includes(entry) || added.includes(entry))
  ));

  return { removed, added, changed };
}

async function applyRemovedFilesAsync(options: Options, summary: DocsSummary) {
  if (!summary.removed.length) {
    return console.log(`Upstream did not ${chalk.red('remove')} any files`);
  }

  for (const entry of summary.removed) {
    if (entry.startsWith(PREFIX_REMOVED)) {
      continue;
    }

    const sdkDocsDir = path.join(SDK_DOCS_DIR, options.sdk, 'react-native');

    await fs.move(
      path.join(sdkDocsDir, `${entry}.md`),
      path.join(sdkDocsDir, `${PREFIX_REMOVED}${entry}.md`),
    );
  }

  console.log(`Upstream ${chalk.red(`removed ${summary.removed.length} files`)}, see "${PREFIX_REMOVED}*.md" files.`);
}

async function applyAddedFilesAsync(options: Options, summary: DocsSummary) {
  if (!summary.added.length) {
    return console.log(`Upstream did not ${chalk.green('add')} any files`);
  }

  for (const entry of summary.added) {
    if (entry.startsWith(PREFIX_ADDED)) {
      continue;
    }

    await fs.copyFile(
      path.join(RN_DOCS_DIR, `${entry}.md`),
      path.join(SDK_DOCS_DIR, options.sdk, 'react-native', `${PREFIX_ADDED}${entry}.md`),
    );
  }

  console.log(`Upstream ${chalk.green(`added ${summary.removed.length} files`)}, see "${PREFIX_ADDED}*.md" files.`);
}

async function applyChangedFilesAsync(options: Options, summary: DocsSummary) {
  if (!summary.changed.length) {
    return console.log(`Upstream did not ${chalk.yellow('change')} any files`);
  }

  for (const entry of summary.changed) {
    const diffPath = path.join(SDK_DOCS_DIR, options.sdk, 'react-native', `${entry}.diff`);

    const { output: diff } = await spawnAsync('git', ['format-patch', `${options.from}..HEAD`, '--relative', `${entry}.md`, '--stdout'], { cwd: RN_DOCS_DIR });
    await fs.writeFile(diffPath, diff.join(''));
  }

  console.log(`Upstream ${chalk.yellow(`changed ${summary.changed.length} files`)}, see "*.diff" files.`);
}

export default (program) => {
  program
    .command('update-react-native-docs')
    .option('--sdk <string>', 'SDK version to merge with (e.g. `unversioned` or `37.0.0`)')
    .option('--from <commit>', 'React Native Docs commit to start from')
    .option('--to <commit>', 'React Native Docs commit to end at (defaults to `master`)')
    .description(`Fetches the React Native Docs changes in the commit range and create diffs to manually merge it.`)
    .asyncAction(action);
};
