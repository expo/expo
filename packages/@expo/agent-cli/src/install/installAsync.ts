import { buildInstallFollowUps, followUpsEnabled, reportFollowUps } from '../followups';
import type { FollowUp } from '../followups/types';
import * as Log from '../log';
import type { InstallImpactReport } from '../project/types';
import {
  autoSyncSkillsAsync,
  listSkillPackagesAsync,
  printSkillsForAgentAsync,
} from '../skills/skillsAsync';
import { runExpoAsync, spawnExpoAsync } from '../utils/expoCli';
import { diagnoseCheckedPackagesAsync, type InstallCheckReport } from './checkReport';
import { reportInstallImpactAsync } from './impactReport';
import type { InstallPlan } from './resolveOptions';
import type { InstallReport } from './types';

/**
 * Run `expo install` as a subprocess, then report what it changed and link the skills of what it
 * installed.
 *
 * Both post-install steps run after the subprocess, never inside `@expo/cli`. They are
 * best-effort and never throw, so neither a skill problem nor an unclassifiable package can fail
 * a good install.
 *
 * @returns the exit code of the `expo install` subprocess.
 */
export async function installAsync(projectRoot: string, plan: InstallPlan): Promise<number> {
  const { exitCode, checkPayload, checkOutput } = await runInstallAsync(projectRoot, plan);
  if (exitCode !== 0) {
    // Nothing was installed, so there is nothing to classify and nothing to link — but a caller
    // that asked for JSON still gets one object, the way a successful run does.
    await reportAsync(projectRoot, plan, {
      exitCode,
      impact: [],
      checkPayload,
      checkOutput,
    });
    return exitCode;
  }

  // @ref llp/0004-smart-start-and-project-state.rfc.md §Sub-features
  const impact = plan.impact
    ? await reportInstallImpactAsync(projectRoot, plan.packages, { silent: plan.json })
    : [];

  if (plan.syncScope !== 'none') {
    await autoSyncSkillsAsync(projectRoot, {
      ...(plan.syncScope === 'packages' ? { packages: plan.packages } : null),
      silent: plan.json,
    });

    // Dumping skills only makes sense for a known set of new packages, so a full sync
    // (`expo install --fix`, a bare `expo install`) prints nothing.
    if (plan.skillContext && plan.syncScope === 'packages') {
      await printSkillsForAgentAsync(projectRoot, { packages: plan.packages });
    }
  }

  await reportAsync(projectRoot, plan, { exitCode, impact, checkPayload, checkOutput });
  return exitCode;
}

/**
 * Run `expo install`, and read the `--check` report out of it when there is one.
 *
 * The subprocess inherits this terminal for a human run, because watching an install is the point
 * of watching one. In `--json` mode it is captured instead: stdout belongs to the one object this
 * command prints, and a package manager writing into the middle of it is exactly what makes such
 * output unparseable.
 */
async function runInstallAsync(
  projectRoot: string,
  plan: InstallPlan
): Promise<{ exitCode: number; checkPayload: unknown; checkOutput: string | null }> {
  const args = ['install', ...plan.expoArgs];

  if (!plan.json) {
    return {
      exitCode: await runExpoAsync(projectRoot, args),
      checkPayload: null,
      checkOutput: null,
    };
  }

  const { result } = await spawnExpoAsync(projectRoot, args, { output: 'capture' });
  const exitCode = result.exitCode ?? 1;
  const checkPayload = plan.check ? parseJsonOrNull(result.stdout) : null;
  // What the tool printed is for a person, not for the caller's parser, so it goes to stderr. A
  // `--check` run that produced its report is the exception: there stdout *is* the answer, and it
  // travels in `check.report`. A `--check` run that produced no report is **not** an exception —
  // suppressing it there is what left an agent with exit 1, a success-shaped object and zero bytes
  // of diagnosis anywhere (F29).
  const printed = `${result.stdout}${result.stderr}`.trim();
  const suppressed = plan.check && checkPayload != null;
  if (printed && !suppressed) {
    Log.error(printed);
  }
  return {
    exitCode,
    checkPayload,
    checkOutput: plan.check && checkPayload == null ? printed || null : null,
  };
}

/**
 * The last JSON value on a stream, or null when it holds none.
 *
 * A value may span several lines, and for this caller that is the case that matters: the Expo CLI
 * prints the *passing* `--check` report on one line and the *failing* one pretty-printed
 * [observed — `@expo/cli` `src/install/checkPackages.ts`, SDK 57]. A one-line parse therefore
 * carried the report that says nothing and dropped the only one with content in it (F130). So a
 * candidate is a line beginning at **column zero** — an indented `{` is inside a value, never the
 * start of one — and the parse runs from there to the end of the stream, falling back to the line
 * alone for a stream that has something after its payload.
 */
function parseJsonOrNull(stdout: string): unknown {
  const lines = stdout.split('\n');
  for (let index = lines.length - 1; index >= 0; index--) {
    const line = lines[index]!;
    if (!line.startsWith('{') && !line.startsWith('[')) {
      continue;
    }
    const rest = lines.slice(index).join('\n').trim();
    const value = tryParse(rest) ?? tryParse(line.trim());
    if (value !== undefined) {
      return value;
    }
  }
  return null;
}

/** `JSON.parse`, with `undefined` for input that is not JSON — so a parsed `null` stays a value. */
function tryParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * Print what the run amounts to: the JSON report for a caller, and the next actions either way.
 *
 * @ref llp/0009-smart-followups.rfc.md §Examples per command — `install`. The classification the
 * impact report already made is the whole input, so no probe runs twice.
 */
async function reportAsync(
  projectRoot: string,
  plan: InstallPlan,
  {
    exitCode,
    impact,
    checkPayload,
    checkOutput,
  }: {
    exitCode: number;
    impact: InstallImpactReport[];
    checkPayload: unknown;
    checkOutput: string | null;
  }
): Promise<void> {
  // Only when something reads it: the follow-up wording, or the JSON report. Walking the
  // dependency graph for an answer nobody prints is work an install does not owe anyone.
  const wanted = followUpsEnabled(plan.followups) && impact.length > 0;
  const skillPackages =
    plan.agentSkills && exitCode === 0 && (plan.json || wanted)
      ? await listSkillPackagesAsync(projectRoot, plan.packages)
      : [];

  const followups: FollowUp[] = wanted
    ? buildInstallFollowUps({ reports: impact, packagesWithSkills: skillPackages })
    : [];

  // The project's own manifest, read only when the check failed: a passing check has nothing to
  // clarify, and the Expo CLI's report already says what a failing version check found.
  const check: InstallCheckReport | null = plan.check
    ? {
        ok: exitCode === 0,
        report: checkPayload,
        output: checkOutput,
        notes: exitCode === 0 ? [] : await diagnoseCheckedPackagesAsync(projectRoot, plan.packages),
      }
    : null;

  if (plan.json) {
    const report: InstallReport = {
      projectRoot,
      packages: plan.packages,
      installed: exitCode === 0 && !plan.check,
      exitCode,
      impact,
      skillPackages,
      check,
      followups,
    };
    Log.log(JSON.stringify(report, null, 2));
  } else if (check?.notes.length) {
    // The Expo CLI had the terminal and has already printed its own account, which for this case
    // states something about package.json that this CLI has just read and found untrue. The
    // correction goes last, where it is the line a reader acts on.
    Log.error(`\n${check.notes.join('\n')}`);
  }

  reportFollowUps('install', followups, { json: plan.json });
}
