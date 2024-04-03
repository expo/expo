import JsonFile, { JSONObject } from '@expo/json-file';
import fs from 'fs/promises';
import path from 'path';

import { Log } from '../log';
import { ProjectPrerequisite } from '../start/doctor/Prerequisite';
import { ensureDependenciesAsync } from '../start/doctor/dependencies/ensureDependenciesAsync';
import { ResolvedPackage } from '../start/doctor/dependencies/getMissingPackages';
import { fileExistsAsync } from '../utils/dir';
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

const ESLINT_ONLY = `module.exports = {
  root: true,
  extends: ["expo"]
};
`;

/** Ensure the project has the required ESlint config. */
export class ESLintProjectPrerequisite extends ProjectPrerequisite<boolean> {
  async assertImplementation(): Promise<boolean> {
    debug('Ensuring ESlint is set up');

    const config = await this._hasESLintSetup();
    if (!config) {
      return false;
    }

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
    requiredPackages,
    skipPrompt,
    isProjectMutable,
  }: {
    requiredPackages: ResolvedPackage[];
    skipPrompt?: boolean;
    isProjectMutable?: boolean;
  }): Promise<boolean> {
    try {
      return await ensureDependenciesAsync(this.projectRoot, {
        skipPrompt,
        isProjectMutable,
        installMessage: 'Required to finish setting up your ESLint config.',
        warningMessage: 'Packages not installed. Unable to finish setting up ESLint.',
        requiredPackages,
      });
    } catch (error) {
      throw error;
    }
  }

  async _hasESLintSetup(): Promise<boolean> {
    const eslintConfigPath = path.join(this.projectRoot, '.eslintrc.js');
    if (!(await fileExistsAsync(eslintConfigPath))) {
      return false;
    }
    const scripts = JsonFile.read(path.join(this.projectRoot, 'package.json')).scripts;

    const lintScript = (scripts as JSONObject)?.lint;

    if (!lintScript) {
      Log.error(
        'No "lint" script found in package.json, add a "lint" script (e.g. eslint .) and try again'
      );
      return false;
    }
    return true;
  }
}
