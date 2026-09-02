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
    selection: null,
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
    isExpoApp: true,
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
  // nothing, and opening the app was the one step no @expo/agent-cli command named. The cap of three then
  // drops the furthest rung, which is what the cap is for.
  it(`should offer the open step, the LAN URL, and the runtime loop`, () => {
    const followups = buildStartFollowUps({ expoGo: true, web: false, lanUrl, easJson: true });

    expect(ids(followups)).toEqual(['open-app', 'real-device', 'runtime-errors']);
    expect(followups[0]!.command).toBe('npx @expo/agent-cli navigate /');
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
    expect(followups[1]!.command).toBe('npx @expo/agent-cli start --tunnel');
    expect(followups[1]!.why).toContain('no LAN address');
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §Pointing an app at this dev server
  // `exp://` is the Expo Go form only, so the caller resolves which URL a device opens and this
  // builder is handed it. A development build with no URL to name falls through to the tunnel.
  it(`should offer a tunnel for a development build with no URL to name`, () => {
    const followups = buildStartFollowUps({
      expoGo: false,
      web: false,
      lanUrl: null,
      easJson: true,
    });

    expect(ids(followups)).toEqual(['open-app', 'real-device-tunnel', 'runtime-errors']);
    expect(followups[1]!.why).toContain('development build');
  });

  it(`should name the development build's own URL, and say which app opens it`, () => {
    const devClientUrl = 'myapp://expo-development-client/?url=http%3A%2F%2F192.168.1.5%3A8081';
    const followups = buildStartFollowUps({
      expoGo: false,
      web: false,
      lanUrl: devClientUrl,
      lanUrlLabel: 'your development build',
      easJson: true,
    });

    expect(ids(followups)).toEqual(['open-app', 'real-device', 'runtime-errors']);
    expect(followups[1]!.command).toBe(devClientUrl);
    expect(followups[1]!.why).toContain('your development build');
    // Never the other app's form.
    expect(followups[1]!.command).not.toContain('exp://');
  });

  // A browser needs no simulator and no phone, so neither the open step nor the device hint is
  // built for a web run — and `runtime:errors` has no debugger target to read either. The list
  // used to be `runtime-errors` then `eas build:configure`, a cloud *native* build the run did not
  // need, and named neither the site nor a way to check the bundle [observed — friction run 2].
  describe('a web run', () => {
    const web = { expoGo: true, web: true, lanUrl, easJson: true } as const;

    it(`should lead with the site URL and the web bundle check`, () => {
      const followups = buildStartFollowUps({ ...web, webUrl: 'http://localhost:8134' });

      expect(ids(followups)).toEqual(['web-url', 'web-typecheck', 'deploy-web']);
      expect(followups[0]!.command).toBe('http://localhost:8134');
      expect(followups[1]!.command).toBe('npx @expo/agent-cli typecheck');
    });

    it(`should offer the deploy that ships a web build, not a native cloud build`, () => {
      const followups = buildStartFollowUps({ ...web, webUrl: 'http://localhost:8134' });

      expect(followups.at(-1)!.command).toBe('npx @expo/agent-cli deploy --web');
      expect(ids(followups)).not.toContain('eas-build-configure');
    });

    // Naming `http://localhost:8081` here would be the same guess about which process holds the
    // default port that sent a device into another project's app.
    it(`should name no URL when nothing reported a port`, () => {
      const followups = buildStartFollowUps({ ...web, webUrl: null });

      expect(ids(followups)).toEqual(['dev-server-port-unknown', 'web-typecheck', 'deploy-web']);
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
    expect(followups[0]!.command).toBe('npx @expo/agent-cli dev');
  });

  // F103 — found live on 2026-08-27: `dev --plan --android` printed
  // `expo start --go --android` and then offered `npx @expo/agent-cli dev`, which on this Mac plans for
  // **iOS**. The one follow-up whose whole promise is "runs the plan above" ran a different plan.
  //
  // The flag the caller typed is what is carried, not the platform the plan settled on: a no-flag
  // run's plan is the host's default, and printing a flag nobody typed would claim the caller had
  // asked for it. That is the same `requestedPlatform` / `platform` split `decideStartPlan` keeps.
  it(`carries the platform flag the caller typed into the command that runs the plan (F103)`, () => {
    expect(
      buildStartPlanFollowUps(mockPlan(), mockState(), 'android').find(
        (followup) => followup.id === 'dev'
      )!.command
    ).toBe('npx @expo/agent-cli dev --android');

    expect(
      buildStartPlanFollowUps(mockPlan(), mockState(), undefined).find(
        (followup) => followup.id === 'dev'
      )!.command
    ).toBe('npx @expo/agent-cli dev');
  });

  it.each(['dev-client-stale', 'bare-stale', 'needs-dev-client'])(
    `should explain what makes the %s plan cheaper`,
    (rule) => {
      const followups = buildStartPlanFollowUps(mockPlan({ rule }), mockState());

      expect(ids(followups)).toContain('build-freshness');
      expect(followups.find((item) => item.id === 'build-freshness')!.command).toBe(
        'npx @expo/agent-cli status'
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
    expect(followups.at(-1)!.command).toBe('npx @expo/agent-cli status --json');
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

    // @ref llp/0015-backend-selection-and-config.rfc.md §The follow-ups of a chosen backend
    it(`should offer the account a cloud plan needs, rather than a route it already took`, () => {
      const followups = buildStartPlanFollowUps(
        mockPlan({
          rule: 'dev-client-stale',
          buildLocation: mockBuildLocation({
            runsOn: 'eas',
            requirement: 'an Expo account',
            alternativeCommand: 'npx expo run:ios',
            selection: {
              runsOn: 'eas',
              source: 'host',
              because: 'this host runs linux.',
              why: 'Building in the cloud on EAS: this host runs linux.',
              doomed: false,
            },
          }),
        }),
        mockState()
      );

      expect(ids(followups)).toEqual(['eas-account', 'dev', 'build-freshness']);
      expect(followups[0]!.command).toBe('npx eas whoami');
      expect(followups[0]!.why).toContain('an Expo account');
      // The plan already went to the cloud, so offering the cloud again says nothing.
      expect(ids(followups)).not.toContain('eas-build-instead');
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

// @ref llp/0009-smart-followups.rfc.md §Device-aware ladders
describe(`${buildStartFollowUps.name} — a tunnelled run, and a machine with no device`, () => {
  const base = { expoGo: true, web: false, lanUrl, easJson: true };

  // The LAN URL is not merely unhelpful for a tunnelled run, it is wrong: `--tunnel` is asked for
  // by somebody whose device is not on this network, and that is the URL a dogfood session handed
  // a cloud simulator [observed — 2026-08-24].
  it(`never names the LAN URL when the run was asked for a tunnel`, () => {
    const followups = buildStartFollowUps({ ...base, tunnel: true });

    expect(followups.map((followup) => followup.command)).not.toContain(lanUrl);
    expect(ids(followups)).toContain('real-device-tunnel');
    expect(followups.find((followup) => followup.id === 'real-device-tunnel')!.command).toBe(
      'npx @expo/agent-cli navigate / --print-url'
    );
  });

  it(`says why the tunnel host cannot be named yet`, () => {
    const rung = buildStartFollowUps({ ...base, tunnel: true }).find(
      (followup) => followup.id === 'real-device-tunnel'
    )!;

    expect(rung.why).toContain('only known once it is up');
  });

  it(`still names the LAN URL for a run with no tunnel`, () => {
    expect(buildStartFollowUps(base).map((followup) => followup.command)).toContain(lanUrl);
  });

  it(`drops the deep-link rung on a machine with no device`, () => {
    const followups = buildStartFollowUps({ ...base, localDevice: 'absent' });

    expect(ids(followups)).not.toContain('open-app');
    // The URL a device elsewhere can use takes its place, first.
    expect(followups[0]!.command).toBe(lanUrl);
    expect(followups[0]!.why).toContain('no booted simulator and no attached device');
  });

  // The rule that keeps a working machine working: a probe that could not run establishes nothing.
  // @ref llp/0005-runtime-loop-tools.rfc.md §Cloud simulator — the rung is not
  // dropped on a machine with no device, it is aimed at the device this project does have.
  it(`aims the deep-link rung at the cloud session when this machine has no device`, () => {
    const followups = buildStartFollowUps({
      ...base,
      localDevice: 'absent',
      cloudSession: true,
    });
    const open = followups.find((followup) => followup.id === 'open-app-cloud');

    expect(ids(followups)).not.toContain('open-app');
    expect(open?.command).toBe('npx @expo/agent-cli navigate / --cloud');
    expect(open?.why).toContain('bills until');
  });

  it(`drops the rung entirely when there is no device anywhere`, () => {
    expect(
      ids(buildStartFollowUps({ ...base, localDevice: 'absent', cloudSession: false }))
    ).not.toContain('open-app-cloud');
  });

  it.each(['unknown', 'present'] as const)(`keeps the deep-link rung for %s`, (localDevice) => {
    expect(ids(buildStartFollowUps({ ...base, localDevice }))).toContain('open-app');
  });

  it(`leads a tunnelled run with no device with the URL command`, () => {
    const followups = buildStartFollowUps({ ...base, tunnel: true, localDevice: 'absent' });

    expect(followups[0]!.command).toBe('npx @expo/agent-cli navigate / --print-url');
    expect(followups[0]!.why).toContain('no booted simulator and no attached device');
  });
});
