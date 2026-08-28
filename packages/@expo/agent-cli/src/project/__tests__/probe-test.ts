import { vol } from 'memfs';

import { checkExpoGoCompatibilityAsync } from '../expoGo';
import { generateFingerprintAsync } from '../fingerprint';
import { probeProjectStateAsync } from '../probe';

jest.mock('../expoGo', () => ({ checkExpoGoCompatibilityAsync: jest.fn() }));
jest.mock('../fingerprint', () => ({ generateFingerprintAsync: jest.fn() }));

const projectRoot = '/project';

const compatible = { compatible: true, reasons: [] };

beforeEach(() => {
  jest.mocked(checkExpoGoCompatibilityAsync).mockResolvedValue(compatible);
  jest.mocked(generateFingerprintAsync).mockResolvedValue({ hash: 'abc123', sources: null });
});

afterEach(() => {
  vol.reset();
});

function writeProject(dependencies: Record<string, string>, files: Record<string, string> = {}) {
  vol.fromJSON({
    [`${projectRoot}/package.json`]: JSON.stringify({ name: 'app', dependencies }),
    ...files,
  });
}

describe(probeProjectStateAsync, () => {
  it(`should report the state of a managed Expo Go project`, async () => {
    writeProject(
      { expo: '54.0.0' },
      { [`${projectRoot}/node_modules/expo/package.json`]: '{"name":"expo","version":"54.0.0"}' }
    );

    await expect(probeProjectStateAsync(projectRoot)).resolves.toEqual({
      projectRoot,
      isExpoApp: true,
      sdkVersion: '54.0.0',
      nativeDirs: { ios: false, android: false },
      usesDevClient: false,
      hasWeb: false,
      expoGo: compatible,
      fingerprint: { hash: 'abc123', sources: null },
    });
  });

  it(`should report a null sdkVersion when expo is not installed`, async () => {
    writeProject({ expo: '54.0.0' });

    await expect(probeProjectStateAsync(projectRoot)).resolves.toMatchObject({
      sdkVersion: null,
    });
  });

  it(`should report the checked-in native directories`, async () => {
    writeProject({ expo: '54.0.0' }, { [`${projectRoot}/ios/Podfile`]: '' });

    await expect(probeProjectStateAsync(projectRoot)).resolves.toMatchObject({
      nativeDirs: { ios: true, android: false },
    });
  });

  it(`should report a dev client project`, async () => {
    writeProject(
      { expo: '54.0.0', 'expo-dev-client': '~54.0.0' },
      { [`${projectRoot}/node_modules/expo-dev-client/package.json`]: '{}' }
    );

    await expect(probeProjectStateAsync(projectRoot)).resolves.toMatchObject({
      usesDevClient: true,
    });
  });

  it(`should not report a dev client that is declared but not installed`, async () => {
    writeProject({ expo: '54.0.0', 'expo-dev-client': '~54.0.0' });

    await expect(probeProjectStateAsync(projectRoot)).resolves.toMatchObject({
      usesDevClient: false,
    });
  });

  it(`should not report a dev client that is installed but not declared`, async () => {
    writeProject(
      { expo: '54.0.0' },
      { [`${projectRoot}/node_modules/expo-dev-client/package.json`]: '{}' }
    );

    await expect(probeProjectStateAsync(projectRoot)).resolves.toMatchObject({
      usesDevClient: false,
    });
  });

  it(`should report web support from react-native-web`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({
        name: 'app',
        dependencies: { expo: '54.0.0' },
        devDependencies: { 'react-native-web': '~0.21.0' },
      }),
      [`${projectRoot}/node_modules/react-native-web/package.json`]: '{}',
    });

    await expect(probeProjectStateAsync(projectRoot)).resolves.toMatchObject({ hasWeb: true });
  });

  it(`should pass the Expo Go compatibility result through`, async () => {
    const incompatible = {
      compatible: false,
      reasons: [{ kind: 'custom-native-code' as const, detail: 'ios/ exists' }],
    };
    jest.mocked(checkExpoGoCompatibilityAsync).mockResolvedValue(incompatible);
    writeProject({ expo: '54.0.0' });

    await expect(probeProjectStateAsync(projectRoot)).resolves.toMatchObject({
      expoGo: incompatible,
    });
  });

  it(`should report a fingerprint error instead of throwing`, async () => {
    jest
      .mocked(generateFingerprintAsync)
      .mockResolvedValue({ hash: null, sources: null, error: 'fingerprint CLI not found' });
    writeProject({ expo: '54.0.0' });

    await expect(probeProjectStateAsync(projectRoot)).resolves.toMatchObject({
      fingerprint: { hash: null, error: 'fingerprint CLI not found' },
    });
  });

  it(`should probe a project without a package.json`, async () => {
    vol.fromJSON({ [`${projectRoot}/index.js`]: '' });

    await expect(probeProjectStateAsync(projectRoot)).resolves.toMatchObject({
      sdkVersion: null,
      usesDevClient: false,
      hasWeb: false,
    });
  });
});
