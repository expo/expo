import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer, { QuestionCollection } from 'inquirer';
import path from 'path';

import { GitDirectory } from '../Git';
import logger from '../Logger';
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
const SUFFIX_CHANGED = '.diff';

const DOCS_IGNORED = [
  'appregistry',
  'components-and-apis',
  'drawerlayoutandroid',
  'linking',
  'settings',
  'systrace',
];

const rootRepo = new GitDirectory(path.resolve('.'));
const rnRepo = new GitDirectory(RN_REPO_DIR);
const rnDocsRepo = new GitDirectory(RN_DOCS_DIR);

async function action(input: Options) {
  const options = await getOptions(input);

  if (!(await validateGitStatusAsync())) {
    return;
  }

  await updateDocsAsync(options);

  const summary = getDocsSummary(
    await getLocalFilesAsync(options),
    await getUpstreamFilesAsync(options)
  );

  logger.log();

  await applyAddedFilesAsync(options, summary);
  await applyChangedFilesAsync(options, summary);
  await applyRemovedFilesAsync(options, summary);

  logCompleted(options);
}

async function getOptions(input: Options): Promise<Options> {
  const questions: QuestionCollection[] = [];
  const existingSdks = (await fs.promises.readdir(SDK_DOCS_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name !== 'latest')
    .map((entry) => entry.name.replace(/v([0-9]+)/, '$1'));

  if (input.sdk && !existingSdks.includes(input.sdk)) {
    throw new Error(
      `SDK docs ${input.sdk} does not exist, please create it with "et generate-sdk-docs"`
    );
  }

  if (!input.sdk) {
    questions.push({
      type: 'list',
      name: 'sdk',
      message: 'What Expo SDK version do you want to update?',
      choices: existingSdks,
    });
  }

  if (!input.from) {
    questions.push({
      type: 'input',
      name: 'from',
      message:
        'From which commit of the React Native Website do you want to update? (e.g. 9806ddd)',
      filter: (value: string) => value.trim(),
      validate: (value: string) => value.length !== 0,
    });
  }

  const answers = questions.length > 0 ? await inquirer.prompt(questions) : {};

  return {
    sdk: input.sdk === 'unversioned' ? 'unversioned' : `v${answers.sdk || input.sdk}`,
    from: answers.from || input.from,
    to: input.to || 'main',
  };
}

async function validateGitStatusAsync() {
  logger.info('\n📑 Checking local repository status...');

  const result = await rootRepo.runAsync(['status', '--porcelain']);
  const status = result.stdout === '' ? 'clean' : 'dirty';

  if (status === 'clean') {
    return true;
  }

  logger.warn(`⚠️  Your git working tree is`, chalk.underline('dirty'));
  logger.info(
    `It's recommended to ${chalk.bold(
      'commit all your changes before proceeding'
    )}, so you can revert the changes made by this command if necessary.`
  );

  const { useDirtyGit } = await inquirer.prompt({
    type: 'confirm',
    name: 'useDirtyGit',
    message: `Would you like to proceed?`,
    default: false,
  });

  logger.log();

  return useDirtyGit;
}

async function updateDocsAsync(options: Options) {
  logger.info(`📚 Updating ${chalk.cyan('react-native-website')} submodule...`);

  await rnRepo.runAsync(['checkout', 'main']);
  await rnRepo.pullAsync({});

  if (!(await rnRepo.tryAsync(['checkout', options.from]))) {
    throw new Error(`The --from commit "${options.from}" doesn't exists in the submodule.`);
  }

  if (!(await rnRepo.tryAsync(['checkout', options.to]))) {
    throw new Error(`The --to commit "${options.to}" doesn't exists in the submodule.`);
  }
}

async function getLocalFilesAsync(options: Options) {
  logger.info('🔎 Resolving local docs from', chalk.underline(options.sdk), 'folder...');

  const versionedDocsPath = path.join(SDK_DOCS_DIR, options.sdk, 'react-native');
  const files = await fs.promises.readdir(versionedDocsPath);

  return files
    .filter(
      (entry) =>
        !entry.endsWith(SUFFIX_CHANGED) &&
        !entry.startsWith(PREFIX_ADDED) &&
        !entry.startsWith(PREFIX_REMOVED)
    )
    .map((entry) => entry.replace('.md', ''));
}

async function getUpstreamFilesAsync(options: Options) {
  logger.info(
    '🔎 Resolving upstream docs from',
    chalk.underline('react-native-website'),
    'submodule...'
  );

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
    logger.error('\n🚫 There was an error extracting the sidebar information.');
    logger.info(
      'Please double-check the sidebar and update the "relevantNestedDocs" in this script.'
    );
    logger.info(chalk.dim(`./${path.relative(process.cwd(), sidebarPath)}\n`));
    throw error;
  }

  const upstreamDocs: any[] = [];
  const relevantDocs: any = relevantNestedDocs.map((entry) => {
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
  const removed = localFiles.filter((entry) => !upstreamFiles.includes(entry));
  const added = upstreamFiles.filter((entry) => !localFiles.includes(entry));

  const changed = upstreamFiles.filter(
    (entry) => !(removed.includes(entry) || added.includes(entry))
  );

  return { removed, added, changed };
}

async function applyRemovedFilesAsync(options: Options, summary: DocsSummary) {
  if (!summary.removed.length) {
    return logger.info('🤷‍ Upstream did not', chalk.red('remove'), 'any files');
  }

  for (const entry of summary.removed) {
    if (entry.startsWith(PREFIX_REMOVED)) {
      continue;
    }

    const sdkDocsDir = path.join(SDK_DOCS_DIR, options.sdk, 'react-native');

    await fs.move(
      path.join(sdkDocsDir, `${entry}.md`),
      path.join(sdkDocsDir, `${PREFIX_REMOVED}${entry}.md`)
    );
  }

  logger.info(
    '➖ Upstream',
    chalk.underline(`removed ${summary.removed.length} files`),
    `see "${PREFIX_REMOVED}*.md" files.`
  );
}

async function applyAddedFilesAsync(options: Options, summary: DocsSummary) {
  if (!summary.added.length) {
    return logger.info('🤷‍ Upstream did not', chalk.green('add'), 'any files');
  }

  for (const entry of summary.added) {
    if (entry.startsWith(PREFIX_ADDED)) {
      continue;
    }

    await fs.copyFile(
      path.join(RN_DOCS_DIR, `${entry}.md`),
      path.join(SDK_DOCS_DIR, options.sdk, 'react-native', `${PREFIX_ADDED}${entry}.md`)
    );
  }

  logger.info(
    `➕ Upstream ${chalk.underline(
      `added ${summary.added.length} files`
    )}, see "${PREFIX_ADDED}*.md" files.`
  );
}

async function applyChangedFilesAsync(options: Options, summary: DocsSummary) {
  if (!summary.changed.length) {
    return logger.info('🤷‍ Upstream did not', chalk.yellow('change'), 'any files');
  }

  for (const entry of summary.changed) {
    const diffPath = path.join(
      SDK_DOCS_DIR,
      options.sdk,
      'react-native',
      `${entry}${SUFFIX_CHANGED}`
    );

    const { output: diff } = await rnDocsRepo.runAsync([
      'format-patch',
      `${options.from}..HEAD`,
      '--relative',
      `${entry}.md`,
      '--stdout',
    ]);

    await fs.writeFile(diffPath, diff.join(''));
  }

  logger.info(
    '➗ Upstream',
    chalk.underline(`changed ${summary.changed.length} files`),
    `see "*${SUFFIX_CHANGED}" files.`
  );
}

function logCompleted(options: Options): void {
  const versionedDir = path.join(SDK_DOCS_DIR, options.sdk, 'react-native');

  logger.success('\n✅ Update completed.');
  logger.info('Please check the files in the versioned react-native folder.');
  logger.info(
    'To revert the changes, use `git clean -xdf .` and `git checkout .` in the versioned folder:'
  );
  logger.info(chalk.dim(`./${path.relative(process.cwd(), versionedDir)}\n`));
}

export default (program) => {
  program
    .command('update-react-native-docs')
    .option('--sdk <string>', 'SDK version to merge with (e.g. `unversioned` or `37.0.0`)')
    .option('--from <commit>', 'React Native Docs commit to start from')
    .option('--to <commit>', 'React Native Docs commit to end at (defaults to `main`)')
    .description(
      `Fetches the React Native Docs changes in the commit range and create diffs to manually merge it.`
    )
    .asyncAction(action);
};
