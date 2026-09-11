import { CompileError, type CompileRequest } from '@ramonclaudio/compile';
import { constants } from 'os';

import type { Command } from '../index';
import { CommandError, logCmdError } from '../utils/errors';
import { parseCompileArgs, resolveCompileRequest } from './args';

export const expoCompile: Command = (argv) => runCompileAsync(argv ?? []);
export const expoCompileIos: Command = (argv) => runCompileAsync(argv ?? [], 'ios');
export const expoCompileAndroid: Command = (argv) => runCompileAsync(argv ?? [], 'android');

async function runCompileAsync(argv: string[], platform?: CompileRequest['platform']) {
  try {
    const options = parseCompileArgs(argv, platform);
    if (options.kind === 'help') {
      printHelp(platform);
      return;
    }
    const selectedPlatform = options.platform ?? (await selectPlatformAsync());
    const request = resolveCompileRequest(options, selectedPlatform);
    const { compileAsync } = await import('./compileAsync.js');
    const artifacts = await compileAsync(request);
    for (const artifact of artifacts) {
      console.log(artifact);
    }
  } catch (error) {
    if (error instanceof CompileError) {
      console.error(error.message);
      process.exitCode = error.signal ? 128 + constants.signals[error.signal] : error.exitCode;
      return;
    }
    logCmdError(error);
  }
}

async function selectPlatformAsync(): Promise<CompileRequest['platform']> {
  const { promptAsync } = await import('../utils/prompts.js');
  const answers: Record<string, unknown> = await promptAsync(
    {
      type: 'select',
      name: 'platform',
      message: 'Select the platform to compile',
      choices: [
        { title: 'iOS', value: 'ios' },
        { title: 'Android', value: 'android' },
      ],
      stdout: process.stderr,
    },
    {
      nonInteractiveHelp:
        'Specify a platform with npx expo compile ios or npx expo compile android.',
    }
  );
  const { platform } = answers;
  if (platform !== 'ios' && platform !== 'android') {
    throw new CommandError('BAD_ARGS', 'Select iOS or Android.');
  }
  return platform;
}

function printHelp(platform?: CompileRequest['platform']) {
  const command = platform ? `compile:${platform}` : 'compile <ios|android>';
  const outputTypes =
    platform === 'ios'
      ? 'app (default), ipa'
      : platform === 'android'
        ? 'apk (default), aab'
        : 'iOS: app (default), ipa; Android: apk (default), aab';
  const deviceOption =
    platform === 'ios'
      ? 'Build for an iOS device (default: simulator)'
      : platform === 'android'
        ? "Build for an attached device's architecture (APK only)"
        : "Build for an iOS device or an attached Android device's architecture";
  const androidNote =
    platform === 'ios'
      ? ''
      : '\n  Android --device needs one authorized device, or an exact ADB serial.\n  Gradle defaults device-targeted APKs to test-only (install with adb install -t).';
  const ipaNote =
    platform === 'android'
      ? ''
      : '\n  IPA exports need --device and a project ExportOptions.plist.';
  console.log(`
  Compile a native app and print its output paths

  Usage
    $ npx expo ${command} [projectRoot] --dev|--prod

  Options
    --dev, --development   Compile in development mode
    --prod, --production   Compile in production mode
    --device [id]          ${deviceOption}
    --output-type <type>   ${outputTypes}
    --output-dir <dir>     Copy artifacts to this directory, relative to projectRoot
    --help, -h             Usage info

  Requires a native project with its dependencies installed.${ipaNote}${androidNote}
`);
}
