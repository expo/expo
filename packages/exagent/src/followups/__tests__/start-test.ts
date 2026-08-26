import type { ProjectState, StartPlan } from '../../project/types';
import type { PlanBuildLocation } from '../../toolchain/types';
import {
  buildEasBuildFollowUp,
  buildStartFollowUps,
  buildStartPlanFollowUps,
  resolveDevServerPort,
  DEFAULT_DEV_SERVER_PORT,
} from '../start';

/** The build location a stale plan carries, with whatever the probe answered. */
function mockBuildLocation(overrides: Partial<PlanBuildLocation> = {}): PlanBuildLocation {
  return {
    runsOn: 'local',
    platform: 'ios',
    requirement: 'Xcode on this machine',
    status: null,
    detail: null,
    caveats: [],
    alternativeCommand: 'npx eas build --platform ios --profile development',
    ...overrides,
  };
}

const lanUrl = 'exp://192.168.1.5:8081';

function ids(followups: { id: string }[]): string[] {
  return followups.map((followup) => followup.id);
}

function mockState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    projectRoot: '/project',
    sdkVersion: '54.0.0',
    nativeDirs: { ios: false, android: false },
    usesDevClient: false,
    hasWeb: true,
    expoGo: { compatible: true, reasons: [] },
    fingerprint: { hash: 'abc123' },
    ...overrides,
  };
}

function mockPlan(overrides: Partial<StartPlan> = {}): StartPlan {
  return {
    target: 'expo-go',
    rule: 'expo-go',
    reasons: ['Expo Go can run this project.'],
    steps: [
      {
        id: 'start',
        argv: ['expo', 'start', '--go'],
        reason: 'Opens the project in Expo Go.',
        timeClass: 'seconds',
        runsOn: null,
      },
    ],
    buildLocation: null,
    ...overrides,
  };
}

describe(buildStartFollowUps, () => {
  // The ladder starts one rung lower than it used to: a dev server serves a bundle and opens
  // nothing, and opening the app was the one step no exagent command named. The cap of three then
  // drops the furthest rung, which is what the cap is for.
  it(`should offer the open step, the LAN URL, and the runtime loop`, () => {
    const followups = buildStartFollowUps({ expoGo: true, web: false, lanUrl, easJson: true });

    expect(ids(followups)).toEqual(['open-app', 'real-device', 'runtime-errors']);
    expect(followups[0]!.command).toBe('npx exagent navigate /');
    expect(followups[1]!.command).toBe(lanUrl);
  });

  // The EAS rung is still the last one built, and the cap is still what drops it — for either
  // answer to "does this project have an eas.json", and whatever else the ladder holds.
  it.each([true, false])(
    `should keep the cloud build off a native ladder (eas.json: %s)`,
    (easJson) => {
      const followups = buildStartFollowUps({ expoGo: true, web: false, lanUrl, easJson });

      expect(followups).toHaveLength(3);
      expect(ids(followups)).not.toContain('eas-build');
      expect(ids(followups)).not.toContain('eas-build-configure');
    }
  );

  it(`should fall back to a tunnel when the host has no LAN address`, () => {
    const followups = buildStartFollowUps({
      expoGo: true,
      web: false,
      lanUrl: null,
      easJson: true,
    });

    expect(ids(followups)).toEqual(['open-app', 'real-device-tunnel', 'runtime-errors']);
    expect(followups[1]!.command).toBe('npx exagent start --tunnel');
    expect(followups[1]!.why).toContain('no LAN address');
  });

  it(`should offer a tunnel for a development build, which needs no exp:// URL`, () => {
    const followups = buildStartFollowUps({ expoGo: false, web: false, lanUrl, easJson: true });

    expect(ids(followups)).toEqual(['open-app', 'real-device-tunnel', 'runtime-errors']);
    expect(followups[1]!.why).toContain('development build');
  });

  // A browser needs no simulator and no phone, so neither the open step nor the device hint is
  // built for a web run — and `runtime:errors` has no debugger target to read either. The list
  // used to be `runtime-errors` then `eas build:configure`, a cloud *native* build the run did not
  // need, and named neither the site nor a way to check the bundle [observed — friction run 2].
  describe('a web run', () => {
    const web = { expoGo: true, web: true, lanUrl, easJson: true } as const;

    it(`should lead with the site URL and the web bundle check`, () => {
      const followups = buildStartFollowUps({ ...web, webUrl: 'http://localhost:8134' });

      expect(ids(followups)).toEqual(['web-url', 'web-bundle-check', 'deploy-web']);
      expect(followups[0]!.command).toBe('http://localhost:8134');
      expect(followups[1]!.command).toBe('npx exagent dev:wait --platform web');
    });

    it(`should offer the deploy that ships a web build, not a native cloud build`, () => {
      const followups = buildStartFollowUps({ ...web, webUrl: 'http://localhost:8134' });

      expect(followups.at(-1)!.command).toBe('npx exagent deploy --web');
      expect(ids(followups)).not.toContain('eas-build-configure');
    });

    // Naming `http://localhost:8081` here would be the same guess about which process holds the
    // default port that sent a device into another project's app.
    it(`should name no URL when nothing reported a port`, () => {
      const followups = buildStartFollowUps({ ...web, webUrl: null });

      expect(ids(followups)).toEqual(['dev-server-port-unknown', 'web-bundle-check', 'deploy-web']);
      expect(followups.some((followup) => followup.command.startsWith('http://localhost'))).toBe(
        false
      );
    });
  });

  it(`should never offer more than three follow-ups`, () => {
    for (const expoGo of [true, false]) {
      for (const web of [true, false]) {
        for (const easJson of [true, false]) {
          for (const url of [lanUrl, null]) {
            expect(
              buildStartFollowUps({ expoGo, web, easJson, lanUrl: url }).length
            ).toBeLessThanOrEqual(3);
          }
        }
      }
    }
  });

  it(`should give every follow-up a stable kebab-case id, a command, and a reason`, () => {
    const followups = buildStartFollowUps({ expoGo: true, web: false, lanUrl, easJson: true });

    for (const followup of followups) {
      expect(followup.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(followup.command).toBeTruthy();
      expect(followup.why).toBeTruthy();
    }
  });
});

describe(buildStartPlanFollowUps, () => {
  it(`should offer to run the plan that was printed`, () => {
    const followups = buildStartPlanFollowUps(mockPlan(), mockState());

    expect(ids(followups)).toEqual(['dev']);
    expect(followups[0]!.command).toBe('npx exagent dev');
  });

  it.each(['dev-client-stale', 'bare-stale', 'needs-dev-client'])(
    `should explain what makes the %s plan cheaper`,
    (rule) => {
      const followups = buildStartPlanFollowUps(mockPlan({ rule }), mockState());

      expect(ids(followups)).toContain('build-freshness');
      expect(followups.find((item) => item.id === 'build-freshness')!.command).toBe(
        'npx exagent status'
      );
    }
  );

  it.each(['expo-go', 'web', 'dev-client-fresh', 'bare-fresh'])(
    `should not offer a freshness hint for the %s plan, which builds nothing`,
    (rule) => {
      const followups = buildStartPlanFollowUps(mockPlan({ rule }), mockState());

      expect(ids(followups)).not.toContain('build-freshness');
    }
  );

  it(`should point at the Expo Go reasons when Expo Go is out`, () => {
    const followups = buildStartPlanFollowUps(
      mockPlan({ rule: 'dev-client-stale' }),
      mockState({
        expoGo: { compatible: false, reasons: [{ kind: 'config-plugin', detail: 'a plugin' }] },
      })
    );

    expect(ids(followups)).toEqual(['dev', 'build-freshness', 'project-context']);
    expect(followups.at(-1)!.command).toBe('npx exagent status --json');
  });

  it(`should never offer more than three follow-ups`, () => {
    const followups = buildStartPlanFollowUps(
      mockPlan({ rule: 'needs-dev-client' }),
      mockState({ expoGo: { compatible: false, reasons: [] } })
    );

    expect(followups).toHaveLength(3);
  });

  // @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
  describe('a plan this machine cannot build', () => {
    it(`should lead with the cloud build rather than with the plan that would fail`, () => {
      const followups = buildStartPlanFollowUps(
        mockPlan({
          rule: 'dev-client-stale',
          buildLocation: mockBuildLocation({
            status: 'missing',
            detail: 'xcode-select is not on PATH.',
          }),
        }),
        mockState()
      );

      expect(ids(followups)).toEqual(['eas-build-instead', 'dev', 'build-freshness']);
      expect(followups[0]!.command).toBe('npx eas build --platform ios --profile development');
      // The bare tool name, because the sentence has already said where: "this machine has no
      // Xcode on this machine" is what the requirement string produces when it is dropped in.
      expect(followups[0]!.why).toContain('this machine does not have Xcode');
      expect(followups[0]!.why).toContain('an Expo account');
    });

    it(`should keep the plan first when the machine can build`, () => {
      const followups = buildStartPlanFollowUps(
        mockPlan({
          rule: 'dev-client-stale',
          buildLocation: mockBuildLocation({ status: 'present', detail: 'Xcode 16.2.' }),
        }),
        mockState()
      );

      expect(ids(followups)).toEqual(['dev', 'build-freshness']);
    });

    // Nothing was established, so the plan is still the thing to try: a cloud build offered over
    // an unread probe is advice built on no evidence at all.
    it(`should keep the plan first when the probe could not decide`, () => {
      const followups = buildStartPlanFollowUps(
        mockPlan({
          rule: 'dev-client-stale',
          buildLocation: mockBuildLocation({ status: 'unknown', detail: 'EPERM' }),
        }),
        mockState()
      );

      expect(ids(followups)).not.toContain('eas-build-instead');
      expect(ids(followups)[0]).toBe('dev');
    });
  });
});

// @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
// The cloud rung is built for every native ladder and dropped by the cap of three, so it is
// asserted here rather than through `buildStartFollowUps`, which only ever returns the survivors.
describe(buildEasBuildFollowUp, () => {
  it(`should name it a cloud build and say what a cloud build needs`, () => {
    const followup = buildEasBuildFollowUp(true);

    expect(followup.id).toBe('eas-build');
    expect(followup.why).toContain('cloud build');
    expect(followup.why).toContain('an Expo account');
  });

  it(`should say the same of the configure step, which precedes the first one`, () => {
    const followup = buildEasBuildFollowUp(false);

    expect(followup.id).toBe('eas-build-configure');
    expect(followup.command).toBe('npx eas build:configure');
    expect(followup.why).toContain('cloud build');
    expect(followup.why).toContain('an Expo account');
  });

  // The reverse hint: the reader has Xcode, so "you can build in the cloud" is not news. What is
  // news is the two things a local build cannot give them.
  it(`should say why the cloud is worth it anyway when this machine can build`, () => {
    const followup = buildEasBuildFollowUp(true, 'present');

    expect(followup.why).toContain('This machine can do a local build itself');
    expect(followup.why).toContain('credentials this machine does not hold');
    expect(followup.why).toContain('downloadable artifact');
  });

  it.each([null, 'missing', 'unknown'] as const)(
    `should leave the reverse hint out when the local build is %s`,
    (status) => {
      expect(buildEasBuildFollowUp(true, status).why).not.toContain('This machine can do a');
    }
  );
});

describe(resolveDevServerPort, () => {
  it(`should use the default port when none is asked for`, () => {
    expect(resolveDevServerPort([])).toBe(DEFAULT_DEV_SERVER_PORT);
    expect(resolveDevServerPort(['--go'])).toBe(DEFAULT_DEV_SERVER_PORT);
  });

  it.each([
    [['--port', '8082'], 8082],
    [['-p', '19000'], 19000],
    [['--port=8083'], 8083],
    [['--go', '--port', '8084', '--clear'], 8084],
  ])(`should read the port from %s`, (args, port) => {
    expect(resolveDevServerPort(args)).toBe(port);
  });

  it.each([[['--port']], [['--port', 'zero']], [['--port', '-1']], [['--port', '99999999']]])(
    `should fall back to the default for the unusable value in %s`,
    (args) => {
      expect(resolveDevServerPort(args)).toBe(DEFAULT_DEV_SERVER_PORT);
    }
  );
});
