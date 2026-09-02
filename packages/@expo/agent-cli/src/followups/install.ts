// @ref llp/0009-smart-followups.rfc.md §Examples per command — `install`.
// @ref llp/0017-deferred-commands.reference.md §Not built — teachable warnings: a mismatch the command
// detected is attached as the correction, instead of failing later on a device.

import { PROGRAM_PREFIX } from '../programName';
import type { InstallImpactReport } from '../project/types';
import { capFollowUps, type FollowUp } from './types';

/** Actions of the impact classifier that mean the installed app cannot load the new code. */
const REBUILD_ACTIONS: InstallImpactReport['action'][] = ['prebuild-and-build', 'native-sync'];

export interface InstallFollowUpInput {
  /** What the impact classifier said about each package that was installed. */
  reports: InstallImpactReport[];
  /** Packages of this install that ship an agent skill. */
  packagesWithSkills: string[];
}

/**
 * What to do after an install: rebuild or reload, and read the skill of what was installed.
 *
 * The rebuild warning covers both ways the running app can be unable to load a native module: a
 * project targeting Expo Go, which has no build of its own, and a development build made before
 * the module existed. Either way the answer is the same command.
 */
export function buildInstallFollowUps({
  reports,
  packagesWithSkills,
}: InstallFollowUpInput): FollowUp[] {
  if (!reports.length) {
    return [];
  }

  const followups: FollowUp[] = [];
  const rebuild = reports.filter((report) => REBUILD_ACTIONS.includes(report.action));

  if (rebuild.length) {
    const names = rebuild.map((report) => report.packageName).join(', ');
    followups.push({
      id: 'dev',
      command: `${PROGRAM_PREFIX} dev`,
      why: `The app that is running now cannot load ${names}, which changed the native surface: this plans and makes the development build that can.`,
    });
  } else {
    // The command named here used to be `runtime:errors`, which reloads nothing — so the sentence
    // said "reloading the app is enough" and then handed over a command that only watches one
    // [observed — friction run 3, F31]. `reload` is the step the sentence describes, and its own
    // follow-ups lead to the error window afterwards.
    followups.push({
      id: 'reload-app',
      command: `${PROGRAM_PREFIX} runtime:reload`,
      why: reloadReason(reports),
    });
  }

  if (packagesWithSkills.length === 1) {
    followups.push({
      id: 'skills-show',
      command: `${PROGRAM_PREFIX} skills:show ${packagesWithSkills[0]}`,
      why: `${packagesWithSkills[0]} ships an agent skill: read it before writing code against the package.`,
    });
  } else if (packagesWithSkills.length > 1) {
    followups.push({
      id: 'skills-list',
      command: `${PROGRAM_PREFIX} skills:list`,
      why: `${packagesWithSkills.length} of the installed packages ship agent skills: read them before writing code against the packages.`,
    });
  }

  // Last, so the cap decides (llp/0009 §Where the typecheck rung goes). A package that ships a
  // skill has something to read *before* the code against it is written, and this checks code that
  // is not written yet; a package that ships none leaves the third slot to the rung that says
  // whether the code compiles against the types the new package brought with it.
  followups.push({
    id: 'typecheck',
    command: `${PROGRAM_PREFIX} typecheck`,
    why: 'A new package brings its own types with it: this is the gate that sees a call that does not match them, which neither the bundler nor the running app reports.',
  });

  return capFollowUps(followups);
}

/**
 * Why a reload is enough, in the words of what the classifier actually found.
 *
 * There are two reasons and they are not the same claim (F134, live wave 31). `install
 * expo-haptics` used to answer "Only JavaScript changed" beside its own `impact: "native-module"`
 * and `ships an ios/ directory` — a contradiction inside one object, and the wrong half is the
 * sentence: the package ships native code, and what makes the reload enough is that **Expo Go
 * already carries it**. That reason stops holding the moment the project builds a runtime of its
 * own, which is what an agent needs to know and what the shorter sentence hid.
 *
 * A native package can only reach this rung by being bundled into the runtime the project targets
 * (`resolveAction`: `expoGoBundled && targetsExpoGo`), so Expo Go can be named rather than hedged.
 * A set that mixes both kinds says only what is true of the set.
 */
function reloadReason(reports: InstallImpactReport[]): string {
  const bundled = reports.filter((report) => report.impact !== 'js-only');
  if (!bundled.length) {
    return 'Only JavaScript changed, so reloading the app is enough to pick the package up — no rebuild.';
  }
  const names = bundled.map((report) => report.packageName).join(', ');
  const carried = `Expo Go already carries ${names}, so no rebuild is needed for it`;
  return bundled.length === reports.length
    ? `${carried}: reloading the app is enough to pick it up. A project that builds its own runtime would need a new build.`
    : `${carried}, and the rest changed JavaScript only: reloading the app is enough to pick the packages up.`;
}
