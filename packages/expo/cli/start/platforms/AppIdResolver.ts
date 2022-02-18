import { getConfig, getProjectConfigDescriptionWithPaths } from '@expo/config';

import { CommandError, UnimplementedError } from '../../utils/errors';
import { get } from '../../utils/obj';

export class AppIdResolver {
  constructor(
    protected projectRoot: string,
    protected platform: string,
    protected configProperty: string
  ) {}

  async getAppIdAsync(): Promise<string> {
    if (await this.hasNativeProjectAsync()) {
      return this.getAppIdFromNativeAsync();
    }
    return this.getAppIdFromConfigAsync();
  }

  async hasNativeProjectAsync(): Promise<boolean> {
    throw new UnimplementedError();
  }

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

  async resolveAppIdFromNativeAsync(): Promise<string | null> {
    throw new UnimplementedError();
  }

  async getAppIdFromNativeAsync(): Promise<string> {
    const appId = await this.resolveAppIdFromNativeAsync();
    if (!appId) {
      throw new CommandError(
        'NO_APP_ID',
        `Failed to locate the ${this.platform} application identifier in the '${this.platform}/' folder. This is required to open the app.`
      );
    }
    return appId;
  }
}
