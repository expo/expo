import { IOSConfig } from '@expo/config-plugins';
import chalk from 'chalk';

import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import { selectAsync } from '../../../utils/prompts';
import { XcodeConfiguration } from '../XcodeBuild.types';

/** Resolve the native iOS build `scheme` for a given `configuration`. If the `scheme` isn't provided then the user will be prompted to select one. */
export async function resolveNativeSchemeAsync(
  projectRoot: string,
  { scheme, configuration }: { scheme?: string | boolean; configuration?: XcodeConfiguration }
): Promise<{ name: string; osType?: string } | null> {
  const schemes = IOSConfig.BuildScheme.getRunnableSchemesFromXcodeproj(projectRoot, {
    configuration,
  });
  if (!schemes.length) {
    throw new CommandError('BAD_ARGS', 'No native iOS build schemes found');
  }

  if (scheme === true) {
    if (schemes.length === 1) {
      Log.log(`Auto selecting only available scheme: ${schemes[0].name}`);
      return schemes[0];
    }
    const resolvedSchemeName = await selectAsync(
      'Select a scheme',
      schemes.map((value) => {
        const isApp =
          value.type === IOSConfig.Target.TargetType.APPLICATION && value.osType === 'iOS';
        return {
          value: value.name,
          title: isApp ? chalk.bold(value.name) + chalk.gray(' (app)') : value.name,
        };
      }),
      {
        nonInteractiveHelp: `--scheme: argument must be provided with a string in non-interactive mode. Valid choices are: ${schemes.join(
          ', '
        )}`,
      }
    );
    return schemes.find(({ name }) => resolvedSchemeName === name) ?? null;
  }
  // Attempt to match the schemes up so we can open the correct simulator
  return scheme ? schemes.find(({ name }) => name === scheme) || { name: scheme } : null;
}
