// @ref llp/0009-smart-followups.rfc.md §Examples per command — `install`.
// @ref llp/0009-smart-followups.rfc.md §Wider ideas — teachable warnings: a mismatch the command
// detected is attached as the correction, instead of failing later on a device.

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
      command: 'npx exagent dev',
      why: `The app that is running now cannot load ${names}, which changed the native surface: this plans and makes the development build that can.`,
    });
  } else {
    // The command named here used to be `runtime:errors`, which reloads nothing — so the sentence
    // said "reloading the app is enough" and then handed over a command that only watches one
    // [observed — friction run 3, F31]. `reload` is the step the sentence describes, and its own
    // follow-ups lead to the error window afterwards.
    followups.push({
      id: 'reload-app',
      command: 'npx exagent runtime:reload',
      why: 'Only JavaScript changed, so reloading the app is enough to pick the package up — no rebuild.',
    });
  }

  if (packagesWithSkills.length === 1) {
    followups.push({
      id: 'skills-show',
      command: `npx exagent skills:show ${packagesWithSkills[0]}`,
      why: `${packagesWithSkills[0]} ships an agent skill: read it before writing code against the package.`,
    });
  } else if (packagesWithSkills.length > 1) {
    followups.push({
      id: 'skills-list',
      command: 'npx exagent skills:list',
      why: `${packagesWithSkills.length} of the installed packages ship agent skills: read them before writing code against the packages.`,
    });
  }

  return capFollowUps(followups);
}
