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

    expect(JSON.parse(output())).toEqual(state);
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
});
