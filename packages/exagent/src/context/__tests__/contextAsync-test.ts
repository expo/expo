import * as Log from '../../log';
import { probeProjectStateAsync } from '../../project/probe';
import type { ProjectState } from '../../project/types';
import { printProjectContextAsync } from '../contextAsync';

jest.mock('../../log');
jest.mock('../../project/probe', () => ({ probeProjectStateAsync: jest.fn() }));

const projectRoot = '/project';

function mockState(overrides: Partial<ProjectState> = {}): ProjectState {
  const state: ProjectState = {
    projectRoot,
    sdkVersion: '54.0.0',
    nativeDirs: { ios: false, android: false },
    usesDevClient: false,
    hasWeb: false,
    expoGo: { compatible: true, reasons: [] },
    fingerprint: { hash: 'abc123' },
    ...overrides,
  };
  jest.mocked(probeProjectStateAsync).mockResolvedValue(state);
  return state;
}

/** Everything the command printed, joined into one string. */
function output(): string {
  return jest.mocked(Log.log).mock.calls.flat().join('\n');
}

describe(printProjectContextAsync, () => {
  it(`should print the probed state as JSON with --json`, async () => {
    const state = mockState();

    await printProjectContextAsync(projectRoot, { json: true });

    expect(Log.log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(output())).toEqual({ ...state, followups: expect.any(Array) });
  });

  // Shape test: the top-level keys of `--json` are the command's contract, so they are asserted
  // as an exact set. Adding, renaming, or dropping one is a breaking change for every caller.
  it(`should print a stable set of top-level keys with --json`, async () => {
    mockState();

    await printProjectContextAsync(projectRoot, { json: true });

    expect(Object.keys(JSON.parse(output())).sort()).toEqual([
      'expoGo',
      'fingerprint',
      'followups',
      'hasWeb',
      'nativeDirs',
      'projectRoot',
      'sdkVersion',
      'usesDevClient',
    ]);
  });

  it(`should print a human readable summary of a managed project`, async () => {
    mockState();

    await printProjectContextAsync(projectRoot, {});

    const text = output();
    expect(text).toContain(projectRoot);
    expect(text).toContain('54.0.0');
    expect(text).toContain('abc123');
    // A project without `ios/` or `android/` is managed by Continuous Native Generation.
    expect(text).toContain('managed');
  });

  it(`should print the Expo Go incompatibility reasons`, async () => {
    mockState({
      expoGo: {
        compatible: false,
        reasons: [
          {
            kind: 'unbundled-native-module',
            packageName: 'react-native-fancy',
            detail: 'contains native code and is not bundled in Expo Go',
          },
        ],
      },
    });

    await printProjectContextAsync(projectRoot, {});

    const text = output();
    expect(text).toContain('react-native-fancy');
    expect(text).toContain('unbundled-native-module');
  });

  it(`should print the bare native directories`, async () => {
    mockState({ nativeDirs: { ios: true, android: true } });

    await printProjectContextAsync(projectRoot, {});

    expect(output()).toContain('bare');
  });

  it(`should print the fingerprint error when the hash is unavailable`, async () => {
    mockState({ fingerprint: { hash: null, error: 'fingerprint CLI not found' } });

    await printProjectContextAsync(projectRoot, {});

    expect(output()).toContain('fingerprint CLI not found');
  });

  it(`should print an unknown SDK version`, async () => {
    mockState({ sdkVersion: null });

    await printProjectContextAsync(projectRoot, {});

    expect(output()).toContain('unknown');
  });

  // @ref llp/0009-smart-followups.rfc.md §Design
  describe('follow-ups', () => {
    it(`should point at status and the start plan`, async () => {
      mockState();

      await printProjectContextAsync(projectRoot, {});

      expect(output()).toContain('Next:');
      expect(output()).toContain('npx exagent status');
      expect(output()).toContain('npx exagent start --plan');
    });

    it(`should offer the dev client install when Expo Go is out`, async () => {
      mockState({
        expoGo: { compatible: false, reasons: [{ kind: 'config-plugin', detail: 'a plugin' }] },
      });

      await printProjectContextAsync(projectRoot, {});

      expect(output()).toContain('npx exagent install expo-dev-client');
    });

    it(`should embed the follow-ups in the JSON brief and print nothing extra`, async () => {
      mockState();

      await printProjectContextAsync(projectRoot, { json: true });

      expect(Log.log).toHaveBeenCalledTimes(1);
      expect(JSON.parse(output()).followups.map((item: { id: string }) => item.id)).toEqual([
        'status',
        'start-plan',
      ]);
    });

    it(`should print nothing and embed an empty list with --no-followups`, async () => {
      mockState();

      await printProjectContextAsync(projectRoot, { followups: false });

      expect(output()).not.toContain('Next:');

      jest.mocked(Log.log).mockClear();
      await printProjectContextAsync(projectRoot, { json: true, followups: false });

      expect(JSON.parse(output()).followups).toEqual([]);
    });
  });
});
