import arg from 'arg';
import chalk from 'chalk';
import type { Command } from '../../../bin/cli';
import { assertWithOptionsArgs, printHelp } from '../../utils/args';
import { logCmdError } from '../../utils/errors';
import path from 'node:path';
import { resolveOptionsAsync } from './resolveOptionsAsync';

export const expoBuildIos: Command = async (argv) => {
  const argSpec = {
    // Types
    '--help': Boolean,
    '--development': Boolean,
    '--production': Boolean,
    '--extra-flags': String, // Might need renaming
    '--format': String, // Might need renaming
    '--output-binary': String, // Might need renaming
    '--configuration': String,
    // '--scheme': String, - Parsed separately

    // Aliases
    '-h': '--help',
    '--dev': '--development',
    '--prod': '--production',
  } satisfies arg.Spec;

  const args = assertWithOptionsArgs(argSpec, { argv, permissive: true });

  if (args['--help']) {
    return printHelp('Build the iOS app binary locally', 'npx expo build:ios', [
     chalk `--scheme {dim [scheme]}     Xcode scheme to build.`,
      chalk`--configuration       Xcode configuration to use. {dim Options: Debug, Release. Default: Release}`,
      chalk`--format {dim [app,ipa]}    The binary type to build. {dim Default: ipa}`,
      ``,
      chalk`--extra-flags         Additional xcodebuild flags to use. {dim See xcodebuild --help for supported options}`,
      ``,
      chalk`--dev, --development  Build a dev client build of your app. {dim Short for --scheme Debug --format app}`,
      chalk`--prod, --production  Build a release build of your app to submit to the App Store. {dim Default mode. Short for --scheme Release --format ipa}`,
      ``,
      `-h, --help`,
    ].join('\n'), [
      ``,
      chalk`  Build your app for production release on the App Store`,
      chalk`    {dim $} npx expo build:ios --production`,
      chalk`    {dim $} npx expo build:ios --configuration Release --format ipa`,
      chalk`    {dim $} npx expo build:ios --configuration Release --output-binary ./my-app.ipa`,
      ``,
      chalk`  Build your app for testing on a simulator`,
      chalk`    {dim $} npx expo build:ios --development`,
      chalk`    {dim $} npx expo build:ios --configuration Debug --format app`,
      ``,
    ].join('\n'));
  }

  const { resolveStringOrBooleanArgsAsync } = await import('../../utils/resolveArgs.js');
  const parsed = await resolveStringOrBooleanArgsAsync(argv ?? [], argSpec, {
    '--scheme': Boolean,
  }).catch(logCmdError);

  const projectRoot = path.resolve(parsed.projectRoot);
  const { buildIosAsync } = await import('./buildIosAsync.js');

  return buildIosAsync(projectRoot, await resolveOptionsAsync(projectRoot, parsed.args)).catch(logCmdError);
};
