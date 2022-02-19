import * as PackageManager from '@expo/package-manager';
import requireGlobal from 'requireg';
import resolveFrom from 'resolve-from';
import semver from 'semver';

import * as Log from '../../../log';
import { delayAsync } from '../../../utils/delay';
import { EXPO_DEBUG } from '../../../utils/env';
import { CommandError } from '../../../utils/errors';
import { confirmAsync } from '../../../utils/prompts';

/** An error that is thrown when a package is installed but doesn't meet the version criteria. */
export class ExternalModuleVersionError extends CommandError {
  constructor(message: string, public readonly shouldGloballyInstall: boolean) {
    super('EXTERNAL_MODULE_VERSION', message);
  }
}

interface PromptOptions {
  /** Should prompt the user to install, when false the module will just assert on missing packages, default `true`. Ignored when `autoInstall` is true. */
  shouldPrompt?: boolean;
  /** Should automatically install the package without prompting, default `false` */
  autoInstall?: boolean;
}

export interface InstallPromptOptions extends PromptOptions {
  /** Should install the package globally, default `false` */
  shouldGloballyInstall?: boolean;
}

export interface ResolvePromptOptions extends PromptOptions {
  /**
   * Prefer to install the package globally, this can be overridden if the function
   * detects that a locally installed package simply needs an upgrade, default `false`
   */
  prefersGlobalInstall?: boolean;
}

/** Resolves a local or globally installed package, prompts to install if missing. */
export class ExternalModule<IModule> {
  private instance: IModule | null = null;

  constructor(
    /** Project root for checking if the package is installed locally. */
    private projectRoot: string,
    /** Info on the external package. */
    private pkg: {
      /** NPM package name. */
      name: string;
      /** Required semver range, ex: `^1.0.0`. */
      versionRange: string;
    },
    /** A function used to create the installation prompt message. */
    private promptMessage: (pkgName: string) => string
  ) {}

  /** Resolve the globally or locally installed instance, or prompt to install. */
  async resolveAsync({
    prefersGlobalInstall,
    ...options
  }: ResolvePromptOptions = {}): Promise<IModule> {
    try {
      return (
        this.getVersioned() ??
        this.installAsync({
          ...options,
          shouldGloballyInstall: prefersGlobalInstall,
        })
      );
    } catch (error: any) {
      if (error instanceof ExternalModuleVersionError) {
        // If the module version in not compliant with the version range,
        // we should prompt the user to install the package where it already exists.
        return this.installAsync({
          ...options,
          shouldGloballyInstall: error.shouldGloballyInstall ?? prefersGlobalInstall,
        });
      }
      throw error;
    }
  }

  /** Prompt the user to install the package and try again. */
  async installAsync({
    shouldPrompt = true,
    autoInstall,
    shouldGloballyInstall,
  }: InstallPromptOptions = {}): Promise<IModule> {
    const packageName = [this.pkg.name, this.pkg.versionRange].join('@');
    if (!autoInstall) {
      // Delay the prompt so it doesn't conflict with other dev tool logs
      await delayAsync(100);
    }
    const answer =
      autoInstall ||
      (shouldPrompt &&
        (await confirmAsync({
          message: this.promptMessage(packageName),
          initial: true,
        })));
    if (answer) {
      Log.log(`Installing ${packageName}...`);

      // Always use npm for global installs
      const packageManager = shouldGloballyInstall
        ? new PackageManager.NpmPackageManager({
            cwd: this.projectRoot,
            log: Log.log,
            silent: !EXPO_DEBUG,
          })
        : PackageManager.createForProject(this.projectRoot, {
            silent: !EXPO_DEBUG,
          });

      try {
        if (shouldGloballyInstall) {
          await packageManager.addGlobalAsync(packageName);
        } else {
          await packageManager.addDevAsync(packageName);
        }
        Log.log(`Installed ${packageName}`);
      } catch (e) {
        e.message = `Failed to install ${packageName} ${
          shouldGloballyInstall ? 'globally' : 'locally'
        }: ${e.message}`;
        throw e;
      }
      return await this.resolveAsync({ shouldPrompt: false });
    }

    throw new CommandError(
      'EXTERNAL_MODULE_AVAILABILITY',
      `Please install ${packageName} and try again`
    );
  }

  /** Get the module. */
  get(): IModule | null {
    try {
      return this.getVersioned();
    } catch {
      return null;
    }
  }

  /** Get the module, throws if the module is not versioned correctly. */
  getVersioned(): IModule | null {
    if (!this.instance) {
      this.instance = this._resolveModule(true) ?? this._resolveModule(false);
    }

    return this.instance ?? null;
  }

  /** Exposed for testing. */
  _require(moduleId: string): any {
    return require(moduleId);
  }

  /** Resolve a copy that's installed in the project. Exposed for testing. */
  _resolveLocal(moduleId: string): string {
    return resolveFrom(this.projectRoot, moduleId);
  }

  /** Resolve a copy that's installed globally. Exposed for testing. */
  _resolveGlobal(moduleId: string): string {
    return requireGlobal.resolve(moduleId);
  }

  /** Resolve the module and verify the version. Exposed for testing. */
  _resolveModule(isLocal: boolean): IModule | null {
    const resolver = isLocal ? this._resolveLocal : this._resolveGlobal;
    try {
      const packageJsonPath = resolver(`${this.pkg.name}/package.json`);
      const packageJson = this._require(packageJsonPath);
      if (packageJson) {
        if (semver.satisfies(packageJson.version, this.pkg.versionRange)) {
          const modulePath = resolver(this.pkg.name);
          return this._require(modulePath);
        }
        throw new ExternalModuleVersionError(
          `Required module '${this.pkg.name}@${packageJson.version}' does not satisfy ${this.pkg.versionRange}. Installed at: ${packageJsonPath}`,
          !isLocal
        );
      }
    } catch (e) {
      if (e instanceof ExternalModuleVersionError) {
        throw e;
      }
      Log.debug('[External Module] Failed to resolve module', e);
      return null;
    }
  }
}
