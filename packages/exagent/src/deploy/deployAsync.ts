// @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy
// One command ships every platform: web through EAS Hosting, native through launch.expo.dev. The
// orchestration is deterministic — resolve the credentials and tools, export or pack, upload, hand
// the URLs back — so the same run works as a human command and as an agent tool.
import chalk from 'chalk';
import path from 'path';

import { followUpsEnabled, reportFollowUps } from '../followups';
import { buildDeployFollowUps } from '../followups/deploy';
import * as Log from '../log';
import { assertSignedInAsync } from '../needsHuman/assertAuth';
import { classifySubprocessFailure } from '../needsHuman/detect';
import { needsHumanErrorFrom } from '../needsHuman/error';
import type { NeedsHumanTool } from '../needsHuman/registry';
import {
  isInstalledDependencyAsync,
  listDependencyNames,
  readProjectPackageJsonAsync,
} from '../project/nodeModules';
import { resolveEasCliOrThrow, type EasCli } from '../utils/easCli';
import { CommandError } from '../utils/errors';
import { spawnExpoAsync } from '../utils/expoCli';
import { toPosixPath } from '../utils/filePath';
import { spawnSubprocessAsync, type CapturedOutput } from '../utils/subprocess';
import {
  checkBinaryCommand,
  looksLikeWrapperCrash,
  wrapperCrashDetail,
  type WrapperCrashTool,
} from '../utils/wrapperCrash';
import { debugEvent, event } from './events';
import { launchProjectAsync } from './launchAsync';
import { resolveCreateLaunchCli } from './launchCli';
import { outputTail, parseDeploymentUrl } from './parseOutput';
import type { DeployOptions } from './resolveOptions';
import type { DeployReport, DeployTarget, WebDeployResult } from './types';

/** Where `expo export` writes the web bundle when no `--output-dir` is given. */
const EXPORT_DIR = 'dist';

/** How much of the tool output travels in the payload next to a parsed URL. */
const OUTPUT_TAIL_LINES = 10;

/** Width of the label column of the human readable summary, as in `exagent status`. */
const LABEL_WIDTH = 12;

/** The two commands of the web rail, as a person would run them without this wrapper. */
const EXPORT_COMMAND = 'npx expo export --platform web';
const DEPLOY_COMMAND = 'npx eas deploy';

/**
 * Deploy a project, and print where it went.
 *
 * Every precondition is checked before the first byte is sent. An export takes minutes and an
 * upload can take more, and finding out afterwards that the EAS CLI is missing or that nobody is
 * signed in is time an agent spent for nothing.
 */
export async function deployAsync(projectRoot: string, options: DeployOptions): Promise<void> {
  const targets = await resolveTargetsAsync(projectRoot, options);
  const nativeRequest = targets.includes('native') ? options.native : null;
  const deploysWeb = targets.includes('web');

  // Each rail needs its own tool, and both are resolved before either one runs — the arguments
  // first, because a mistyped flag should not be reported after minutes of exporting.
  const uploadPaths = nativeRequest
    ? resolveUploadPaths(projectRoot, nativeRequest.uploadRoot)
    : null;
  const easCli = deploysWeb ? resolveEasCliOrThrow(projectRoot) : null;
  const launchCli = nativeRequest ? resolveCreateLaunchCli(projectRoot) : null;
  event('resolved', {
    targets,
    easCli: easCli?.command ?? null,
    easCliSource: easCli?.source ?? 'none',
    launchCli: launchCli ? [launchCli.command, ...launchCli.args].join(' ') : null,
  });

  // @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol, layer 1 — the cheap question
  // first. Both rails ship as a signed-in Expo account, and the export that comes next takes
  // minutes; finding out afterwards that nobody is signed in is minutes spent for nothing
  // [observed — friction run, 2026-08-23: ten seconds of exporting, then the auth failure].
  await assertSignedInAsync(projectRoot, {
    action: deploysWeb ? 'the upload to EAS Hosting' : 'the launch',
    because: deploysWeb
      ? 'EAS Hosting accepts an export as an account, never anonymously'
      : 'the launch is created as the signed in Expo user',
  });

  // In `--json` mode this command owns stdout, so the tools are captured; otherwise their output is
  // printed as it arrives *and* captured, because the URLs are only in there.
  const output: CapturedOutput = options.json ? 'capture' : 'tee';

  const web = easCli ? await deployWebAsync(projectRoot, easCli, output) : null;
  const native =
    launchCli && uploadPaths
      ? await launchProjectAsync({ cli: launchCli, json: options.json, ...uploadPaths })
      : null;

  const followups = followUpsEnabled(options.followups)
    ? buildDeployFollowUps({
        web: web && { url: web.url },
        launch: native && { url: native.url, expiresInHours: native.expiresInHours },
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
 * Which directory is uploaded, and where the app sits inside it.
 *
 * With no `--upload-root` the project *is* the upload, and the service needs no path. A monorepo
 * uploads a parent directory, and then the app's path inside the tarball is what tells the service
 * which of the workspaces to launch — the same `x-project-root` the reference implementation sends.
 *
 * @throws {CommandError} `BAD_ARGS` when the project is not inside the named directory.
 */
function resolveUploadPaths(
  projectRoot: string,
  uploadRootArg?: string
): { uploadRoot: string; projectPath?: string } {
  if (!uploadRootArg) {
    return { uploadRoot: projectRoot };
  }

  const uploadRoot = path.resolve(projectRoot, uploadRootArg);
  const relative = path.relative(uploadRoot, projectRoot);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    const error = new CommandError(
      'BAD_ARGS',
      [
        `The project is not inside ${uploadRoot}, so that directory cannot be uploaded for it.`,
        `Why: --upload-root names a directory that *contains* the app, and ${projectRoot} is not under it, so the upload would not hold the project at all.`,
        `How: point --upload-root at a parent directory of the project, for example "--upload-root .." from an app in a monorepo, or leave it out to upload the project itself.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx exagent deploy --native';
    throw error;
  }

  // An empty relative path means the upload root resolved to the project itself.
  return { uploadRoot, projectPath: relative ? toPosixPath(relative) : undefined };
}

/**
 * What this run ships.
 *
 * A request with no target flag is answered from the project: a project that has web deploys its
 * web app, which is the cheap, URL-in-seconds half of the deploy. A project without web has no
 * default, because the native half uploads the whole project source and hands a browser step to a
 * person, and neither is something to start on a guess.
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
      `Why: react-native-web is not a dependency, so there is no web bundle to export; the native target is never assumed, because it uploads your project source and then needs a person in a browser.`,
      `How: pass --native to launch the native app, or add web support with "npx expo install react-native-web react-dom" and pass --web.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent deploy --native';
  throw error;
}

/**
 * Whether the project has a web app to deploy.
 *
 * This is the same fact the project probe reports as `hasWeb`, read the same way, but without the
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
  output: CapturedOutput
): Promise<WebDeployResult> {
  const { cli: expoCli, result: exported } = await spawnExpoAsync(
    projectRoot,
    ['export', '--platform', 'web'],
    { output, promptGuard: true }
  );
  debugEvent('export', { command: expoCli.command, args: expoCli.args });

  if (exported.spawnError) {
    throw expoCliUnavailable(expoCli.command, exported.spawnError);
  }
  if (exported.exitCode !== 0 || exported.promptHang) {
    const error = new CommandError(
      'EXPORT_FAILED',
      [
        `The web bundle could not be exported, so there was nothing to deploy (${howItStopped('expo export', exported)}).`,
        `Why: the export bundles the app for the web platform, and the bundler stopped on something in the project.`,
        `How: fix what the bundler reported, then run this command again. Running the export on its own prints the full output.`,
        fence(exported, output, { tool: 'expo', binPath: expoCli.command }),
      ]
        .filter(Boolean)
        .join('\n')
    );
    error.suggestedCommand = 'npx expo export --platform web';
    throw handoffOr(error, exported, 'expo', EXPORT_COMMAND);
  }

  const deployed = await spawnSubprocessAsync(easCli.command, ['deploy', '--non-interactive'], {
    cwd: projectRoot,
    output,
    promptGuard: true,
  });
  if (deployed.spawnError) {
    throw easCliUnavailable(easCli.command, deployed.spawnError);
  }
  const outputText = `${deployed.stdout}${deployed.stderr}`;
  if (deployed.exitCode !== 0 || deployed.promptHang) {
    // The check names the binary that actually ran. `npx eas-cli whoami` would download and ask a
    // *different* program than the one that just failed, so a healthy answer from it would prove
    // nothing about this run [observed — friction run, 2026-08-23].
    const whoami = checkBinaryCommand(easCli.command, ['whoami']);
    const error = new CommandError(
      'EAS_DEPLOY_FAILED',
      [
        `The export was built, but EAS Hosting did not accept it (${howItStopped('eas deploy', deployed)}).`,
        `Why: the upload ran non-interactively, so anything that needs an answer — most often an account that is not signed in — fails instead of prompting.`,
        `How: check who that CLI is acting as with "${whoami}"; for a headless machine, set EXPO_TOKEN to an access token from expo.dev instead of signing in.`,
        fence(deployed, output, { tool: 'eas', binPath: easCli.command }),
      ]
        .filter(Boolean)
        .join('\n')
    );
    error.suggestedCommand = whoami;
    throw handoffOr(error, deployed, 'eas', DEPLOY_COMMAND);
  }

  const url = parseDeploymentUrl(outputText);
  event('web', { url, exportDir: EXPORT_DIR });
  return { url, exportDir: EXPORT_DIR, outputTail: outputTail(outputText, OUTPUT_TAIL_LINES) };
}

/**
 * How a tool stopped, for the first line of the error.
 *
 * A tool killed on a question has no exit code of its own, and reporting `code null` would name
 * the symptom of this CLI's own guard instead of what happened.
 */
function howItStopped(tool: string, result: { exitCode: number | null; promptHang?: string }) {
  return result.promptHang
    ? `${tool} stopped on a question, and this run has no terminal to answer it`
    : `${tool} exited with code ${result.exitCode}`;
}

/**
 * The same failure, as a handoff when what stopped the tool was a person-shaped step.
 *
 * The wording and the code stay exactly as written above: nothing about the *what* changed, and a
 * code an agent may already branch on must not be renamed by a reclassification. What is added is
 * the machine-readable "who has to do something about it", which also moves the run into the
 * needs-human exit band (llp/0010 §Needs-human protocol).
 *
 * @param invocation the command a person runs to see this for themselves
 */
function handoffOr(
  error: CommandError,
  result: { exitCode: number | null; stdout: string; stderr: string; promptHang?: string },
  tool: NeedsHumanTool,
  invocation: string
): CommandError {
  const needsHuman = classifySubprocessFailure({ tool, invocation, ...result });
  if (!needsHuman) {
    return error;
  }
  const quoted = result.promptHang ? `\nWhat it was waiting for:\n${result.promptHang}` : '';
  return needsHumanErrorFrom(needsHuman, { code: error.code, message: error.message + quoted });
}

/**
 * The tail of a captured failure, for the error message.
 *
 * Only in `capture` mode: in `tee` mode the output is already on the terminal, and repeating it
 * would bury the three lines that say what to do.
 *
 * When what ran was not the CLI at all, the tail is replaced by a sentence saying so. Printing a
 * Rust backtrace from a shim under "What the tool printed" claims the EAS CLI reported a missing
 * file, and a reader — a person or an agent — then goes looking for that file
 * [observed — friction run, 2026-08-23].
 */
function fence(
  result: { exitCode: number | null; stdout: string; stderr: string },
  output: CapturedOutput,
  { tool, binPath }: { tool: WrapperCrashTool; binPath: string }
): string | undefined {
  if (looksLikeWrapperCrash({ tool, ...result })) {
    return wrapperCrashDetail({ tool, exitCode: result.exitCode }, binPath);
  }
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
    // The URL is the result of the command, not a detail of it: nothing ships until it is opened,
    // so it gets the bold line and the sentence that says what to do with it.
    row('Launch', report.native.id);
    row('Framework', report.native.framework);
    lines.push('');
    lines.push(chalk.bold('Open this to finish the launch:'));
    lines.push(`  ${chalk.cyan(report.native.url)}`);
    lines.push(
      chalk.dim(
        `  The store account, the signing and the submission happen in the browser. The link expires in ${report.native.expiresInHours} hours.`
      )
    );
  }

  return lines;
}
