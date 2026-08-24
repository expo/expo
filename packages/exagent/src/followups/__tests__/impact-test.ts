/* eslint-env jest */
// @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
// `impact` says a native build is needed; these assert that it says *where* one can happen. The
// two routes want different things of the caller — a toolchain on this machine, or an Expo
// account — so naming only one of them is an instruction half the readers cannot follow.
import { buildImpactFollowUps, type ImpactFollowUpInput } from '../impact';

function input(overrides: Partial<ImpactFollowUpInput> = {}): ImpactFollowUpInput {
  return {
    impactClass: 'needs-native-build',
    otaSafe: null,
    cachedBuild: null,
    platform: 'ios',
    ...overrides,
  };
}

function ids(followups: { id: string }[]): string[] {
  return followups.map((followup) => followup.id);
}

describe(buildImpactFollowUps, () => {
  describe('needs-native-build', () => {
    it(`should name the local route and the cloud route, in that order`, () => {
      const followups = buildImpactFollowUps(input());

      expect(ids(followups).slice(0, 2)).toEqual(['impact-native-build', 'impact-eas-build']);
      expect(followups[0]!.command).toBe('npx exagent dev --ios');
      expect(followups[1]!.command).toBe('npx eas build --platform ios --profile development');
    });

    it(`should say what each route costs the caller`, () => {
      const [local, cloud] = buildImpactFollowUps(input());

      expect(local!.why).toContain('on this machine');
      expect(local!.why).toContain('this machine has Xcode');
      expect(cloud!.why).toContain('in the cloud on EAS');
      expect(cloud!.why).toContain('an Expo account');
      // The one thing a local build cannot do, which is what makes the slower route worth it.
      expect(cloud!.why).toContain('artifact');
    });

    it(`should name the android toolchain when android is the platform`, () => {
      const [local, cloud] = buildImpactFollowUps(input({ platform: 'android' }));

      expect(local!.why).toContain('this machine has the Android SDK');
      expect(cloud!.command).toBe('npx eas build --platform android --profile development');
    });

    it(`should leave the platform out of both commands when the report named none`, () => {
      const [local, cloud] = buildImpactFollowUps(input({ platform: null }));

      expect(local!.command).toBe('npx exagent dev');
      expect(local!.why).toContain('the platform toolchain');
      expect(cloud!.command).toBe('npx eas build --profile development');
    });

    // A build that already exists beats both routes, so it stays the only one offered: neither
    // "build it here" nor "build it there" is worth minutes when the artifact is sitting on EAS.
    it(`should offer neither route when EAS already has a build for this fingerprint`, () => {
      const followups = buildImpactFollowUps(
        input({
          cachedBuild: {
            id: 'abc-123',
            status: 'FINISHED',
            platform: 'IOS',
            buildProfile: 'development',
            createdAt: null,
            buildUrl: null,
          },
        })
      );

      expect(ids(followups)).toContain('impact-cached-build');
      expect(ids(followups)).not.toContain('impact-native-build');
      expect(ids(followups)).not.toContain('impact-eas-build');
    });
  });

  it.each(['js-only', 'dev-client-compatible'] as const)(
    `should name no build route for a %s change, which needs none`,
    (impactClass) => {
      const followups = buildImpactFollowUps(input({ impactClass }));

      expect(ids(followups)).not.toContain('impact-native-build');
      expect(ids(followups)).not.toContain('impact-eas-build');
    }
  );

  it(`should never offer more than three follow-ups`, () => {
    expect(buildImpactFollowUps(input({ otaSafe: false }))).toHaveLength(3);
  });
});
