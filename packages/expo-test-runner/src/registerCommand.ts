import { CommanderStatic } from 'commander';

import { Config } from './Config';
import ConfigReader from './ConfigReader';
import { temporaryDirectory } from './Paths';
import { Platform } from './Platform';

export interface DefaultOptions {
  configFile: string;
  platform: Platform;
  path: string;
  shouldBeCleaned: boolean;
}

function mapPlatform(platform: string): Platform {
  if (platform === 'android') {
    return Platform.Android;
  } else if (platform === 'ios') {
    return Platform.iOS;
  } else if (platform === 'both') {
    return Platform.Both;
  }

  throw new Error(`Unknown platform: ${platform}`);
}

export function registerCommand<OptionsType extends DefaultOptions>(
  commander: CommanderStatic,
  commandName: string,
  fn: (config: Config, options: OptionsType) => Promise<any>
) {
  return commander
    .command(commandName)
    .option('-c, --config <path>', 'Path to the config file.')
    .option(
      '--platform <platform>',
      'Platform for which the project should be created. Available options: `ios`, `android`, `both`.'
    )
    .option('-p, --path <string>', 'Location where the test app will be created.')
    .action(async (providedOptions) => {
      if (providedOptions.platform) {
        providedOptions.platform = mapPlatform(providedOptions.platform);
      } else {
        providedOptions.platform = Platform.Both;
      }

      // clean temp folder if the path wasn't provided.
      providedOptions.shouldBeCleaned = !providedOptions.path;
      providedOptions.path = providedOptions.path ?? temporaryDirectory();

      providedOptions.configFile = ConfigReader.getFilePath(providedOptions.configFile);

      const options = providedOptions as OptionsType;
      const configReader = new ConfigReader(options.configFile);

      try {
        await fn(configReader.readConfigFile(), options);
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    });
}
