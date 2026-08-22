import { vol } from 'memfs';
import os from 'os';

import type { FollowUp } from '../../followups';
import { Log } from '../../log';
import { emitStartPlan } from '../../plan/emit';
import { readLastBuildFingerprints, recordLastBuildFingerprint } from '../../plan/lastBuild';
import { probeProjectStateAsync } from '../../project/probe';
import type { ProjectState } from '../../project/types';
import { runExpoAsync } from '../../utils/expoCli';
import { resolveStartOptions } from '../resolveOptions';
import { smartStartAsync } from '../smartStartAsync';
import { runDevServerAsync } from '../startAsync';

jest.mock('../../log');
jest.mock('../../plan/emit', () => ({ emitStartPlan: jest.fn() }));
jest.mock('../../plan/events', () => ({ event: jest.fn(), debugEvent: jest.fn() }));
jest.mock('../../plan/lastBuild', () => ({
  readLastBuildFingerprints: jest.fn(() => ({})),
  recordLastBuildFingerprint: jest.fn(),
}));
jest.mock('../../project/probe', () => ({ probeProjectStateAsync: jest.fn() }));
jest.mock('../../utils/expoCli', () => ({ runExpoAsync: jest.fn() }));
jest.mock('../startAsync', () => ({ runDevServerAsync: jest.fn() }));

const projectRoot = '/project';
const fingerprintHash = 'abc123def4567890';
const realPlatform = process.platform;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value });
}

function mockProjectState(overrides: Partial<ProjectState> = {}): ProjectState {
  const state: ProjectState = {
    projectRoot,
    sdkVersion: '54.0.0',
    nativeDirs: { ios: false, android: false },
    usesDevClient: false,
    hasWeb: true,
    expoGo: { compatible: true, reasons: [] },
    fingerprint: { hash: fingerprintHash },
    ...overrides,
  };
  jest.mocked(probeProjectStateAsync).mockResolvedValue(state);
  return state;
}

/** The state of a managed project that needs a new development build. */
function mockStaleDevClientState(overrides: Partial<ProjectState> = {}): ProjectState {
  return mockProjectState({
    usesDevClient: true,
    expoGo: {
      compatible: false,
      reasons: [{ kind: 'config-plugin', detail: 'the app config uses a config plugin' }],
    },
    ...overrides,
  });
}

/** The follow-ups the run handed to the plan emitter, which are the ones it reported. */
function emittedFollowUps(): FollowUp[] {
  const call = jest.mocked(emitStartPlan).mock.calls.at(-1);
  return call?.[1].followups ?? [];
}

function emittedFollowUpIds(): string[] {
  return emittedFollowUps().map((followup) => followup.id);
}

/** Pin this host's LAN address, so the real-device follow-up does not depend on the machine. */
function mockLanAddress(address: string | null) {
  jest
    .spyOn(os, 'networkInterfaces')
    .mockReturnValue(
      address
        ? ({ en0: [{ address, family: 'IPv4', internal: false }] } as any)
        : ({ lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }] } as any)
    );
}

beforeEach(() => {
  vol.reset();
  jest.mocked(readLastBuildFingerprints).mockReturnValue({});
  jest.mocked(runExpoAsync).mockResolvedValue(0);
  jest.mocked(runDevServerAsync).mockResolvedValue(0);
  mockLanAddress('192.168.1.5');
});

afterEach(() => {
  mockPlatform(realPlatform);
  jest.restoreAllMocks();
});

describe(smartStartAsync, () => {
  describe('--plan', () => {
    it(`should emit the plan and run nothing`, async () => {
      mockStaleDevClientState();

      await expect(
        smartStartAsync(projectRoot, resolveStartOptions(['--plan', '--ios']))
      ).resolves.toBe(0);

      expect(emitStartPlan).toHaveBeenCalledWith(
        expect.objectContaining({ rule: 'dev-client-stale' }),
        { mode: 'plan', json: false, followups: expect.any(Array) }
      );
      expect(runExpoAsync).not.toHaveBeenCalled();
      expect(runDevServerAsync).not.toHaveBeenCalled();
    });

    it(`should decide from the probed project state`, async () => {
      mockProjectState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--plan']));

      expect(probeProjectStateAsync).toHaveBeenCalledWith(projectRoot);
      expect(emitStartPlan).toHaveBeenCalledWith(expect.objectContaining({ rule: 'expo-go' }), {
        mode: 'plan',
        json: false,
        followups: expect.any(Array),
      });
    });
  });

  describe('--smart', () => {
    it(`should emit the plan before running any step`, async () => {
      mockProjectState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart']));

      expect(emitStartPlan).toHaveBeenCalledWith(expect.objectContaining({ rule: 'expo-go' }), {
        mode: 'smart',
        json: false,
        followups: expect.any(Array),
      });
    });

    it(`should run a single dev server step through the start wrapper`, async () => {
      mockProjectState();

      await expect(
        smartStartAsync(projectRoot, resolveStartOptions(['--smart', '--port', '8082']))
      ).resolves.toBe(0);

      expect(runDevServerAsync).toHaveBeenCalledWith(
        projectRoot,
        ['start', '--go', '--port', '8082'],
        { agentSkills: true }
      );
      expect(runExpoAsync).not.toHaveBeenCalled();
    });

    it(`should keep the skill sync opt-out`, async () => {
      mockProjectState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart', '--no-agent-skills']));

      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['start', '--go'], {
        agentSkills: false,
      });
    });

    it(`should not repeat a platform flag the plan already passes`, async () => {
      mockProjectState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart', '--web']));

      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['start', '--web'], {
        agentSkills: true,
      });
    });

    it(`should run every step in order, ending with the dev server`, async () => {
      mockStaleDevClientState();

      await expect(
        smartStartAsync(projectRoot, resolveStartOptions(['--smart', '--ios']))
      ).resolves.toBe(0);

      expect(runExpoAsync).toHaveBeenCalledTimes(1);
      expect(runExpoAsync).toHaveBeenCalledWith(projectRoot, ['prebuild', '--platform', 'ios']);
      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['run:ios'], {
        agentSkills: true,
      });
    });

    it(`should stop at the first failing step and forward its exit code`, async () => {
      mockStaleDevClientState();
      jest.mocked(runExpoAsync).mockResolvedValue(2);

      await expect(
        smartStartAsync(projectRoot, resolveStartOptions(['--smart', '--ios']))
      ).resolves.toBe(2);

      expect(runDevServerAsync).not.toHaveBeenCalled();
      expect(recordLastBuildFingerprint).not.toHaveBeenCalled();
    });

    it(`should record the fingerprint of a build that succeeded`, async () => {
      mockStaleDevClientState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart', '--android']));

      expect(recordLastBuildFingerprint).toHaveBeenCalledWith(
        projectRoot,
        'android',
        fingerprintHash
      );
    });

    it(`should not record a fingerprint of a build that failed`, async () => {
      mockStaleDevClientState();
      jest.mocked(runDevServerAsync).mockResolvedValue(1);

      await expect(
        smartStartAsync(projectRoot, resolveStartOptions(['--smart', '--ios']))
      ).resolves.toBe(1);

      expect(recordLastBuildFingerprint).not.toHaveBeenCalled();
    });

    it(`should not record anything when the fingerprint is unavailable`, async () => {
      mockStaleDevClientState({ fingerprint: { hash: null, error: 'fingerprint failed' } });

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart', '--ios']));

      expect(recordLastBuildFingerprint).not.toHaveBeenCalled();
    });

    it(`should reuse a development build recorded for the current fingerprint`, async () => {
      mockStaleDevClientState();
      jest.mocked(readLastBuildFingerprints).mockReturnValue({ ios: fingerprintHash });

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart', '--ios']));

      expect(emitStartPlan).toHaveBeenCalledWith(
        expect.objectContaining({ rule: 'dev-client-fresh' }),
        { mode: 'smart', json: false, followups: expect.any(Array) }
      );
      expect(runExpoAsync).not.toHaveBeenCalled();
      // `--ios` is an `expo start` option, so it reaches the dev server it asked for.
      expect(runDevServerAsync).toHaveBeenCalledWith(
        projectRoot,
        ['start', '--dev-client', '--ios'],
        { agentSkills: true }
      );
    });

    it(`should warn that expo start options do not reach a build step`, async () => {
      mockStaleDevClientState();

      await smartStartAsync(
        projectRoot,
        resolveStartOptions(['--smart', '--ios', '--port', '8082'])
      );

      expect(Log.warn).toHaveBeenCalledWith(expect.stringMatching(/--port 8082/));
      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['run:ios'], {
        agentSkills: true,
      });
    });

    it(`should not warn about the platform flag the plan already acted on`, async () => {
      mockStaleDevClientState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart', '--ios']));

      expect(Log.warn).not.toHaveBeenCalled();
    });
  });

  describe('default platform', () => {
    it(`should target iOS on macOS`, async () => {
      mockPlatform('darwin');
      mockStaleDevClientState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart']));

      expect(runExpoAsync).toHaveBeenCalledWith(projectRoot, ['prebuild', '--platform', 'ios']);
    });

    it(`should target Android on a host that cannot build for iOS`, async () => {
      mockPlatform('linux');
      mockStaleDevClientState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart']));

      expect(runExpoAsync).toHaveBeenCalledWith(projectRoot, ['prebuild', '--platform', 'android']);
    });

    it(`should target the platform of the only checked-in native directory`, async () => {
      mockPlatform('darwin');
      mockStaleDevClientState({ nativeDirs: { ios: false, android: true } });

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart']));

      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['run:android'], {
        agentSkills: true,
      });
    });
  });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command
  describe('follow-ups', () => {
    it(`should offer to run the plan --plan just printed`, async () => {
      mockProjectState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--plan']));

      expect(emittedFollowUpIds()).toEqual(['start-smart']);
      expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('npx exagent start --smart'));
    });

    it(`should explain the build a stale plan includes`, async () => {
      mockStaleDevClientState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--plan', '--ios']));

      expect(emittedFollowUpIds()).toEqual(['start-smart', 'build-freshness', 'project-context']);
    });

    it(`should offer the device, runtime and ship steps once --smart runs the plan`, async () => {
      mockProjectState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart']));

      expect(emittedFollowUpIds()).toEqual([
        'real-device',
        'runtime-errors',
        'eas-build-configure',
      ]);
      expect(emittedFollowUps()[0]!.command).toBe('exp://192.168.1.5:8081');
    });

    it(`should offer the production build when the project has an eas.json`, async () => {
      vol.fromJSON({ [`${projectRoot}/eas.json`]: '{"build":{}}' });
      mockProjectState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart']));

      expect(emittedFollowUpIds()).toContain('eas-build');
    });

    it(`should read the port the dev server was asked for`, async () => {
      mockProjectState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart', '--port', '8082']));

      expect(emittedFollowUps()[0]!.command).toBe('exp://192.168.1.5:8082');
    });

    it(`should offer a tunnel for a development build, which needs no exp:// URL`, async () => {
      jest.mocked(readLastBuildFingerprints).mockReturnValue({ ios: fingerprintHash });
      mockStaleDevClientState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart', '--ios']));

      expect(emittedFollowUpIds()).toContain('real-device-tunnel');
    });

    it(`should leave out the device hint for the web target`, async () => {
      mockProjectState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart', '--web']));

      expect(emittedFollowUpIds()).toEqual(['runtime-errors', 'eas-build-configure']);
    });

    it(`should offer nothing with --no-followups, and print no Next section`, async () => {
      mockProjectState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart', '--no-followups']));

      expect(emittedFollowUps()).toEqual([]);
      expect(Log.log).not.toHaveBeenCalled();
    });

    it(`should suppress the follow-ups of --plan too`, async () => {
      mockStaleDevClientState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--plan', '--no-followups']));

      expect(emittedFollowUps()).toEqual([]);
    });

    it(`should keep --no-followups out of the expo start arguments`, async () => {
      mockProjectState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--smart', '--no-followups']));

      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['start', '--go'], {
        agentSkills: true,
      });
    });

    it(`should never offer more than three follow-ups`, async () => {
      mockStaleDevClientState();

      await smartStartAsync(projectRoot, resolveStartOptions(['--plan', '--ios']));

      expect(emittedFollowUps().length).toBeLessThanOrEqual(3);
    });
  });
});
