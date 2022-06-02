import { getConfig, getProjectConfigDescriptionWithPaths } from '@expo/config';

import { CommandError, UnimplementedError } from '../../utils/errors';
import { get } from '../../utils/obj';

/** Resolves a native app identifier (bundle identifier, package name) from the project files. */
export class AppIdResolver {
  constructor(
    protected projectRoot: string,
    /** Platform to use. */
    protected platform: string,
    /** Nested key in the Expo config like `android.package` or `ios.bundleIdentifier`. */
    protected configProperty: string
  ) {}

  /** Resolve the application ID for the project. */
  async getAppIdAsync(): Promise<string> {
    if (await this.hasNativeProjectAsync()) {
      return this.getAppIdFromNativeAsync();
    }
    return this.getAppIdFromConfigAsync();
  }

  /** Returns `true` if the project has native project code. */
  async hasNativeProjectAsync(): Promise<boolean> {
    throw new UnimplementedError();
  }

  /** Return the app ID from the Expo config or assert. */
  async getAppIdFromConfigAsync(): Promise<string> {
    const config = getConfig(this.projectRoot);

    const appId = get(config.exp, this.configProperty);
    if (!appId) {
      throw new CommandError(
        'NO_APP_ID',
        `Required property '${
          this.configProperty
        }' is not found in the project ${getProjectConfigDescriptionWithPaths(
          this.projectRoot,
          config
        )}. This is required to open the app.`
      );
    }
    return appId;
  }

  /** Return the app ID from the native project files or null if the app ID cannot be found. */
  async resolveAppIdFromNativeAsync(): Promise<string | null> {
    throw new UnimplementedError();
  }

  /** Return the app ID from the native project files or assert. */
  async getAppIdFromNativeAsync(): Promise<string> {
    const appId = await this.resolveAppIdFromNativeAsync();
    if (!appId) {
      throw new CommandError(
        'NO_APP_ID',
        `Failed to locate the ${this.platform} application identifier in the "${this.platform}/" folder. This is required to open the app.`
      );
    }
    return appId;
  }
}
