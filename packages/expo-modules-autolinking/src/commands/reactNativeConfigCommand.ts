import commander from 'commander';

import {
  AutolinkingCommonArguments,
  mergeLinkingOptionsAsync,
  registerAutolinkingArguments,
} from './autolinkingOptions';
import { createReactNativeConfigAsync } from '../reactNativeConfig';

interface ReactNativeConfigArguments extends AutolinkingCommonArguments {
  sourceDir?: string | null;
  json?: boolean | null;
}

/** The react-native-config command (like RN CLI linking) */
export function reactNativeConfigCommand() {
  return registerAutolinkingArguments(commander.command('react-native-config [searchPaths...]'))
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
      const options = await mergeLinkingOptionsAsync({ ...commandArguments, searchPaths });
      // TODO(@kitten): Replace projectRoot path
      const reactNativeConfig = createReactNativeConfigAsync({ ...options, platform });
      if (options.json) {
        console.log(JSON.stringify(reactNativeConfig));
      } else {
        console.log(require('util').inspect(reactNativeConfig, false, null, true));
      }
    });
}
