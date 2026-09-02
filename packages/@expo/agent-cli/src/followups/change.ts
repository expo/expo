// @ref llp/0009-smart-followups.rfc.md §Examples per command — the impact headline of `status`.
// Each class has a different next command, and the OTA verdict is a rung of its own because it is
// a different question with a different answer: a change can be free to run and unsafe to publish.
//
// The ids are spelled `change-*` rather than `impact-*`: they name what a *change* costs, which is
// a section of `@expo/agent-cli status` now that `@expo/agent-cli impact` is gone. An id that named a command
// nobody can run is exactly the stale string the suggested-command lint exists to catch, one level
// up.

import type { CachedBuild, ImpactClass } from '../impact/types';
import { PROGRAM_PREFIX } from '../programName';
import {
  easBuildCommand,
  localTool,
  EAS_DEVELOPMENT_PROFILE,
  EAS_REQUIREMENT,
  EAS_WHERE,
  LOCAL_WHERE,
} from '../toolchain/runsOn';
import type { BuildBackendChoice } from '../toolchain/selectBackend';
import { cachedBuildFollowUp } from './cachedBuild';
import { capFollowUps, type FollowUp } from './types';

export interface ChangeFollowUpInput {
  impactClass: ImpactClass;
  /** The OTA verdict, `null` when the runtimeVersion policy could not be resolved. */
  otaSafe: boolean | null;
  /** A finished build EAS already has for this fingerprint, when the lookup found one. */
  cachedBuild: CachedBuild | null;
  /** The platform, when exactly one was classified, so the commands can name it. */
  platform: 'ios' | 'android' | null;
  /**
   * Where a build of this project would run, when something resolved it.
   *
   * @ref llp/0015-backend-selection-and-config.rfc.md §The follow-ups of a chosen backend
   * "You need a native build" is two instructions, and this says which of them to read first.
   * `null` keeps the old ladder — the local route first, the cloud second — which is the honest
   * order when nothing has looked at the host.
   */
  buildBackend?: BuildBackendChoice | null;
}

export function buildChangeFollowUps({
  impactClass,
  otaSafe,
  cachedBuild,
  platform,
  buildBackend = null,
}: ChangeFollowUpInput): FollowUp[] {
  const followups: FollowUp[] = [];
  const platformFlag = platform ? ` --platform ${platform}` : '';

  if (impactClass === 'needs-native-build') {
    if (cachedBuild?.id) {
      // The materially better answer, and the reason the build-cache lookup exists at all: a
      // build that already exists is minutes saved over one that has to be started. `status`
      // offers the same rung from its own starting point, so the builder is shared.
      followups.push(cachedBuildFollowUp(cachedBuild.id));
    } else {
      // @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
      // Both routes, because "you need a native build" is not one instruction: one of them runs on
      // this machine and needs Xcode or the Android SDK, the other runs in the cloud and needs an
      // Expo account, and which is right depends on what the caller has and what they need out of
      // it. Naming only the local one told a developer with no Xcode to do something impossible.
      // @ref llp/0015-backend-selection-and-config.rfc.md §The follow-ups of a chosen backend
      // `@expo/agent-cli dev` is first whichever backend was chosen, because it is the command that
      // *makes a plan* — and on a machine that cannot build here, the plan it makes is the cloud
      // one. What the choice changes is the sentence, which now says which route that plan takes
      // and why, rather than offering a local build to a host that has no toolchain for it.
      const runsOnEas = buildBackend?.runsOn === 'eas';
      followups.push({
        id: 'change-native-build',
        command: `${PROGRAM_PREFIX} dev${platformFlag ? ` --${platform}` : ''}`,
        why: runsOnEas
          ? `The native surface changed, so the installed app cannot run this code. This plans the rebuild ${EAS_WHERE} — ${buildBackend!.because} — and prints the plan before it starts anything.`
          : `The native surface changed, so the installed app cannot run this code. This rebuilds it ${LOCAL_WHERE} — the fast route when this machine has ${localTool(platform)}, because the plan engine prebuilds and rebuilds only what has to be.`,
      });
      followups.push({
        id: runsOnEas ? 'change-local-build' : 'change-eas-build',
        command: runsOnEas
          ? `${PROGRAM_PREFIX} dev${platformFlag ? ` --${platform}` : ''} --local`
          : platform
            ? easBuildCommand(platform)
            : `npx eas build --profile ${EAS_DEVELOPMENT_PROFILE}`,
        why: runsOnEas
          ? `The same rebuild ${LOCAL_WHERE}, forced past the choice above: faster and free when this machine really does have ${localTool(platform)} somewhere nothing probed.`
          : `The same rebuild ${EAS_WHERE}: slower to start and it needs ${EAS_REQUIREMENT}, and it works without ${localTool(platform)} ${LOCAL_WHERE} and ends in an artifact with a URL somebody else can install.`,
      });
    }
  } else if (impactClass === 'dev-client-compatible') {
    followups.push({
      id: 'change-restart-metro',
      command: `${PROGRAM_PREFIX} dev:stop && ${PROGRAM_PREFIX} dev --detach`,
      why: 'The installed app is still the right one; what changed is a file the dev server read once at start-up, so only Metro has to come back.',
    });
  } else {
    followups.push({
      id: 'change-reload',
      command: `${PROGRAM_PREFIX} runtime:reload`,
      why: 'Nothing native changed, so the running app only has to fetch the new bundle. This also reports whether the entry bundle compiles before it broadcasts anything.',
    });
  }

  if (otaSafe === false) {
    followups.push({
      id: 'change-ota-unsafe',
      command: `${PROGRAM_PREFIX} status --explain --json`,
      why: 'An update published now would reach installed builds that cannot run it — read the "ota" section for the runtimeVersion policy that decides this, before running eas update.',
    });
  } else if (otaSafe === true && impactClass !== 'needs-native-build') {
    followups.push({
      id: 'change-ota-safe',
      command: 'npx eas update --auto',
      why: 'The native surface is unchanged and the runtimeVersion policy agrees, so this change can ship over the air without a new build.',
    });
  }

  followups.push({
    id: 'change-typecheck',
    command: `${PROGRAM_PREFIX} typecheck`,
    why: 'This classifies what a change costs to run, not whether it is correct: a type error compiles and bundles perfectly.',
  });

  return capFollowUps(followups);
}
