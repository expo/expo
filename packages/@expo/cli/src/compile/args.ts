import type {
  AndroidOutputType,
  BuildMode,
  CompileRequest,
  IosDestination,
  IosOutputType,
} from '@ramonclaudio/compile';
import { parseArgs } from 'node:util';
import path from 'path';

import { CommandError } from '../utils/errors';

export type CompileCommandRequest =
  | Extract<CompileRequest, { platform: 'ios' }>
  | (Extract<CompileRequest, { platform: 'android' }> &
      ({ device?: undefined } | { device: string; outputType: 'apk' }));

const options = {
  dev: { type: 'boolean' },
  development: { type: 'boolean' },
  prod: { type: 'boolean' },
  production: { type: 'boolean' },
  device: { type: 'string' },
  'output-dir': { type: 'string' },
  'output-type': { type: 'string' },
  help: { type: 'boolean', short: 'h' },
} as const;

export interface CompileOptions {
  kind: 'compile';
  platform: CompileRequest['platform'] | undefined;
  projectRoot: string;
  mode: BuildMode;
  device: string | undefined;
  outputType: string | undefined;
  outputDir: string | undefined;
}

export function parseCompileArgs(
  argv: readonly string[],
  platform?: CompileRequest['platform']
): { kind: 'help' } | CompileOptions {
  const { values, positionals } = parseOptions(argv);
  if (values.help) {
    return { kind: 'help' };
  }

  if (!platform && positionals.length > 0) {
    const selectedPlatform = positionals.shift();
    if (selectedPlatform !== 'ios' && selectedPlatform !== 'android') {
      throw new CommandError(
        'BAD_ARGS',
        `Platform must be "ios" or "android". Got "${selectedPlatform}".`
      );
    }
    platform = selectedPlatform;
  }
  if (positionals.length > 1) {
    throw new CommandError('BAD_ARGS', `Unexpected argument "${positionals[1]}".`);
  }

  const development = !!(values.dev || values.development);
  const production = !!(values.prod || values.production);
  if (development === production) {
    throw new CommandError('BAD_ARGS', 'Choose exactly one mode: --dev or --prod.');
  }

  return {
    kind: 'compile',
    platform,
    projectRoot: path.resolve(positionals[0] ?? '.'),
    mode: development ? 'development' : 'production',
    device: values.device,
    outputType: values['output-type'],
    outputDir: values['output-dir'],
  };
}

function parseOptions(argv: readonly string[]) {
  const args = [...argv];
  for (const [index, arg] of argv.entries()) {
    if (arg === '--') break;
    if (arg !== '--device') continue;
    const next = argv[index + 1];
    if (next === undefined || next.startsWith('-')) {
      args[index] = '--device=generic';
    }
  }

  try {
    return parseArgs({ args, options, allowPositionals: true, strict: true });
  } catch (error) {
    throw new CommandError('BAD_ARGS', error instanceof Error ? error.message : String(error));
  }
}

export function resolveCompileRequest(
  options: CompileOptions,
  platform: CompileRequest['platform']
): CompileCommandRequest {
  const { mode, projectRoot: cwd, outputDir } = options;
  if (platform === 'android') {
    const outputType = resolveAndroidOutputType(options.outputType);
    const request = { platform, cwd, mode, outputDir, outputType };
    if (options.device === undefined) return request;
    if (outputType === 'aab') {
      throw new CommandError(
        'BAD_ARGS',
        'Android device targeting requires --output-type apk. AAB builds target all supported devices.'
      );
    }
    if (options.device === '') {
      throw new CommandError('BAD_ARGS', 'Android device ID cannot be empty.');
    }
    return { ...request, outputType, device: options.device };
  }

  const outputType = resolveIosOutputType(options.outputType);
  const destination = resolveDestination(options.device);
  if (outputType === 'ipa') {
    if (destination.kind === 'simulator') {
      throw new CommandError(
        'BAD_ARGS',
        'IPA export requires --device. Simulator apps use --output-type app.'
      );
    }
    return { platform, cwd, mode, outputDir, outputType, destination };
  }
  return { platform, cwd, mode, outputDir, outputType, destination };
}

function resolveDestination(device: string | undefined): IosDestination {
  if (device === undefined) return { kind: 'simulator' };
  if (device === 'generic') return { kind: 'device' };
  if (!/^[A-Za-z0-9-]+$/.test(device)) {
    throw new CommandError(
      'BAD_ARGS',
      'Device ID must contain only letters, numbers, and hyphens.'
    );
  }
  return { kind: 'device', id: device };
}

function resolveIosOutputType(outputType = 'app'): IosOutputType {
  if (outputType === 'app' || outputType === 'ipa') return outputType;
  throw new CommandError(
    'BAD_ARGS',
    `The iOS command supports output types "app" and "ipa". Got "${outputType}".`
  );
}

function resolveAndroidOutputType(outputType = 'apk'): AndroidOutputType {
  if (outputType === 'apk' || outputType === 'aab') return outputType;
  throw new CommandError(
    'BAD_ARGS',
    `The Android command supports output types "apk" and "aab". Got "${outputType}".`
  );
}
