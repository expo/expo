// @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy
// One command ships every platform: web through EAS Hosting, native through EAS Build. The
// orchestration is deterministic — resolve the tools, export, upload, hand the URLs back — so the
// same run works as a human command and as an agent tool.
import chalk from 'chalk';

import { followUpsEnabled, reportFollowUps } from '../followups';
import { buildDeployFollowUps } from '../followups/deploy';
import * as Log from '../log';
import {
  isInstalledDependencyAsync,
  listDependencyNames,
  readProjectPackageJsonAsync,
} from '../project/nodeModules';
import { CommandError } from '../utils/errors';
import { resolveExpoCli } from '../utils/expoCli';
import { spawnSubprocessAsync, type SubprocessOutput } from '../utils/subprocess';
import { assertEasConfiguredOrThrow, resolveEasCliOrThrow, type EasCli } from './easCli';
import { debugEvent, event } from './events';
import { outputTail, parseBuildPageUrl, parseDeploymentUrl } from './parseOutput';
import type { DeployOptions } from './resolveOptions';
import type {
  DeployPlatform,
  DeployReport,
  DeployTarget,
  NativeDeployResult,
  WebDeployResult,
} from './types';

/** Where `expo export` writes the web bundle when no `--output-dir` is given. */
const EXPORT_DIR = 'dist';

/** How much of the tool output travels in the payload next to a parsed URL. */
const OUTPUT_TAIL_LINES = 10;

/** Width of the label column of the human readable summary, as in `exagent context`. */
const LABEL_WIDTH = 12;

// TODO(llp/0007): native delivery goes through launch.expo.dev, whose integration is still pending.
// Until it exists, the native target stops at the EAS Build page and says so, rather than inventing
// a URL shape for a service this command does not talk to yet.
const NATIVE_NOTE =
  'Native delivery through launch.expo.dev is not wired up yet, so this is the EAS Build page: install from there, or run eas submit.';

/**
 * Deploy a project, and print where it went.
 *
 * Every precondition is checked before the first subprocess runs. An export takes minutes, and
 * finding out afterwards that the EAS CLI is missing is a minute an agent spent for nothing.
 */
export async function deployAsync(projectRoot: string, options: DeployOptions): Promise<void> {
  const targets = await resolveTargetsAsync(projectRoot, options);
  const nativeRequest = targets.includes('native') ? options.native : null;

  if (nativeRequest) {
    assertEasConfiguredOrThrow(projectRoot);
  }
  const easCli = resolveEasCliOrThrow(projectRoot);
  event('resolved', { targets, easCli: easCli.command, easCliSource: easCli.source });

  // In `--json` mode this command owns stdout, so the tools are captured; otherwise their output is
  // printed as it arrives *and* captured, because the URLs are only in there.
  const output: SubprocessOutput = options.json ? 'capture' : 'tee';

  const web = targets.includes('web') ? await deployWebAsync(projectRoot, easCli, output) : null;
  const native = nativeRequest
    ? await buildNativeAsync(projectRoot, easCli, nativeRequest, output)
    : null;

  const followups = followUpsEnabled(options.followups)
    ? buildDeployFollowUps({
        web: web && { url: web.url },
        native: native && { platform: native.platform, buildUrl: native.buildUrl },
      })
    : [];

  const report: DeployReport = { projectRoot, targets, web, native, followups };

  if (options.json) {
    Log.log(JSON.stringify(report, null, 2));
  } else {
    for (const line of summaryLines(report)) {
      Log.log(line);
    }
  }

  reportFollowUps('deploy', followups, { json: options.json });
}

/**
 * What this run ships.
 *
 * A request with no target flag is answered from the project: a project that has web deploys its
 * web app, which is the cheap, URL-in-seconds half of the deploy. A project without web has no
 * default, because the native half costs a cloud build and picks a platform, and neither is
 * something to start on a guess.
 *
 * @throws {CommandError} `NO_DEPLOY_TARGET` when nothing was asked for and nothing can be assumed.
 */
async function resolveTargetsAsync(
  projectRoot: string,
  options: DeployOptions
): Promise<DeployTarget[]> {
  const targets: DeployTarget[] = [];
  if (options.web) {
    targets.push('web');
  }
  if (options.native) {
    targets.push('native');
  }
  if (targets.length) {
    return targets;
  }

  if (await hasWebAsync(projectRoot)) {
    debugEvent('target_defaulted', { target: 'web' });
    return ['web'];
  }

  const error = new CommandError(
    'NO_DEPLOY_TARGET',
    [
      `No deploy target was given, and this project has no web app to default to.`,
      `Why: react-native-web is not a dependency, so there is no web bundle to export; the native target is never assumed, because it starts a cloud build for a platform this command would have to guess.`,
      `How: pass --platform ios or --platform android to build and ship the native app, or add web support with "npx expo install react-native-web react-dom" and pass --web.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent deploy --platform ios';
  throw error;
}

/**
 * Whether the project has a web app to deploy.
 *
 * This is the same fact `exagent context` reports as `hasWeb`, read the same way, but without the
 * rest of the probe: a deploy must not wait for a fingerprint it never uses.
 */
async function hasWebAsync(projectRoot: string): Promise<boolean> {
  const packageJson = await readProjectPackageJsonAsync(projectRoot);
  return isInstalledDependencyAsync(
    projectRoot,
    listDependencyNames(packageJson),
    'react-native-web'
  );
}

/** Export the web bundle, upload it to EAS Hosting, and report the URL it answers on. */
async function deployWebAsync(
  projectRoot: string,
  easCli: EasCli,
  output: SubprocessOutput
): Promise<WebDeployResult> {
  const expoCli = resolveExpoCli(projectRoot, ['export', '--platform', 'web']);
  debugEvent('export', { command: expoCli.command, args: expoCli.args });

  const exported = await spawnSubprocessAsync(expoCli.command, expoCli.args, {
    cwd: projectRoot,
    output,
  });
  if (exported.spawnError) {
    throw expoCliUnavailable(expoCli.command, exported.spawnError);
  }
  if (exported.exitCode !== 0) {
    const error = new CommandError(
      'EXPORT_FAILED',
      [
        `The web bundle could not be exported, so there was nothing to deploy (expo export exited with code ${exported.exitCode}).`,
        `Why: the export bundles the app for the web platform, and the bundler stopped on something in the project.`,
        `How: fix what the bundler reported, then run this command again. Running the export on its own prints the full output.`,
        fence(exported, output),
      ]
        .filter(Boolean)
        .join('\n')
    );
    error.suggestedCommand = 'npx expo export --platform web';
    throw error;
  }

  const deployed = await spawnSubprocessAsync(easCli.command, ['deploy', '--non-interactive'], {
    cwd: projectRoot,
    output,
  });
  if (deployed.spawnError) {
    throw easCliUnavailable(easCli.command, deployed.spawnError);
  }
  const outputText = `${deployed.stdout}${deployed.stderr}`;
  if (deployed.exitCode !== 0) {
    const error = new CommandError(
      'EAS_DEPLOY_FAILED',
      [
        `The export was built, but EAS Hosting did not accept it (eas deploy exited with code ${deployed.exitCode}).`,
        `Why: the upload ran non-interactively, so anything that needs an answer — most often an account that is not signed in — fails instead of prompting.`,
        `How: check who the CLI is acting as with "npx eas-cli whoami"; for a headless machine, set EXPO_TOKEN to an access token from expo.dev instead of signing in.`,
        fence(deployed, output),
      ]
        .filter(Boolean)
        .join('\n')
    );
    error.suggestedCommand = 'npx eas-cli whoami';
    throw error;
  }

  const url = parseDeploymentUrl(outputText);
  event('web', { url, exportDir: EXPORT_DIR });
  return { url, exportDir: EXPORT_DIR, outputTail: outputTail(outputText, OUTPUT_TAIL_LINES) };
}

/** Start the cloud build for one native platform, and report the page it runs on. */
async function buildNativeAsync(
  projectRoot: string,
  easCli: EasCli,
  request: { platform: DeployPlatform; profile: string },
  output: SubprocessOutput
): Promise<NativeDeployResult> {
  const args = [
    'build',
    '--platform',
    request.platform,
    '--profile',
    request.profile,
    '--non-interactive',
  ];
  debugEvent('build', { command: easCli.command, args });

  const built = await spawnSubprocessAsync(easCli.command, args, { cwd: projectRoot, output });
  if (built.spawnError) {
    throw easCliUnavailable(easCli.command, built.spawnError);
  }
  const outputText = `${built.stdout}${built.stderr}`;
  if (built.exitCode !== 0) {
    const error = new CommandError(
      'EAS_BUILD_FAILED',
      [
        `The ${request.platform} build did not run (eas build exited with code ${built.exitCode}).`,
        `Why: the build ran non-interactively with the "${request.profile}" profile, so a missing credential, an unknown profile, or an account that is not signed in fails instead of prompting.`,
        `How: check who the CLI is acting as with "npx eas-cli whoami", confirm eas.json has a "${request.profile}" profile, and for a headless machine set EXPO_TOKEN to an access token from expo.dev.`,
        fence(built, output),
      ]
        .filter(Boolean)
        .join('\n')
    );
    error.suggestedCommand = 'npx eas-cli whoami';
    throw error;
  }

  const buildUrl = parseBuildPageUrl(outputText);
  event('native', { platform: request.platform, profile: request.profile, buildUrl });
  return {
    platform: request.platform,
    profile: request.profile,
    buildUrl,
    note: NATIVE_NOTE,
    outputTail: outputTail(outputText, OUTPUT_TAIL_LINES),
  };
}

/**
 * The tail of a captured failure, for the error message.
 *
 * Only in `capture` mode: in `tee` mode the output is already on the terminal, and repeating it
 * would bury the three lines that say what to do.
 */
function fence(
  result: { stdout: string; stderr: string },
  output: SubprocessOutput
): string | undefined {
  if (output !== 'capture') {
    return undefined;
  }
  const tail = outputTail(`${result.stdout}${result.stderr}`, OUTPUT_TAIL_LINES);
  return tail ? `\nWhat the tool printed:\n${tail}` : undefined;
}

function expoCliUnavailable(command: string, spawnError: NodeJS.ErrnoException): CommandError {
  const error = new CommandError(
    'EXPO_CLI_NOT_FOUND',
    [
      `Could not run the Expo CLI (${command}), so the web bundle could not be exported.`,
      `Why: spawning it failed (${spawnError.code ?? spawnError.message}); the project has no expo dependency and "npx expo" is not available.`,
      `How: install Expo in the project with "npm install expo", then run this command again.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npm install expo';
  return error;
}

function easCliUnavailable(command: string, spawnError: NodeJS.ErrnoException): CommandError {
  const error = new CommandError(
    'EAS_CLI_MISSING',
    [
      `Could not run the EAS CLI (${command}), so nothing was shipped.`,
      `Why: the binary was found but spawning it failed (${spawnError.code ?? spawnError.message}), which usually means a broken or partial install.`,
      `How: reinstall it with "npm install -g eas-cli", then run this command again.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npm install -g eas-cli';
  return error;
}

function summaryLines(report: DeployReport): string[] {
  const lines: string[] = [];
  const row = (label: string, value: string) =>
    lines.push(`${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`);

  row('Project', report.projectRoot);
  row('Targets', report.targets.join(', '));

  if (report.web) {
    row('Export', `${report.web.exportDir} (expo export --platform web)`);
    row(
      'Web URL',
      report.web.url ??
        chalk.yellow('unknown (the eas output held no deployment URL — see the output above)')
    );
  }

  if (report.native) {
    row('Platform', `${report.native.platform} (profile ${report.native.profile})`);
    row(
      'Build',
      report.native.buildUrl ??
        chalk.yellow('unknown (the eas output held no build URL — see the output above)')
    );
    row('Note', report.native.note);
  }

  return lines;
}
