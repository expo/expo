import commander from 'commander';

import {
  AutolinkingCommonArguments,
  createAutolinkingOptionsLoader,
  registerAutolinkingArguments,
} from './autolinkingOptions';
import { createReactNativeConfigAsync } from '../reactNativeConfig';

interface ReactNativeConfigArguments extends AutolinkingCommonArguments {
  sourceDir?: string | null;
  json?: boolean | null;
}

/** The react-native-config command (like RN CLI linking) */
export function reactNativeConfigCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(cli.command('react-native-config [searchPaths...]'))
    .option(
      '-p, --platform [platform]',
      'The platform that the resulting modules must support. Available options: "android", "ios"',
      'ios'
    )
    .option('--source-dir <sourceDir>', 'The path to the native source directory')
    .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
    .action(async (searchPaths: string[] | null, commandArguments: ReactNativeConfigArguments) => {
      // TODO(@kitten): Do we need to restrict this?
      const platform = commandArguments.platform ?? 'ios';
      if (platform !== 'android' && platform !== 'ios') {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      const autolinkingOptionsLoader = createAutolinkingOptionsLoader({
        ...commandArguments,
        searchPaths,
      });

      const reactNativeConfig = await createReactNativeConfigAsync({
        autolinkingOptions: await autolinkingOptionsLoader.getPlatformOptions(platform),
        appRoot: await autolinkingOptionsLoader.getAppRoot(),
        // NOTE(@kitten): This is currently not validated, and assumed to be validated later
        sourceDir: commandArguments.sourceDir ?? undefined,
      });

      if (commandArguments.json) {
        console.log(JSON.stringify(reactNativeConfig));
      } else {
        console.log(require('util').inspect(reactNativeConfig, false, null, true));
      }
    });
}
