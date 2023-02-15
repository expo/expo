import { IOSConfig } from '@expo/config-plugins';
import chalk from 'chalk';
import path from 'path';

import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import { profile } from '../../../utils/profile';
import { selectAsync } from '../../../utils/prompts';
import { Options, ProjectInfo, XcodeConfiguration } from '../XcodeBuild.types';

const debug = require('debug')('expo:run:ios:options:resolveNativeScheme') as typeof console.log;

type NativeSchemeProps = {
  name: string;
  osType?: string;
};

export async function resolveNativeSchemePropsAsync(
  projectRoot: string,
  options: Pick<Options, 'scheme' | 'configuration'>,
  xcodeProject: ProjectInfo
): Promise<NativeSchemeProps> {
  return (
    (await promptOrQueryNativeSchemeAsync(projectRoot, options)) ??
    getDefaultNativeScheme(projectRoot, options, xcodeProject)
  );
}

/** Resolve the native iOS build `scheme` for a given `configuration`. If the `scheme` isn't provided then the user will be prompted to select one. */
export async function promptOrQueryNativeSchemeAsync(
  projectRoot: string,
  { scheme, configuration }: { scheme?: string | boolean; configuration?: XcodeConfiguration }
): Promise<NativeSchemeProps | null> {
  const schemes = IOSConfig.BuildScheme.getRunnableSchemesFromXcodeproj(projectRoot, {
    configuration,
  });
  if (!schemes.length) {
    throw new CommandError('IOS_MALFORMED', 'No native iOS build schemes found');
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

export function getDefaultNativeScheme(
  projectRoot: string,
  options: Pick<Options, 'configuration'>,
  xcodeProject: Pick<ProjectInfo, 'name'>
): NativeSchemeProps {
  // If the resolution failed then we should just use the first runnable scheme that
  // matches the provided configuration.
  const resolvedSchemes = profile(IOSConfig.BuildScheme.getRunnableSchemesFromXcodeproj)(
    projectRoot,
    {
      configuration: options.configuration,
    }
  );

  // If there are multiple schemes, then the default should be the application.
  if (resolvedSchemes.length > 1) {
    const scheme =
      resolvedSchemes.find(({ type }) => type === IOSConfig.Target.TargetType.APPLICATION) ??
      resolvedSchemes[0];
    debug(`Using default scheme: ${scheme.name}`);
    return scheme;
  }

  // If we couldn't find the scheme, then we'll guess at it,
  // this is needed for cases where the native code hasn't been generated yet.
  if (resolvedSchemes[0]) {
    return resolvedSchemes[0];
  }
  return {
    name: path.basename(xcodeProject.name, path.extname(xcodeProject.name)),
  };
}
