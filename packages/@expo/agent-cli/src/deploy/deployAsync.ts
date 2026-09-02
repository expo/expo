// @ref llp/0007-deploy-and-headless.rfc.md §deploy
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
import { PROGRAM_PREFIX } from '../programName';
import {
  isInstalledDependencyAsync,
  listDependencyNames,
  readProjectPackageJsonAsync,
} from '../project/nodeModules';
import {
  neutralizeUntrustedMarkers,
  UNTRUSTED_OUTPUT_BEGIN,
  UNTRUSTED_OUTPUT_END,
  wrapUntrustedAppOutput,
} from '../runtime/untrusted';
import { easCliLabel, resolveEasCliOrThrow, type EasCli } from '../utils/easCli';
import { CommandError } from '../utils/errors';
import { spawnExpoAsync } from '../utils/expoCli';
import { toPosixPath } from '../utils/filePath';
import { spawnSubprocessAsync, type CapturedOutput } from '../utils/subprocess';
import {
  looksLikeWrapperCrash,
  runnerCrashReason,
  wrapperCrashDetail,
  type WrapperCrashTool,
} from '../utils/wrapperCrash';
import { classifyEasDeployFailure, type EasDeployCause } from './easFailure';
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

/** Width of the label column of the human readable summary, as in `@expo/agent-cli status`. */
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
    // The invocation, not the file: on the runner rung the file is `npx`, and an event saying the
    // EAS CLI resolved to `/opt/homebrew/bin/npx` names the wrong program.
    easCli: easCli ? easCliLabel(easCli) : null,
    easCliSource: easCli?.source ?? 'none',
    launchCli: launchCli ? [launchCli.command, ...launchCli.args].join(' ') : null,
  });

  // @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol — the cheap question
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
    error.suggestedCommand = `${PROGRAM_PREFIX} deploy --native`;
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
  error.suggestedCommand = `${PROGRAM_PREFIX} deploy --native`;
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

  const upload = await uploadToEasHostingAsync(projectRoot, easCli, output);
  const deployed = upload.result;
  if (deployed.spawnError) {
    throw easCliUnavailable(upload.command, deployed.spawnError);
  }
  const outputText = `${deployed.stdout}${deployed.stderr}`;
  if (deployed.exitCode !== 0 || deployed.promptHang) {
    // Read once and used twice: the diagnosis and the handoff are the same conclusion about the same
    // output, and a handoff that names something else is F143.
    const cause = classifyEasDeployFailure(outputText);
    throw handoffOr(easDeployFailed(upload, output, cause), deployed, 'eas', DEPLOY_COMMAND, cause);
  }

  const url = parseDeploymentUrl(outputText);
  event('web', { url, exportDir: EXPORT_DIR });
  return { url, exportDir: EXPORT_DIR, outputTail: outputTail(outputText, OUTPUT_TAIL_LINES) };
}

/** One `eas deploy` run: what ran, and what it did. */
interface EasUpload {
  /** The executable that ran. */
  command: string;
  /** How to write that invocation in a message, e.g. `npx eas-cli@latest`. */
  label: string;
  /** Arguments before `deploy`, which is the package name in the runner form. */
  prefixArgs: string[];
  result: Awaited<ReturnType<typeof spawnSubprocessAsync>>;
}

/**
 * Upload the export.
 *
 * **One run, no retry.** This used to have two: the binary the machine had under the name `eas` was
 * whatever it was — a wrapper, a shim, a stale link (llp/0001 §Constraints) — so `deploy` printed
 * the shim's Rust panic and handed back a `Try:` line that ran the same broken file again [observed
 * — friction run 7, F67], and the fix was to notice the crash and retry through a package runner.
 *
 * The runner is now the *only* way this CLI reaches EAS (`src/utils/easCli.ts`, wave 18), so there is
 * nothing to route around and nothing to route to: the package that answers is `eas-cli` by
 * definition, and a failure is the CLI's own answer. Retrying it would spend the upload twice.
 *
 * The crash **detection** stays, in `easDeployFailed` below — it costs nothing when the CLI is real,
 * and a guard that is unreachable by construction is exactly the guard worth keeping for the day the
 * construction changes.
 *
 * @ref llp/0021-honest-reports.rfc.md §The rules
 */
async function uploadToEasHostingAsync(
  projectRoot: string,
  easCli: EasCli,
  output: CapturedOutput
): Promise<EasUpload> {
  const run = (command: string, prefixArgs: string[]) =>
    withFencedOutputAsync(output, () =>
      spawnSubprocessAsync(command, [...prefixArgs, 'deploy', '--non-interactive'], {
        cwd: projectRoot,
        output,
        promptGuard: true,
        // So the tool's own bytes cannot forge the end of the block printed around them.
        printFilter: neutralizeUntrustedMarkers,
      })
    );

  const result = await run(easCli.command, easCli.prefixArgs);
  return {
    command: easCli.command,
    label: easCliLabel(easCli),
    prefixArgs: easCli.prefixArgs,
    result,
  };
}

/**
 * The error for an upload that did not happen.
 *
 * The `Why:` comes from the CLI's own sentence when it said something stable, and only falls back
 * to the old guess when it did not — labelled as a guess (`easFailure.ts`, S2). The `Try:` never
 * names a binary this run has already concluded is not the CLI (F67).
 */
function easDeployFailed(
  upload: EasUpload,
  output: CapturedOutput,
  cause: EasDeployCause | null
): CommandError {
  const { result } = upload;
  // The invocation that actually ran, which is what a reader has to reproduce. It is already
  // written the way they would type it (`easCliLabel`), so it needs no quoting.
  const whoami = cause?.command ?? `${upload.label} whoami`;
  // The safety net. A package runner running the package named `eas-cli` cannot plausibly answer
  // like a wrapper that was never the CLI, so this should never be true — and it is kept rather than
  // deleted because "should never" is a claim about today's resolver, not about the process boundary
  // (llp/0001 §Constraints), and the cost of keeping it is one string comparison.
  const notTheCli = looksLikeWrapperCrash({ tool: 'eas', ...result });

  const error = new CommandError(
    'EAS_DEPLOY_FAILED',
    [
      `The export was built, but EAS Hosting did not accept it (${howItStopped('eas deploy', result)}).`,
      cause
        ? `Why: ${cause.why}`
        : `Why: the upload ran non-interactively, so anything that needs an answer fails instead of prompting. The EAS CLI printed nothing this version recognises, so this is a guess — the output below is the answer.`,
      cause
        ? `How: ${cause.how}`
        : notTheCli
          ? `How: ${runnerCrashReason({ tool: 'eas', exitCode: result.exitCode }, upload.label)}, so nothing about accounts applies to this run.`
          : `How: check who that CLI is acting as with "${whoami}"; for a headless machine, set EXPO_TOKEN to an access token from expo.dev instead of signing in.`,
      fence(result, output, { tool: 'eas', binPath: upload.command }),
    ]
      .filter(Boolean)
      .join('\n')
  );
  // The invocation that ran, never a file this run has concluded is not the CLI (F67). With one rung
  // those are the same line, which is the point of having one rung.
  error.suggestedCommand = cause?.command ?? whoami;
  return error;
}

/**
 * Run something that streams another program's output, with the stream fenced.
 *
 * Guardrails apply to a tool's bytes as much as to an app's: the shim's Rust panic reached the
 * terminal ahead of anything this CLI said, unmarked, and an agent reading it had no way to tell
 * the two apart [observed — friction run 7, F67]. In the capturing modes there is nothing to fence
 * here — `fence()` marks what goes into the message instead.
 *
 * @ref llp/0008-guardrails.rfc.md §Untrusted-content marking
 */
async function withFencedOutputAsync<T>(output: CapturedOutput, run: () => Promise<T>): Promise<T> {
  if (output !== 'tee' && output !== 'capture-stdout') {
    return await run();
  }
  Log.error(UNTRUSTED_OUTPUT_BEGIN);
  try {
    return await run();
  } finally {
    Log.error(UNTRUSTED_OUTPUT_END);
  }
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
  invocation: string,
  cause: EasDeployCause | null = null
): CommandError {
  const needsHuman = classifySubprocessFailure({ tool, invocation, ...result });
  if (!needsHuman) {
    return error;
  }
  const quoted = result.promptHang ? `\nWhat it was waiting for:\n${result.promptHang}` : '';
  return needsHumanErrorFrom(
    // @ref llp/0021-honest-reports.rfc.md §The rules — **F143.**
    // A generic registry row names no command of its own, so the classifier fills in the invocation
    // that stopped: right for a tool that went silent on a question, because running it in a
    // terminal is what answers it. Wrong the moment the tool *said* what was missing — an unlinked
    // project was handed `npx eas deploy`, the command that had just failed and would fail the same
    // way again, while `eas init` sat two lines above it in this CLI's own `How:`.
    cause?.command == null ? needsHuman : { ...needsHuman, command: cause.command },
    { code: error.code, message: error.message + quoted }
  );
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
  // Fenced: these are another program's bytes, and a reader — a person or an agent — has to be able
  // to tell them from this CLI's own sentences (llp/0008-guardrails.rfc.md §Untrusted-content marking).
  return tail ? `\nWhat the tool printed:\n${wrapUntrustedAppOutput(tail)}` : undefined;
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
      `Why: the file was found but spawning it failed (${spawnError.code ?? spawnError.message}), which usually means a broken or partial install.`,
      `How: add the EAS CLI to the project with "npm install --save-dev eas-cli", then run this command again — the project's own copy is the first thing this command looks for, so it takes precedence over whatever is broken.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npm install --save-dev eas-cli';
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
