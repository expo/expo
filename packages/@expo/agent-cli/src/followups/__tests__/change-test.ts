/* eslint-env jest */
// @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
// `impact` says a native build is needed; these assert that it says *where* one can happen. The
// two routes want different things of the caller — a toolchain on this machine, or an Expo
// account — so naming only one of them is an instruction half the readers cannot follow.
import { buildChangeFollowUps, type ChangeFollowUpInput } from '../change';

function input(overrides: Partial<ChangeFollowUpInput> = {}): ChangeFollowUpInput {
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

/** A resolved backend, as `impactAsync` hands one to the builder. */
function backend(runsOn: 'local' | 'eas') {
  const because =
    runsOn === 'eas' ? 'this host runs linux and an ios build needs Xcode.' : 'this machine has Xcode.';
  return {
    runsOn,
    source: runsOn === 'eas' ? ('host' as const) : ('default' as const),
    because,
    why: `Building ${runsOn === 'eas' ? 'in the cloud on EAS' : 'on this machine'}: ${because}`,
    doomed: false,
  };
}

describe(buildChangeFollowUps, () => {
  describe('needs-native-build', () => {
    it(`should name the local route and the cloud route, in that order`, () => {
      const followups = buildChangeFollowUps(input());

      expect(ids(followups).slice(0, 2)).toEqual(['change-native-build', 'change-eas-build']);
      expect(followups[0]!.command).toBe('npx exagent dev --ios');
      expect(followups[1]!.command).toBe('npx eas build --platform ios --profile development');
    });

    // @ref llp/0015-backend-selection-and-config.rfc.md §The follow-ups of a chosen backend
    it(`should say the plan goes to the cloud when this host cannot build`, () => {
      const followups = buildChangeFollowUps(input({ buildBackend: backend('eas') }));

      expect(ids(followups).slice(0, 2)).toEqual(['change-native-build', 'change-local-build']);
      // Still `exagent dev` first: it is the command that makes a plan, and on this host the plan
      // it makes is the cloud one.
      expect(followups[0]!.command).toBe('npx exagent dev --ios');
      expect(followups[0]!.why).toContain('in the cloud on EAS');
      expect(followups[0]!.why).toContain('this host runs linux');
    });

    it(`should offer --local as the way past a choice the caller disagrees with`, () => {
      const [, forced] = buildChangeFollowUps(input({ buildBackend: backend('eas') }));

      expect(forced!.command).toBe('npx exagent dev --ios --local');
      expect(forced!.why).toContain('on this machine');
    });

    it(`should keep the old order when the backend was chosen as local`, () => {
      const followups = buildChangeFollowUps(input({ buildBackend: backend('local') }));

      expect(ids(followups).slice(0, 2)).toEqual(['change-native-build', 'change-eas-build']);
    });

    it(`should say what each route costs the caller`, () => {
      const [local, cloud] = buildChangeFollowUps(input());

      expect(local!.why).toContain('on this machine');
      expect(local!.why).toContain('this machine has Xcode');
      expect(cloud!.why).toContain('in the cloud on EAS');
      expect(cloud!.why).toContain('an Expo account');
      // The one thing a local build cannot do, which is what makes the slower route worth it.
      expect(cloud!.why).toContain('artifact');
    });

    it(`should name the android toolchain when android is the platform`, () => {
      const [local, cloud] = buildChangeFollowUps(input({ platform: 'android' }));

      expect(local!.why).toContain('this machine has the Android SDK');
      expect(cloud!.command).toBe('npx eas build --platform android --profile development');
    });

    it(`should leave the platform out of both commands when the report named none`, () => {
      const [local, cloud] = buildChangeFollowUps(input({ platform: null }));

      expect(local!.command).toBe('npx exagent dev');
      expect(local!.why).toContain('the platform toolchain');
      expect(cloud!.command).toBe('npx eas build --profile development');
    });

    // A build that already exists beats both routes, so it stays the only one offered: neither
    // "build it here" nor "build it there" is worth minutes when the artifact is sitting on EAS.
    it(`should offer neither route when EAS already has a build for this fingerprint`, () => {
      const followups = buildChangeFollowUps(
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

      expect(ids(followups)).toContain('cached-build');
      expect(ids(followups)).not.toContain('change-native-build');
      expect(ids(followups)).not.toContain('change-eas-build');
    });
  });

  it.each(['js-only', 'dev-client-compatible'] as const)(
    `should name no build route for a %s change, which needs none`,
    (impactClass) => {
      const followups = buildChangeFollowUps(input({ impactClass }));

      expect(ids(followups)).not.toContain('change-native-build');
      expect(ids(followups)).not.toContain('change-eas-build');
    }
  );

  it(`should never offer more than three follow-ups`, () => {
    expect(buildChangeFollowUps(input({ otaSafe: false }))).toHaveLength(3);
  });
});
