import type { ProjectState, StartPlan } from '../../project/types';
import {
  buildStartFollowUps,
  buildStartPlanFollowUps,
  resolveDevServerPort,
  DEFAULT_DEV_SERVER_PORT,
} from '../start';

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
      },
    ],
    ...overrides,
  };
}

describe(buildStartFollowUps, () => {
  it(`should offer the LAN URL, the runtime loop, and a production build`, () => {
    const followups = buildStartFollowUps({ expoGo: true, web: false, lanUrl, easJson: true });

    expect(ids(followups)).toEqual(['real-device', 'runtime-errors', 'eas-build']);
    expect(followups[0]!.command).toBe(lanUrl);
    expect(followups[2]!.command).toBe('npx eas build --profile production');
  });

  it(`should ask for the EAS configuration when the project has no eas.json`, () => {
    const followups = buildStartFollowUps({ expoGo: true, web: false, lanUrl, easJson: false });

    expect(ids(followups)).toContain('eas-build-configure');
    expect(ids(followups)).not.toContain('eas-build');
    expect(followups.at(-1)!.command).toBe('npx eas build:configure');
  });

  it(`should fall back to a tunnel when the host has no LAN address`, () => {
    const followups = buildStartFollowUps({
      expoGo: true,
      web: false,
      lanUrl: null,
      easJson: true,
    });

    expect(ids(followups)).toEqual(['real-device-tunnel', 'runtime-errors', 'eas-build']);
    expect(followups[0]!.command).toBe('npx exagent start --tunnel');
    expect(followups[0]!.why).toContain('no LAN address');
  });

  it(`should offer a tunnel for a development build, which needs no exp:// URL`, () => {
    const followups = buildStartFollowUps({ expoGo: false, web: false, lanUrl, easJson: true });

    expect(ids(followups)).toEqual(['real-device-tunnel', 'runtime-errors', 'eas-build']);
    expect(followups[0]!.why).toContain('development build');
  });

  it(`should leave out the device hint when the run only serves the web bundle`, () => {
    const followups = buildStartFollowUps({ expoGo: true, web: true, lanUrl, easJson: true });

    expect(ids(followups)).toEqual(['runtime-errors', 'eas-build']);
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

    expect(ids(followups)).toEqual(['start-smart']);
    expect(followups[0]!.command).toBe('npx exagent start --smart');
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

    expect(ids(followups)).toEqual(['start-smart', 'build-freshness', 'project-context']);
    expect(followups.at(-1)!.command).toBe('npx exagent context');
  });

  it(`should never offer more than three follow-ups`, () => {
    const followups = buildStartPlanFollowUps(
      mockPlan({ rule: 'needs-dev-client' }),
      mockState({ expoGo: { compatible: false, reasons: [] } })
    );

    expect(followups).toHaveLength(3);
  });
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
