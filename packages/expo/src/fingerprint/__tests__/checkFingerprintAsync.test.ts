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

  // Only the server can tell that the generated native directories are stale and prebuild must
  // run before the rebuild, so its advice wins — but only when it is well-formed.
  itNative.each([
    {
      name: `prefers the server's mismatch commands over the default`,
      mismatch: {
        recommendation: 'The app config changed after the native directories were generated.',
        commands: [`npx expo prebuild -p ${Platform.OS}`, `npx expo run:${Platform.OS}`],
      },
      commands: [`npx expo prebuild -p ${Platform.OS}`, `npx expo run:${Platform.OS}`],
    },
    {
      name: 'falls back to the default command when the mismatch advice is malformed',
      mismatch: { recommendation: 'stale', commands: ['ok', 42] },
      commands: [`npx expo run:${Platform.OS}`],
    },
  ])(`$name`, async ({ mismatch, commands }) => {
    mockServerResponse({
      platform: Platform.OS,
      hash: 'server-hash',
      fingerprintVersion: null,
      mismatch,
    });
    await expect(checkFingerprintAsync()).resolves.toMatchObject({
      status: 'rebuild-required',
      commands,
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

  itNative.each([
    { name: 'in Expo Go', environment: { expoGo: true }, reason: 'expo-go' },
    { name: 'without a dev server', environment: { origin: null }, reason: 'no-dev-server' },
  ])(`is not applicable $name`, async ({ environment, reason }) => {
    mockEnvironment(environment);
    await expect(checkFingerprintAsync()).resolves.toMatchObject({
      status: 'not-applicable',
      reason,
    });
  });

  itNative(`resolves rather than rejects when the bundle origin cannot be read`, async () => {
    // `getBundleUrl` parses the script URL with `new URL(...)`, which throws on a malformed one.
    // The documented contract is that this promise never rejects.
    jest.mocked(getBundleOrigin).mockImplementation(() => {
      throw new Error('Invalid URL');
    });
    await expect(checkFingerprintAsync()).resolves.toMatchObject({
      status: 'not-applicable',
      reason: 'no-dev-server',
    });
  });

  // Every failure the check knows about resolves to `unknown`; it never rejects. The last row
  // arranges a throwing fetch rather than a response, so rows carry a thunk instead of data.
  itNative.each([
    {
      name: 'maps a 503 to fingerprint-unavailable',
      arrange: () =>
        mockServerResponse({ code: 'FINGERPRINT_UNAVAILABLE' }, { ok: false, status: 503 }),
      reason: 'fingerprint-unavailable',
    },
    {
      name: 'maps other server errors to check-failed',
      arrange: () => mockServerResponse({}, { ok: false, status: 404 }),
      reason: 'check-failed',
    },
    {
      name: 'maps network failures to check-failed',
      arrange: () => {
        globalThis.fetch = jest.fn(async () => {
          throw new Error('network down');
        }) as any;
      },
      reason: 'check-failed',
    },
  ])(`$name`, async ({ arrange, reason }) => {
    arrange();
    await expect(checkFingerprintAsync()).resolves.toMatchObject({ status: 'unknown', reason });
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
