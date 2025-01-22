import JsonFile, { JSONObject } from '@expo/json-file';
import fs from 'fs/promises';
import path from 'path';

import { Log } from '../log';
import { PrerequisiteCommandError, ProjectPrerequisite } from '../start/doctor/Prerequisite';
import { ensureDependenciesAsync } from '../start/doctor/dependencies/ensureDependenciesAsync';
import { findFileInParents } from '../utils/findUp';
import { isInteractive } from '../utils/interactive';
import { confirmAsync } from '../utils/prompts';

const debug = require('debug')('expo:lint') as typeof console.log;

// TODO(cedric): if we want to add prettier, also configure proper prettier rules
// const ESLINT_TEMPLATE_PRETTIER = `// https://docs.expo.dev/guides/using-eslint/
// module.exports = {
//   extends: ['expo', 'prettier'],
//   plugins: ['prettier'],
//   rules: {
//     'prettier/prettier': ['warn'],
//   },
// };
// `;

/** Ensure the project has the required ESlint config. */
export class ESLintProjectPrerequisite extends ProjectPrerequisite<boolean> {
  async assertImplementation(): Promise<boolean> {
    const hasEslintConfig = await isEslintConfigured(this.projectRoot);
    const hasLegacyConfig = await isLegacyEslintConfigured(this.projectRoot);
    const hasLintScript = await lintScriptIsConfigured(this.projectRoot);

    if (hasLegacyConfig) {
      Log.warn(`Using legacy ESLing config. Consider upgrading to flat config.`);
    }

    return (hasEslintConfig || hasLegacyConfig) && hasLintScript;
  }

  async bootstrapAsync(): Promise<boolean> {
    debug('Setting up ESLint');

    const hasEslintConfig = await isEslintConfigured(this.projectRoot);
    if (!hasEslintConfig) {
      if (!isInteractive()) {
        Log.warn(`No ESLint config found. Configuring automatically.`);
      } else {
        const shouldSetupLint = await confirmAsync({
          message: 'No ESLint config found. Install and configure ESLint in this project?',
        });
        if (!shouldSetupLint) {
          throw new PrerequisiteCommandError('ESLint is not configured for this project.');
        }
      }

      // TODO(cedric): if we want to add prettier, also configure proper prettier rules
      // const shouldIncludePrettier = await confirmAsync({
      //   message: 'Include Prettier?',
      // });

      // if (shouldIncludePrettier) {
      //   packages.push({ file: 'prettier/package.json', pkg: 'prettier', dev: true });
      //   packages.push({
      //     file: 'eslint-config-prettier/package.json',
      //     pkg: 'eslint-config-prettier',
      //     dev: true,
      //   });
      //   packages.push({
      //     file: 'eslint-plugin-prettier/package.json',
      //     pkg: 'eslint-plugin-prettier',
      //     dev: true,
      //   });
      // }

      await this._ensureDependenciesInstalledAsync({ skipPrompt: true, isProjectMutable: true });

      // TODO(cedric): if we want to add prettier, also configure proper prettier rules
      // if (shouldIncludePrettier) {
      //   await fs.writeFile(path.join(this.projectRoot, '.prettierrc'), '{}', 'utf8');
      // }

      await fs.writeFile(
        path.join(this.projectRoot, 'eslint.config.mjs'),
        await fs.readFile(require.resolve(`@expo/cli/static/template/eslint.config.mjs`), 'utf8'),
        'utf8'
      );
    }

    const hasLintScript = await lintScriptIsConfigured(this.projectRoot);
    if (!hasLintScript) {
      const scripts = JsonFile.read(path.join(this.projectRoot, 'package.json')).scripts;
      await JsonFile.setAsync(
        path.join(this.projectRoot, 'package.json'),
        'scripts',
        typeof scripts === 'object' ? { ...scripts, lint: 'eslint .' } : { lint: 'eslint .' },
        { json5: false }
      );
    }

    Log.log();
    Log.log('ESlint has been configured 🎉');
    Log.log();

    return true;
  }

  async _ensureDependenciesInstalledAsync({
    skipPrompt,
    isProjectMutable,
  }: {
    skipPrompt?: boolean;
    isProjectMutable?: boolean;
  }): Promise<boolean> {
    try {
      return await ensureDependenciesAsync(this.projectRoot, {
        skipPrompt,
        isProjectMutable,
        installMessage: 'ESLint is required to lint your project.',
        warningMessage: 'ESLint not installed, unable to set up linting for your project.',
        requiredPackages: [
          { version: '^9.0.0', pkg: 'eslint', file: 'eslint/package.json', dev: true },
          {
            version: '8.0.2-canary-20250122-166c2cb',
            pkg: 'eslint-config-expo',
            file: 'eslint-config-expo/package.json',
            dev: true,
          },
        ],
      });
    } catch (error) {
      this.resetAssertion();
      throw error;
    }
  }
}

async function isLegacyEslintConfigured(projectRoot: string) {
  debug('Checking for legacy ESlint configuration', projectRoot);

  const packageFile = await JsonFile.readAsync(path.join(projectRoot, 'package.json'));
  if (
    typeof packageFile.eslintConfig === 'object' &&
    Object.keys(packageFile.eslintConfig as JSONObject).length > 0
  ) {
    debug('Found legacy ESlint config in package.json');
    return true;
  }

  const eslintConfigFiles = [
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.yaml',
    '.eslintrc.yml',
    '.eslintrc.json',
  ];
  for (const configFile of eslintConfigFiles) {
    const configPath = findFileInParents(projectRoot, configFile);
    const configIsEmpty = configPath ? await eslintConfigIsEmpty(configPath) : null;

    if (configPath && !configIsEmpty) {
      debug('Found ESlint config file:', configPath);
      return true;
    } else if (configPath && configIsEmpty) {
      debug('Skipping empty ESlint config file:', configPath);
    }
  }

  return false;
}

// check for flat config
async function isEslintConfigured(projectRoot: string) {
  debug('Ensuring ESlint is configured in', projectRoot);

  const eslintConfigFiles = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs'];
  for (const configFile of eslintConfigFiles) {
    const configPath = findFileInParents(projectRoot, configFile);
    const configIsEmpty = configPath ? await eslintConfigIsEmpty(configPath) : null;

    if (configPath && !configIsEmpty) {
      debug('Found ESlint config file:', configPath);
      return true;
    } else if (configPath && configIsEmpty) {
      debug('Skipping empty ESlint config file:', configPath);
    }
  }

  return false;
}

/** Determine if the eslint config file is empty. */
async function eslintConfigIsEmpty(filePath: string) {
  const content = await fs.readFile(filePath, 'utf8').then(
    (text) => text.trim().replaceAll(/\s|\r\n|\n|\r/g, ''),
    () => null
  );

  return (
    !content ||
    content === '{}' || // .eslintrc.json
    content === '---' || // .eslintrc.yaml / .eslintrc.yml
    content.startsWith('module.exports={}') || // .eslintrc.js / .eslintrc.cjs / eslint.config.js / eslint.config.cjs
    content.startsWith('exportdefault{}') || // .eslint.config.mjs
    content.startsWith('exportdefault[]') // .eslint.config.mjs
  );
}

async function lintScriptIsConfigured(projectRoot: string) {
  const packageFile = await JsonFile.readAsync(path.join(projectRoot, 'package.json'));
  return typeof (packageFile.scripts as JSONObject | undefined)?.lint === 'string';
}
