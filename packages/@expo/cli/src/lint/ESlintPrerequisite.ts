import JsonFile, { JSONObject } from '@expo/json-file';
import fs from 'fs/promises';
import path from 'path';

import { Log } from '../log';
import { PrerequisiteCommandError, ProjectPrerequisite } from '../start/doctor/Prerequisite';
import { ensureDependenciesAsync } from '../start/doctor/dependencies/ensureDependenciesAsync';
import { ResolvedPackage } from '../start/doctor/dependencies/getMissingPackages';
import { findFileInParents } from '../utils/findUp';
import { confirmAsync } from '../utils/prompts';

const debug = require('debug')('expo:lint') as typeof console.log;

const WITH_PRETTIER = `module.exports = {
  root: true,
  extends: ["expo", "prettier"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": ["warn"],
  },
};

`;

// const ESLINT_ONLY = `module.exports = {
//   root: true,
//   extends: ["expo"]
// };
// `;

const ESLINT_ONLY = `// <insert link to docs>
module.exports = {
  extends: 'expo',
};
`;

/** Ensure the project has the required ESlint config. */
export class ESLintProjectPrerequisite extends ProjectPrerequisite<boolean> {
  async assertImplementation(): Promise<boolean> {
    let shouldConfigure = false;

    const hasEslintConfig = await eslintIsConfigured(this.projectRoot);
    if (!hasEslintConfig) {
      shouldConfigure = await confirmAsync({
        message: 'Do you want to install and configure ESLint in this project?',
      });

      if (!shouldConfigure) {
        throw new PrerequisiteCommandError('ESLINT_SETUP_ABORTED', 'ESLint is not configured.');
      }

      // TODO(cedric): maybe ask user to install prettier
      // TODO(cedric): maybe install in root project workspace
      await fs.writeFile(path.join(this.projectRoot, '.eslintrc.js'), ESLINT_ONLY, 'utf8');
    }

    await this._ensureDependenciesInstalledAsync({ skipPrompt: shouldConfigure });

    return true;
  }

  async bootstrapAsync(): Promise<boolean> {
    const shouldSetupLint = await confirmAsync({
      message: 'No ESLint config found. Install and configure ESLint in this project?',
    });

    if (!shouldSetupLint) {
      return false;
    }

    const shouldIncludePrettier = await confirmAsync({
      message: 'Include Prettier?',
    });

    const packages: ResolvedPackage[] = [
      { file: 'eslint/package.json', pkg: 'eslint', dev: true },
      {
        file: 'eslint-config-expo/package.json',
        pkg: 'eslint-config-expo',
        version: '7.0.0',
        dev: true,
      },
    ];

    if (shouldIncludePrettier) {
      packages.push({ file: 'prettier/package.json', pkg: 'prettier', dev: true });
      packages.push({
        file: 'eslint-config-prettier/package.json',
        pkg: 'eslint-config-prettier',
        dev: true,
      });
      packages.push({
        file: 'eslint-plugin-prettier/package.json',
        pkg: 'eslint-plugin-prettier',
        dev: true,
      });
    }

    await this._ensureDependenciesInstalledAsync({ requiredPackages: packages });

    await fs.writeFile(
      path.join(this.projectRoot, '.eslintrc.js'),
      shouldIncludePrettier ? WITH_PRETTIER : ESLINT_ONLY,
      'utf8'
    );

    if (shouldIncludePrettier) {
      await fs.writeFile(path.join(this.projectRoot, '.prettierrc'), '{}', 'utf8');
    }

    const scripts = JsonFile.read(path.join(this.projectRoot, 'package.json')).scripts;

    if ((scripts as JSONObject)?.lint) {
      Log.log('Skipped adding the lint script as one exists already');
    } else {
      await JsonFile.setAsync(
        path.join(this.projectRoot, 'package.json'),
        'scripts',
        typeof scripts === 'object' ? { ...scripts, lint: 'eslint .' } : { lint: 'eslint .' },
        { json5: false }
      );
    }

    Log.log();
    Log.log('Your ESlint config has been set up 🎉');

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
          { version: '^8.10.0', pkg: 'eslint', file: 'eslint/package.json', dev: true },
          {
            version: '^7.0.0',
            pkg: 'eslint-config-expo',
            file: 'eslint-config-expo/package.json',
            dev: true,
          },
        ],
      });
    } catch (error) {
      throw error;
    }
  }
}

async function eslintIsConfigured(projectRoot: string) {
  debug('Ensuring ESlint is configured in', projectRoot);

  // TODO(cedric): maybe add find up logic to `package.json` too?
  const packageFile = await JsonFile.readAsync(path.join(projectRoot, 'package.json'));
  if (
    typeof packageFile.eslintConfig === 'object' &&
    Object.keys(packageFile.eslintConfig as JSONObject).length > 0
  ) {
    debug('Found ESlint config in package.json');
    return true;
  }

  const eslintConfigFiles = [
    // See: https://eslint.org/docs/latest/use/configure/configuration-files-deprecated
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.yaml',
    '.eslintrc.yml',
    '.eslintrc.json',
    // NOTE(cedric): our config plugins are incompatible with ESLint v9's flat config
    // See: https://eslint.org/docs/latest/use/configure/configuration-files
    // 'eslint.config.js',
    // 'eslint.config.mjs',
    // 'eslint.config.cjs',
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
