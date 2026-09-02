// @ref llp/0007-deploy-and-headless.rfc.md §deploy
// Argument resolution for `@expo/agent-cli deploy`. Pure: argv in, options out, `CommandError` for anything
// a user can get wrong. Which target a bare `@expo/agent-cli deploy` ships is decided from the project, not
// here, because that needs a probe.

import { PROGRAM_PREFIX } from '../programName';
import { parseArgsOrThrow, strayArgumentError } from '../utils/args';
import { CommandError } from '../utils/errors';

export interface DeployOptions {
  /** Deploy the web export to EAS Hosting. */
  web: boolean;
  /**
   * Create a launch for the native platforms, or null when no native target was asked for.
   *
   * There is no platform and no build profile here: the launch takes the project source, and iOS
   * and Android are chosen in the browser afterwards.
   */
  native: {
    /**
     * Directory to upload, as typed. Undefined uploads the project itself; a monorepo names the
     * workspace root here, and the app is reported to the service as a path inside it.
     */
    uploadRoot?: string;
  } | null;
  /** Print the result as one JSON object instead of the human summary (`--json`). */
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

const DEPLOY_ARGS = {
  '--web': Boolean,
  '--native': Boolean,
  '--upload-root': String,
  '--json': Boolean,
  '--no-followups': Boolean,
  // Accepted only to explain what replaced them, see below.
  '--platform': String,
  '--profile': String,
};

/** The usage line, which is the recovery path for every argument error of this command. */
const USAGE_COMMAND = `${PROGRAM_PREFIX} deploy`;

function badArgs(message: string, suggestedCommand: string): CommandError {
  const error = new CommandError('BAD_ARGS', message);
  // Errors are prompts (llp/0006 §Errors are prompts): a bad invocation answers with a good one.
  error.suggestedCommand = suggestedCommand;
  return error;
}

/**
 * Resolve the arguments of `@expo/agent-cli deploy`.
 *
 * No target flag resolves to no target: an empty request is not an error, it is the default the
 * caller fills in from the project state.
 *
 * @throws {CommandError} `BAD_ARGS` for a flag of the retired EAS Build rail, an upload root
 * without a native target, an unknown flag, or an unusable value.
 */
export function resolveDeployOptions(argv: string[]): DeployOptions {
  let args;
  try {
    args = parseArgsOrThrow(DEPLOY_ARGS, argv, 'deploy');
  } catch (error: any) {
    if (error instanceof CommandError && !error.suggestedCommand) {
      error.suggestedCommand = `${USAGE_COMMAND} --help`;
    }
    throw error;
  }

  // A deploy names its target with flags and reads nothing positional, so an argument here named
  // nothing and would have been dropped from a command that ships the project (llp/0010).
  if (args._.length > 0) {
    throw strayArgumentError('deploy', args._, {
      hint: `name the target with a flag instead — "${USAGE_COMMAND} --web" for the web app, "${USAGE_COMMAND} --native" for the native one.`,
    });
  }

  // `--platform` and `--profile` picked an EAS Build. The native rail is a launch now: it covers
  // both platforms and reads no build profile, and saying that beats "unknown option".
  if (args['--platform'] != null) {
    throw badArgs(
      `--platform is not part of a native deploy any more. Why: the native rail creates a launch on launch.expo.dev from your project source, and one launch covers iOS and Android — the platform is chosen there, in the browser. How: run "${USAGE_COMMAND} --native" and open the URL it prints.`,
      `${USAGE_COMMAND} --native`
    );
  }
  if (args['--profile'] != null) {
    throw badArgs(
      `--profile is not part of a native deploy any more. Why: it named a build profile in eas.json, and the native rail no longer starts an EAS Build — it uploads your project source to launch.expo.dev. How: run "${USAGE_COMMAND} --native", or run "npx eas build --profile ${String(args['--profile'])}" directly if that build is what you want.`,
      `${USAGE_COMMAND} --native`
    );
  }

  const uploadRoot = args['--upload-root'] == null ? undefined : String(args['--upload-root']);

  if (uploadRoot != null && !uploadRoot.trim()) {
    throw badArgs(
      `--upload-root was empty. Pass the directory whose contents should be uploaded, for example "--upload-root ../.." from an app inside a monorepo, or leave it out to upload the project itself.`,
      `${USAGE_COMMAND} --native`
    );
  }

  if (uploadRoot != null && !args['--native']) {
    throw badArgs(
      `--upload-root only describes the native deploy, and no native target was requested. Why: the web deploy exports the project itself, so there is no directory to pick for it. How: add --native, or drop --upload-root.`,
      `${USAGE_COMMAND} --native --upload-root ${uploadRoot}`
    );
  }

  return {
    web: !!args['--web'],
    native: args['--native'] ? { uploadRoot } : null,
    json: !!args['--json'],
    followups: !args['--no-followups'],
  };
}
