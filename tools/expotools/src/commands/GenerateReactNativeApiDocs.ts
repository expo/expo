import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { Directories } from '../expotools';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();
const DOCS_DIR = path.join(EXPO_DIR, 'docs');
const RN_WEBSITE_DIR = path.join(DOCS_DIR, 'react-native-website');

const DOCS_IGNORED = [
  'appregistry',
  'settings',
  'systrace',
  'linking',
  'permissionsandroid',
  'pushnotificationios',
];

async function action(options: Options) {
  if (!options.sdk) {
    throw new Error('Must run with `--sdk SDK_VERSION` to know which SDK version the docs belongs to.');
  }

  if (!options.rn) {
    throw new Error('Must run with `--rn RN_VERSION` to know what docs version to use.');
  }

  if (!options.from) {
    throw new Error('Must run with `--from RN_COMMIT` to know the start of the changes.');
  }

  // todo: check if git state is clean, if not warn. we are creating intentional merge conflicts in files.
  // todo: implement commit cursor to avoid asking the same commit over and over, and update this to latest master state when finished
  // todo: check if `from` is a valid commit id
  // todo: maybe implement `to` as end range, with a default value of `head`?

  await updateDocsAsync();

  const summary = getDocsSummary(
    await getDocsLocalFilesAsync(options),
    await getDocsUpstreamFilesAsync(options),
  );

  await addDocsUpstreamFilesAsync(options, summary);
  await newPatchLocalWithUpstreamAsync(options, summary);
  await logRemoveDocsLocalFiles(options, summary);
}

async function updateDocsAsync() {
  console.log(`Updating ${chalk.cyan('react-native-website')} submodule...`);

  await spawnAsync('git', ['checkout', 'master'], { cwd: RN_WEBSITE_DIR });
  await spawnAsync('git', ['pull'], { cwd: RN_WEBSITE_DIR });
}

async function getDocsLocalFilesAsync(options: Options) {
  console.log(`Resolving local docs from ${chalk.yellow(options.sdk)} folder...`);

  const versionedDocsPath = path.join(DOCS_DIR, 'pages', 'versions', options.sdk, 'react-native');
  const files = await fs.promises.readdir(versionedDocsPath);

  return files.map(entry => entry.replace('.md', ''));
}

async function getDocsUpstreamFilesAsync(options: Options) {
  console.log(`Resolving upstream docs from ${chalk.cyan('react-native-website')} submodule...`);

  const upstreamPath = path.join(RN_WEBSITE_DIR, 'website', 'versioned_docs', `version-${options.rn}`);
  const sidebarPath = path.join(RN_WEBSITE_DIR, 'website', 'versioned_sidebars', `version-${options.rn}-sidebars.json`);
  const sidebar = await fs.readJSON(sidebarPath);

  const sidebarEntries = sidebar[`version-${options.rn}-api`].APIs.map(entry => {
    if (typeof entry === 'object' && Array.isArray(entry.ids)) {
      return entry.ids;
    }

    if (typeof entry === 'string') {
      return entry;
    }
  });

  const existingFiles: string[] = [];

  for (const entry of sidebarEntries.flat()) {
    const file = entry.replace(`version-${options.rn}-`, '');
    const fileExists = await fs.pathExists(path.join(upstreamPath, `${file}.md`));
    const fileIsIgnored = DOCS_IGNORED.includes(file);

    if (fileExists && !fileIsIgnored) {
      existingFiles.push(file);
    }
  }

  return existingFiles.filter(Boolean);
}

function getDocsSummary(localFiles: string[], upstreamFiles: string[]): DocsSummary {
  const removed = localFiles.filter(entry => !upstreamFiles.includes(entry));
  const added = upstreamFiles.filter(entry => !localFiles.includes(entry));

  // note(cedric): yes, these haven't necessarily changed but we need assume they have for now
  const changed = upstreamFiles.filter(entry => (
    !removed.includes(entry) || !added.includes(entry)
  ));

  return { removed, added, changed };
}

function logRemoveDocsLocalFiles(options: Options, summary: DocsSummary) {
  if (summary.removed.length <= 0) {
    return console.log(chalk`\nUpstream did not {red remove} any files`);
  }

  const entriesTotal = `${summary.removed.length}`;
  console.log(chalk`\nUpstream {red removed ${entriesTotal} entries}, manually delete them if required:`);

  summary.removed.forEach(entry => {
    const entryPath = path.join(DOCS_DIR, 'pages', 'versions', options.sdk, 'react-native', `${entry}.md`);
    console.log(chalk `  {dim - ./${path.relative(process.cwd(), entryPath)}}`);
  });
}

async function addDocsUpstreamFilesAsync(options: Options, summary: DocsSummary) {
  if (summary.added.length <= 0) {
    return console.log(chalk`\nUpstream did not {green add} any files`);
  }

  const entriesTotal = `${summary.added.length}`;
  console.log(chalk`\n Adding {green ${entriesTotal} entries} to local docs...`);

  for (const entry of summary.added) {
    const sourcePath = path.join(RN_WEBSITE_DIR, 'website', 'versioned_docs', `version-${options.rn}`, `${entry}.md`);
    const targetPath = path.join(DOCS_DIR, 'pages', 'versions', options.sdk, 'react-native', `${entry}.md`);

    await fs.copyFile(sourcePath, targetPath);

    console.log(chalk `  {dim - ./${path.relative(process.cwd(), targetPath)}}`);
  }
}

async function newPatchLocalWithUpstreamAsync(options: Options, summary: DocsSummary) {
  if (summary.changed.length <= 0) {
    return console.log(chalk`\nUpstream did {yellow change} any files`);
  }

  const entriesTotal = `${summary.changed.length}`;
  console.log(chalk`\nPatching {yellow ${entriesTotal} entries} in local docs...`);

  const upstreamPath = path.join(RN_WEBSITE_DIR, 'website', 'versioned_docs', `version-${options.rn}`);
  const localPath = path.join(DOCS_DIR, 'pages', 'versions', options.sdk, 'react-native');

  const merged: string[] = [];
  const conflicted: string[] = [];

  for (const entry of summary.changed) {
    const localEntryPath = path.join(localPath, `${entry}.md`);
    const copyEntryPath = path.join(localPath, `${entry}.unpatched.md`);
    const patchPath = path.join(localPath, `${entry}.patch`);

    const { output: patch } = await spawnAsync('git', ['format-patch', `${options.from}..HEAD`, '--relative', `${entry}.md`, '--stdout'], { cwd: upstreamPath });
    await fs.writeFile(patchPath, patch.join(''));

    try {
      await fs.copyFile(localEntryPath, copyEntryPath);
      await spawnAsync('patch', ['--no-backup-if-mismatch', '--merge', `${entry}.md`, `${entry}.patch`], { cwd: localPath });

      await fs.remove(patchPath);
      await fs.remove(copyEntryPath);

      merged.push(localEntryPath);
    } catch (error) {
      conflicted.push(localEntryPath);
    }
  }

  console.log(chalk`\nPatched {yellow ${merged.length + ''} entries} without conflicts:`);
  merged.forEach(entryPath => console.log(chalk`{dim   - ./${path.relative(process.cwd(), entryPath)}}`));

  console.log(chalk`\nPatched {yellow ${conflicted.length + ''} entries} with conflicts and requires manual changes:`);
  conflicted.forEach(entryPath => console.log(chalk`{dim   - ./${path.relative(process.cwd(), entryPath)}}`));
}

interface Options {
  sdk: string;
  rn: string;
  from: string;
}

interface DocsSummary {
  removed: string[];
  added: string[];
  changed: string[];
}

export default (program) => {
  program
    .command('merge-api-docs')
    .option('--sdk <string>', 'SDK version to merge with')
    .option('--rn <string>', 'React Native Docs version to use')
    .option('--from <commit>', 'React Native Docs commit to start from')
    .description(`Fetches the React Native Docs changes between the tags and applies it within a merge.`)
    .asyncAction(action);
};
