#!/usr/bin/env node

import spawnAsync from '@expo/spawn-async';
import { Command } from 'commander';
import downloadTarball from 'download-tarball';
import ejs from 'ejs';
import fs from 'fs-extra';
import path from 'path';
import prompts from 'prompts';

const packageJson = require('../package.json');

// `yarn run` may change the current working dir, then we should use `INIT_CWD` env.
const cwd = process.env.INIT_CWD || process.cwd();

// Ignore some paths. Especially `package.json` as it is rendered
// from `$package.json` file instead of the original one.
const ignoredPaths = ['.DS_Store', 'build', 'node_modules', 'package.json'];

/**
 * Possible command options.
 */
type CommandOptions = {
  target: string;
  source?: string;
  name?: string;
  description?: string;
  package?: string;
  author?: string;
  license?: string;
  repo?: string;
  withReadme: boolean;
  withChangelog: boolean;
};

/**
 * Represents an object that is passed to `ejs` when rendering the template.
 */
type SubstitutionData = {
  project: {
    slug: string;
    name: string;
    version: string;
    description: string;
    package: string;
  };
  author: string;
  license: string;
  repo: string;
};

/**
 * The main function of the command.
 *
 * @param target Path to the directory where to create the module. Defaults to current working dir.
 * @param command An object from `commander`.
 */
async function main(target: string | undefined, options: CommandOptions, command) {
  const targetDir = target ? path.join(cwd, target) : cwd;

  options.target = targetDir;
  await fs.ensureDir(targetDir);

  const packagePath = options.source
    ? path.join(cwd, options.source)
    : await downloadPackageAsync(targetDir);
  const files = await getFilesAsync(packagePath);
  const data = await askForSubstitutionDataAsync(targetDir, options);

  // Iterate through all template files.
  for (const file of files) {
    const renderedRelativePath = ejs.render(file.replace(/^\$/, ''), data, {
      openDelimiter: '{',
      closeDelimiter: '}',
      escape: (value: string) => value.replace('.', path.sep),
    });
    const fromPath = path.join(packagePath, file);
    const toPath = path.join(targetDir, renderedRelativePath);
    const template = await fs.readFile(fromPath, { encoding: 'utf8' });
    const renderedContent = ejs.render(template, data);

    await fs.outputFile(toPath, renderedContent, { encoding: 'utf8' });
  }

  if (!options.source) {
    // Files in the downloaded tarball are wrapped in `package` dir.
    // We should remove it after all.
    await fs.remove(packagePath);
  }
  if (!options.withReadme) {
    await fs.remove(path.join(targetDir, 'README.md'));
  }
  if (!options.withChangelog) {
    await fs.remove(path.join(targetDir, 'CHANGELOG.md'));
  }

  // Build TypeScript files.
  await spawnAsync('npm', ['run', 'build'], {
    cwd: targetDir,
  });
}

/**
 * Recursively scans for the files within the directory. Returned paths are relative to the `root` path.
 */
async function getFilesAsync(root: string, dir: string | null = null): Promise<string[]> {
  const files: string[] = [];
  const baseDir = dir ? path.join(root, dir) : root;

  for (const file of await fs.readdir(baseDir)) {
    const relativePath = dir ? path.join(dir, file) : file;

    if (ignoredPaths.includes(relativePath) || ignoredPaths.includes(file)) {
      continue;
    }

    const fullPath = path.join(baseDir, file);
    const stat = await fs.lstat(fullPath);

    if (stat.isDirectory()) {
      files.push(...(await getFilesAsync(root, relativePath)));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

/**
 * Asks NPM registry for the url to the tarball.
 */
async function getNpmTarballUrl(packageName: string, version: string = 'latest'): Promise<string> {
  const { stdout } = await spawnAsync('npm', ['view', `${packageName}@${version}`, 'dist.tarball']);
  return stdout.trim();
}

/**
 * Gets the username of currently logged in user. Used as a default in the prompt asking for the module author.
 */
async function npmWhoamiAsync(targetDir: string): Promise<string | null> {
  try {
    const { stdout } = await spawnAsync('npm', ['whoami'], { cwd: targetDir });
    return stdout.trim();
  } catch (e) {
    return null;
  }
}

/**
 * Downloads the template from NPM registry.
 */
async function downloadPackageAsync(targetDir: string): Promise<string> {
  const tarballUrl = await getNpmTarballUrl('expo-module-template');

  await downloadTarball({
    url: tarballUrl,
    dir: targetDir,
  });
  return path.join(targetDir, 'package');
}

/**
 * Asks the user for some data necessary to render the template.
 * Some values may already be provided by command options, the prompt is skipped in that case.
 */
async function askForSubstitutionDataAsync(
  targetDir: string,
  options: CommandOptions
): Promise<SubstitutionData> {
  const defaultPackageSlug = path.basename(targetDir);
  const defaultProjectName = defaultPackageSlug
    .replace(/^./, (match) => match.toUpperCase())
    .replace(/\W+(\w)/g, (_, p1) => p1.toUpperCase());

  const { slug } = options.target
    ? { slug: defaultPackageSlug }
    : await prompts({
        type: 'text',
        name: 'slug',
        message: 'What is the package slug?',
        initial: defaultPackageSlug,
      });

  const { name } = options.name
    ? options
    : await prompts({
        type: 'text',
        name: 'name',
        message: 'What is the project name?',
        initial: defaultProjectName,
      });

  const { description } = options.description
    ? options
    : await prompts({
        type: 'text',
        name: 'description',
        message: 'How would you describe the module?',
      });

  const { package: projectPackage } = options.package
    ? options
    : await prompts({
        type: 'text',
        name: 'package',
        message: 'What is the Android package name?',
        initial: `expo.modules.${defaultPackageSlug.replace(/\W/g, '').toLowerCase()}`,
      });

  const { author } = options.author
    ? options
    : await prompts({
        type: 'text',
        name: 'author',
        message: 'Who is the author?',
        initial: (await npmWhoamiAsync(targetDir)) ?? '',
      });

  const { license } = options.license
    ? options
    : await prompts({
        type: 'text',
        name: 'license',
        message: 'What is the license?',
        initial: 'MIT',
      });

  const { repo } = options.repo
    ? options
    : await prompts({
        type: 'text',
        name: 'repo',
        message: 'What is the repository URL?',
      });

  return {
    project: {
      slug,
      name,
      version: '0.1.0',
      description,
      package: projectPackage,
    },
    author,
    license,
    repo,
  };
}

const program = new Command();

program
  .name(packageJson.name)
  .version(packageJson.version)
  .description(packageJson.description)
  .arguments('[target_dir]')
  .option(
    '-s, --source <source_dir>',
    'Local path to the template. By default it downloads `expo-module-template` from NPM.'
  )
  .option('-n, --name <module_name>', 'Name of the native module.')
  .option('-d, --description <description>', 'Description of the module.')
  .option('-p, --package <package>', 'The Android package name.')
  .option('-a, --author <author>', 'The author name.')
  .option('-l, --license <license>', 'The license that the module is distributed with.')
  .option('-r, --repo <repo_url>', 'The URL to the repository.')
  .option('--with-readme', 'Whether to include README.md file.', false)
  .option('--with-changelog', 'Whether to include CHANGELOG.md file.', false)
  .action(main);

program.parse(process.argv);
