// @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy
// Argument resolution for `exagent deploy`. Pure: argv in, options out, `CommandError` for anything
// a user can get wrong. Which target a bare `exagent deploy` ships is decided from the project, not
// here, because that needs a probe.

import { parseArgsOrThrow } from '../utils/args';
import { CommandError } from '../utils/errors';
import type { DeployPlatform } from './types';

/** Build profile used when `--profile` is not given, i.e. the one that ships. */
export const DEFAULT_BUILD_PROFILE = 'production';

const DEPLOY_PLATFORMS: DeployPlatform[] = ['ios', 'android'];

export interface DeployOptions {
  /** Deploy the web export to EAS Hosting. */
  web: boolean;
  /** Build the native app with EAS Build, or null when no native target was asked for. */
  native: { platform: DeployPlatform; profile: string } | null;
  /** Print the result as one JSON object instead of the human summary (`--json`). */
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

const DEPLOY_ARGS = {
  '--web': Boolean,
  '--native': Boolean,
  '--platform': String,
  '--profile': String,
  '--json': Boolean,
  '--no-followups': Boolean,
};

/** The usage line, which is the recovery path for every argument error of this command. */
const USAGE_COMMAND = 'npx exagent deploy';

function badArgs(message: string, suggestedCommand: string): CommandError {
  const error = new CommandError('BAD_ARGS', message);
  // Errors are prompts (llp/0006 §Errors are prompts): a bad invocation answers with a good one.
  error.suggestedCommand = suggestedCommand;
  return error;
}

/**
 * Resolve the arguments of `exagent deploy`.
 *
 * No target flag resolves to no target: an empty request is not an error, it is the default the
 * caller fills in from the project state.
 *
 * @throws {CommandError} `BAD_ARGS` for a native target without a platform, an unknown platform, a
 * build profile without a native target, an unknown flag, or an unusable value.
 */
export function resolveDeployOptions(argv: string[]): DeployOptions {
  let args;
  try {
    args = parseArgsOrThrow(DEPLOY_ARGS, argv);
  } catch (error: any) {
    if (error instanceof CommandError && !error.suggestedCommand) {
      error.suggestedCommand = `${USAGE_COMMAND} --help`;
    }
    throw error;
  }

  const platformValue = args['--platform'] == null ? undefined : String(args['--platform']);
  if (platformValue && !DEPLOY_PLATFORMS.includes(platformValue as DeployPlatform)) {
    throw badArgs(
      `--platform ${platformValue} is not a platform EAS Build builds for. Pass one of: ${DEPLOY_PLATFORMS.join(', ')}. The web app is deployed with --web, which needs no platform.`,
      `${USAGE_COMMAND} --platform ios`
    );
  }

  // `--platform` only ever means a native build, so it is a request for that target by itself.
  const wantsNative = !!args['--native'] || !!platformValue;
  const profile = args['--profile'] == null ? undefined : String(args['--profile']);

  if (wantsNative && !platformValue) {
    throw badArgs(
      `--native does not say which platform to build. Why: one EAS Build runs for one platform, so the platform is part of the request. How: pass --platform ios or --platform android, and run the command twice to build both.`,
      `${USAGE_COMMAND} --native --platform ios`
    );
  }

  if (profile && !wantsNative) {
    throw badArgs(
      `--profile names a build profile in eas.json, which only the native build reads. Why: the web deploy uploads the export as it is, so there is no profile to pick. How: drop --profile, or add --platform ios (or android) to build the native app with it.`,
      `${USAGE_COMMAND} --platform ios --profile ${profile}`
    );
  }

  return {
    web: !!args['--web'],
    native: wantsNative
      ? { platform: platformValue as DeployPlatform, profile: profile ?? DEFAULT_BUILD_PROFILE }
      : null,
    json: !!args['--json'],
    followups: !args['--no-followups'],
  };
}
