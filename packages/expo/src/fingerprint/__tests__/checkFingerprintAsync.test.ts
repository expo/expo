import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { isRunningInExpoGo } from '../../environment/ExpoGo';
import { getBundleOrigin } from '../../utils/getBundleOrigin';
import { checkFingerprintAsync } from '../checkFingerprintAsync';

jest.mock('expo-constants', () => ({ __esModule: true, default: { fingerprint: null } }));
jest.mock('../../environment/ExpoGo', () => ({ isRunningInExpoGo: jest.fn(() => false) }));
jest.mock('../../utils/getBundleOrigin', () => ({ getBundleOrigin: jest.fn() }));

const originalFetch = globalThis.fetch;

function mockEnvironment({
  embedded = 'embedded-hash',
  origin = 'http://127.0.0.1:8081',
  expoGo = false,
}: {
  embedded?: string | null;
  origin?: string | null;
  expoGo?: boolean;
} = {}) {
  (Constants as any).fingerprint = embedded;
  jest.mocked(isRunningInExpoGo).mockReturnValue(expoGo);
  jest.mocked(getBundleOrigin).mockReturnValue(origin);
}

function mockServerResponse(body: object, { ok = true, status = 200 } = {}) {
  const fetchMock = jest.fn(async () => ({
    ok,
    status,
    json: async () => body,
  }));
  globalThis.fetch = fetchMock as any;
  return fetchMock;
}

beforeEach(() => {
  mockEnvironment();
  mockServerResponse({ platform: Platform.OS, hash: 'server-hash', fingerprintVersion: '1.0.0' });
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// The jest-expo preset runs this file for every platform; these branch tests only apply to
// the native targets, and the web project exercises the `unsupported-platform` branch below.
const itNative = Platform.OS === 'ios' || Platform.OS === 'android' ? it : it.skip;

describe(checkFingerprintAsync, () => {
  itNative(`reports up-to-date when the hashes match, announcing the embedded hash`, async () => {
    const fetchMock = mockServerResponse({
      platform: Platform.OS,
      hash: 'embedded-hash',
      fingerprintVersion: null,
    });
    await expect(checkFingerprintAsync()).resolves.toEqual({
      status: 'up-to-date',
      reason: 'hash-match',
      embeddedHash: 'embedded-hash',
      serverHash: 'embedded-hash',
      commands: [],
    });
    // The check request doubles as the announce: the embedded hash rides along as a header.
    expect(fetchMock).toHaveBeenCalledWith(
      `http://127.0.0.1:8081/_expo/fingerprint?platform=${Platform.OS}`,
      { headers: { 'expo-fingerprint': 'embedded-hash' } }
    );
  });

  itNative(`reports rebuild-required with commands when the hashes differ`, async () => {
    await expect(checkFingerprintAsync()).resolves.toEqual({
      status: 'rebuild-required',
      reason: 'hash-mismatch',
      embeddedHash: 'embedded-hash',
      serverHash: 'server-hash',
      commands: [`npx expo run:${Platform.OS}`],
    });
  });

  itNative(`prefers the server's mismatch commands over the default`, async () => {
    // The server knows when the generated native directories are stale and prebuild must run
    // before the rebuild — the client alone cannot tell.
    mockServerResponse({
      platform: Platform.OS,
      hash: 'server-hash',
      fingerprintVersion: null,
      mismatch: {
        recommendation: 'The app config changed after the native directories were generated.',
        commands: [`npx expo prebuild -p ${Platform.OS}`, `npx expo run:${Platform.OS}`],
      },
    });
    await expect(checkFingerprintAsync()).resolves.toMatchObject({
      status: 'rebuild-required',
      commands: [`npx expo prebuild -p ${Platform.OS}`, `npx expo run:${Platform.OS}`],
    });
  });

  itNative(`falls back to the default command when the mismatch advice is malformed`, async () => {
    mockServerResponse({
      platform: Platform.OS,
      hash: 'server-hash',
      fingerprintVersion: null,
      mismatch: { recommendation: 'stale', commands: ['ok', 42] },
    });
    await expect(checkFingerprintAsync()).resolves.toMatchObject({
      status: 'rebuild-required',
      commands: [`npx expo run:${Platform.OS}`],
    });
  });

  itNative(`omits the announce header without an embedded hash`, async () => {
    mockEnvironment({ embedded: null });
    const fetchMock = mockServerResponse({ hash: 'server-hash', fingerprintVersion: null });
    const result = await checkFingerprintAsync();
    expect(fetchMock).toHaveBeenCalledWith(
      `http://127.0.0.1:8081/_expo/fingerprint?platform=${Platform.OS}`,
      { headers: {} }
    );
    expect(result).toMatchObject({
      status: 'unknown',
      reason: 'no-embedded-fingerprint',
      embeddedHash: null,
      serverHash: 'server-hash',
    });
  });

  itNative(`is not applicable in Expo Go`, async () => {
    mockEnvironment({ expoGo: true });
    await expect(checkFingerprintAsync()).resolves.toMatchObject({
      status: 'not-applicable',
      reason: 'expo-go',
    });
  });

  itNative(`is not applicable without a dev server`, async () => {
    mockEnvironment({ origin: null });
    await expect(checkFingerprintAsync()).resolves.toMatchObject({
      status: 'not-applicable',
      reason: 'no-dev-server',
    });
  });

  itNative(`maps a 503 to fingerprint-unavailable`, async () => {
    mockServerResponse({ code: 'FINGERPRINT_UNAVAILABLE' }, { ok: false, status: 503 });
    await expect(checkFingerprintAsync()).resolves.toMatchObject({
      status: 'unknown',
      reason: 'fingerprint-unavailable',
    });
  });

  itNative(`maps other server errors to check-failed`, async () => {
    mockServerResponse({}, { ok: false, status: 404 });
    await expect(checkFingerprintAsync()).resolves.toMatchObject({
      status: 'unknown',
      reason: 'check-failed',
    });
  });

  itNative(`maps network failures to check-failed`, async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new Error('network down');
    }) as any;
    await expect(checkFingerprintAsync()).resolves.toMatchObject({
      status: 'unknown',
      reason: 'check-failed',
    });
  });

  if (Platform.OS === 'web') {
    it(`is not applicable on web`, async () => {
      await expect(checkFingerprintAsync()).resolves.toMatchObject({
        status: 'not-applicable',
        reason: 'unsupported-platform',
      });
    });
  }
});
