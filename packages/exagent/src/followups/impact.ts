// @ref llp/0009-smart-followups.rfc.md §Examples per command — `impact`.
// Each class has a different next command, and the OTA verdict is a rung of its own because it is
// a different question with a different answer: a change can be free to run and unsafe to publish.

import type { CachedBuild, ImpactClass } from '../impact/types';
import {
  easBuildCommand,
  localTool,
  EAS_DEVELOPMENT_PROFILE,
  EAS_REQUIREMENT,
  EAS_WHERE,
  LOCAL_WHERE,
} from '../toolchain/runsOn';
import { capFollowUps, type FollowUp } from './types';

export interface ImpactFollowUpInput {
  impactClass: ImpactClass;
  /** The OTA verdict, `null` when the runtimeVersion policy could not be resolved. */
  otaSafe: boolean | null;
  /** A finished build EAS already has for this fingerprint, when the lookup found one. */
  cachedBuild: CachedBuild | null;
  /** The platform, when exactly one was classified, so the commands can name it. */
  platform: 'ios' | 'android' | null;
}

export function buildImpactFollowUps({
  impactClass,
  otaSafe,
  cachedBuild,
  platform,
}: ImpactFollowUpInput): FollowUp[] {
  const followups: FollowUp[] = [];
  const platformFlag = platform ? ` --platform ${platform}` : '';

  if (impactClass === 'needs-native-build') {
    if (cachedBuild?.id) {
      // The materially better answer, and the reason the build-cache lookup exists at all: a
      // build that already exists is minutes saved over one that has to be started.
      followups.push({
        id: 'impact-cached-build',
        command: `npx eas build:download --build-id ${cachedBuild.id}`,
        why: `EAS already has a finished build made from this exact fingerprint (${cachedBuild.id}), so installing it is the same app a new build would produce, without the wait.`,
      });
    } else {
      // @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
      // Both routes, because "you need a native build" is not one instruction: one of them runs on
      // this machine and needs Xcode or the Android SDK, the other runs in the cloud and needs an
      // Expo account, and which is right depends on what the caller has and what they need out of
      // it. Naming only the local one told a developer with no Xcode to do something impossible.
      followups.push({
        id: 'impact-native-build',
        command: `npx exagent dev${platformFlag ? ` --${platform}` : ''}`,
        why: `The native surface changed, so the installed app cannot run this code. This rebuilds it ${LOCAL_WHERE} — the fast route when this machine has ${localTool(platform)}, because the plan engine prebuilds and rebuilds only what has to be.`,
      });
      followups.push({
        id: 'impact-eas-build',
        command: platform
          ? easBuildCommand(platform)
          : `npx eas build --profile ${EAS_DEVELOPMENT_PROFILE}`,
        why: `The same rebuild ${EAS_WHERE}: slower to start and it needs ${EAS_REQUIREMENT}, and it works without ${localTool(platform)} ${LOCAL_WHERE} and ends in an artifact with a URL somebody else can install.`,
      });
    }
  } else if (impactClass === 'dev-client-compatible') {
    followups.push({
      id: 'impact-restart-metro',
      command: 'npx exagent dev:stop && npx exagent dev --detach',
      why: 'The installed app is still the right one; what changed is a file the dev server read once at start-up, so only Metro has to come back.',
    });
  } else {
    followups.push({
      id: 'impact-reload',
      command: 'npx exagent runtime:reload',
      why: 'Nothing native changed, so the running app only has to fetch the new bundle. This also reports whether the entry bundle compiles before it broadcasts anything.',
    });
  }

  if (otaSafe === false) {
    followups.push({
      id: 'impact-ota-unsafe',
      command: `npx exagent impact${platformFlag} --json`,
      why: 'An update published now would reach installed builds that cannot run it — read the "ota" section for the runtimeVersion policy that decides this, before running eas update.',
    });
  } else if (otaSafe === true && impactClass !== 'needs-native-build') {
    followups.push({
      id: 'impact-ota-safe',
      command: 'npx eas update --auto',
      why: 'The native surface is unchanged and the runtimeVersion policy agrees, so this change can ship over the air without a new build.',
    });
  }

  followups.push({
    id: 'impact-typecheck',
    command: 'npx exagent typecheck',
    why: 'This classifies what a change costs to run, not whether it is correct: a type error compiles and bundles perfectly.',
  });

  return capFollowUps(followups);
}
