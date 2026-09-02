// @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope — the rule this file serves:
// a `--json` caller has committed to parsing stdout, so an object that parses and says nothing is
// worse than no object at all.
//
// `@expo/agent-cli install --check --json <package>` on a package the project does not have exited **1**
// with the success-shaped report — `installed: false`, `check: null`, `exitCode: 1` buried in the
// body, no `error` key — and **zero bytes on stderr** [observed — friction run 3, F29]. The verdict
// was in the exit code and nowhere else, and `--check` is the natural first move for an agent
// deciding whether to install something.
//
// Two things were losing it, and they are separate faults:
//
//  1. The wrapper suppressed the Expo CLI's output for a `--check` run, because there its stdout
//     *is* the answer. That is true when the CLI gets far enough to print its report, and it is a
//     `PACKAGE_NOT_FOUND` thrown before then in the case that matters.
//  2. `check` was the CLI's payload passed through verbatim, so "there was no payload" and "this
//     was not a `--check` run" were both `null`.
//
// So `check` is now a report of this CLI's own, with the CLI's payload inside it, and it carries a
// verdict (`ok`) that never depends on parsing prose.
//
// The prose itself is worth correcting, which is the third fault. `"<package>" is added as a
// dependency in your project's package.json but it doesn't seem to be installed` is what the Expo
// CLI prints [observed — `packages/@expo/cli/src/start/doctor/dependencies/resolvePackages.ts`],
// and for the package this was reported against it was **not** in package.json at all. The wrapper
// can see that for itself, so it says so instead of echoing a claim it can check.

import { PROGRAM_PREFIX } from '../programName';
import {
  listDependencyNames,
  parsePackageName,
  readProjectPackageJsonAsync,
  resolvePackageRootAsync,
} from '../project/nodeModules';

/** What `@expo/agent-cli install --check` amounts to, under the `check` key of the JSON report. */
export interface InstallCheckReport {
  /** Whether the dependency check passed. The verdict, without parsing anything. */
  ok: boolean;
  /**
   * The `expo install --check --json` payload, verbatim, or null when the CLI printed none.
   *
   * That report belongs to the Expo CLI — `{ dependencies, upToDate }` — and is passed through
   * rather than restated. A run that stopped before producing it leaves this null and fills
   * {@link output} instead.
   */
  report: unknown;
  /**
   * What the Expo CLI printed when it produced no report, so the diagnosis is never only on a
   * stream the caller is not reading. Null for a run that did produce one, and for a human run,
   * where the CLI had the terminal and the caller already saw it.
   */
  output: string | null;
  /**
   * What this CLI can add about the project that the Expo CLI's message does not say, or says
   * wrongly. Empty when there is nothing to add.
   */
  notes: string[];
}

/**
 * Read the project's own manifest and say what is actually true of each named package.
 *
 * Three states, and the Expo CLI's failure message describes only the second: a package the
 * manifest does not name at all, a package it names that is not in `node_modules`, and one that is
 * present and simply failed the version check. Only the first two are worth a note — the third is
 * what `--check` is for, and the CLI's own report says it better.
 *
 * Never throws: a manifest that cannot be read leaves the notes empty, and an empty note list is
 * the same answer as "nothing to add".
 *
 * @param packages package specs as they were typed, e.g. `['expo-camera@~17.0.0']`.
 */
export async function diagnoseCheckedPackagesAsync(
  projectRoot: string,
  packages: string[]
): Promise<string[]> {
  if (!packages.length) {
    return [];
  }
  const declared = listDependencyNames(await readProjectPackageJsonAsync(projectRoot));
  const notes: string[] = [];

  for (const spec of packages) {
    const name = parsePackageName(spec);
    if (!declared.includes(name)) {
      notes.push(
        `"${name}" is not in this project's package.json — neither dependencies nor devDependencies — so there is no installed version for --check to compare against. ` +
          `The Expo CLI's message says it "is added as a dependency in your project's package.json", which is not the case here. ` +
          `Run "${PROGRAM_PREFIX} install ${name}" to add it.`
      );
      continue;
    }
    if ((await resolvePackageRootAsync(projectRoot, name)) == null) {
      notes.push(
        `"${name}" is in this project's package.json but not in node_modules, so the dependencies have not been installed since it was added. ` +
          `Run the project's package manager install, then run this check again.`
      );
    }
  }

  return notes;
}
