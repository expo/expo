import { ExpoConfig } from '@expo/config';
import fs from 'fs/promises';
import path from 'path';

import { updateTSConfigAsync } from './updateTSConfig';
import * as Log from '../../../log';
import { fileExistsAsync } from '../../../utils/dir';
import { env } from '../../../utils/env';
import { memoize } from '../../../utils/fn';
import { everyMatchAsync, wrapGlobWithTimeout } from '../../../utils/glob';
import { ProjectPrerequisite } from '../Prerequisite';
import { ensureDependenciesAsync } from '../dependencies/ensureDependenciesAsync';

const debug = require('debug')('expo:doctor:typescriptSupport') as typeof console.log;

const warnDisabled = memoize(() => {
  Log.warn('Skipping TypeScript setup: EXPO_NO_TYPESCRIPT_SETUP is enabled.');
});

/** Ensure the project has the required TypeScript support settings. */
export class TypeScriptProjectPrerequisite extends ProjectPrerequisite<boolean> {
  /**
   * Ensure a project that hasn't explicitly disabled typescript support has all the required packages for running in the browser.
   *
   * @returns `true` if the setup finished and no longer needs to be run again.
   */
  async assertImplementation(): Promise<boolean> {
    if (env.EXPO_NO_TYPESCRIPT_SETUP) {
      warnDisabled();
      return true;
    }
    debug('Ensuring TypeScript support is setup');

    const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');

    // Ensure the project is TypeScript before continuing.
    const intent = await this._getSetupRequirements();
    if (!intent) {
      return false;
    }

    // Ensure TypeScript packages are installed
    await this._ensureDependenciesInstalledAsync();

    // Update the config
    await updateTSConfigAsync({ tsConfigPath });

    return true;
  }

  async bootstrapAsync(): Promise<void> {
    if (env.EXPO_NO_TYPESCRIPT_SETUP) {
      warnDisabled();
      return;
    }
    // Ensure TypeScript packages are installed
    await this._ensureDependenciesInstalledAsync({
      skipPrompt: true,
      isProjectMutable: true,
    });

    const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');

    // Update the config
    await updateTSConfigAsync({ tsConfigPath });
  }

  /** Exposed for testing. */
  async _getSetupRequirements(): Promise<{
    /** Indicates that TypeScript support is being bootstrapped. */
    isBootstrapping: boolean;
  } | null> {
    const tsConfigPath = await this._hasTSConfig();

    // Enable TS setup if the project has a `tsconfig.json`
    if (tsConfigPath) {
      const content = await fs.readFile(tsConfigPath, { encoding: 'utf8' }).then(
        (txt) => txt.trim(),
        // null when the file doesn't exist.
        () => null
      );
      const isBlankConfig = content === '' || content === '{}';
      return { isBootstrapping: isBlankConfig };
    }
    // This is a somewhat heavy check in larger projects.
    // Test that this is reasonably paced by running expo start in `expo/apps/native-component-list`
    const typescriptFile = await this._queryFirstTypeScriptFileAsync();
    if (typescriptFile) {
      return { isBootstrapping: true };
    }

    return null;
  }

  /** Exposed for testing. */
  async _ensureDependenciesInstalledAsync({
    exp,
    skipPrompt,
    isProjectMutable,
  }: {
    exp?: ExpoConfig;
    skipPrompt?: boolean;
    isProjectMutable?: boolean;
  } = {}): Promise<boolean> {
    try {
      return await ensureDependenciesAsync(this.projectRoot, {
        exp,
        skipPrompt,
        isProjectMutable,
        installMessage: `It looks like you're trying to use TypeScript but don't have the required dependencies installed.`,
        warningMessage:
          "If you're not using TypeScript, please remove the TypeScript files from your project",
        requiredPackages: [
          // use typescript/package.json to skip node module cache issues when the user installs
          // the package and attempts to resolve the module in the same process.
          { file: 'typescript/package.json', pkg: 'typescript' },
          { file: '@types/react/package.json', pkg: '@types/react' },
        ],
      });
    } catch (error) {
      // Reset the cached check so we can re-run the check if the user re-runs the command by pressing 'w' in the Terminal UI.
      this.resetAssertion();
      throw error;
    }
  }

  /** Return the first TypeScript file in the project. */
  async _queryFirstTypeScriptFileAsync(): Promise<null | string> {
    const results = await wrapGlobWithTimeout(
      () =>
        // TODO(Bacon): Use `everyMatch` since a bug causes `anyMatch` to return inaccurate results when used multiple times.
        everyMatchAsync('**/*.@(ts|tsx)', {
          cwd: this.projectRoot,
          ignore: [
            '**/@(Carthage|Pods|node_modules)/**',
            '**/*.d.ts',
            '@(ios|android|web|web-build|dist)/**',
          ],
        }),
      5000
    );

    if (results === false) {
      return null;
    }
    return results[0] ?? null;
  }

  async _hasTSConfig(): Promise<string | null> {
    const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
    if (await fileExistsAsync(tsConfigPath)) {
      return tsConfigPath;
    }
    return null;
  }
}
