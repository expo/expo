import ExpoUpdates from '../ExpoUpdates';
import * as Updates from '../Updates';
import { Manifest, UpdatesLogEntryCode, UpdatesLogEntryLevel } from '../Updates.types';

const fakeManifest = {
  id: '@jester/test-app',
  sdkVersion: '36.0.0',
};

const mockDate = new Date();
const mockManifest: Manifest = {
  id: '0000-2222',
  createdAt: mockDate.toISOString(),
  runtimeVersion: '1.0.0',
  launchAsset: {
    url: 'testUrl',
  },
  assets: [],
  metadata: {},
};

let old__DEV__;
beforeAll(() => {
  old__DEV__ = __DEV__;
  //@ts-expect-error: __DEV__ is usually not assignable but we need to set it to false for this test
  __DEV__ = false;
});

afterAll(() => {
  //@ts-expect-error: __DEV__ is usually not assignable but we need to set it to false for this test
  __DEV__ = old__DEV__;
});

it('returns the proper object in checkForUpdateAsync if an update is available and manifest is returned', async () => {
  ExpoUpdates.checkForUpdateAsync.mockReturnValueOnce({
    isAvailable: true,
    manifest: fakeManifest,
  });

  const actual = await Updates.checkForUpdateAsync();
  const expected = { isAvailable: true, manifest: fakeManifest };
  expect(actual).toEqual(expected);
});

it('returns the proper object in checkForUpdateAsync if an update is available and manifestString is returned', async () => {
  ExpoUpdates.checkForUpdateAsync.mockReturnValueOnce({
    isAvailable: true,
    manifestString: JSON.stringify(fakeManifest),
  });

  const actual = await Updates.checkForUpdateAsync();
  const expected = { isAvailable: true, manifest: fakeManifest };
  expect(actual).toEqual(expected);
});

it('returns the proper object in fetchUpdateAsync if an update is available and manifest is returned', async () => {
  ExpoUpdates.fetchUpdateAsync.mockReturnValueOnce({ isNew: true, manifest: fakeManifest });

  const actual = await Updates.fetchUpdateAsync();
  const expected = { isNew: true, manifest: fakeManifest };
  expect(actual).toEqual(expected);
});

it('returns the proper object in fetchUpdateAsync if an update is available and manifestString is returned', async () => {
  ExpoUpdates.fetchUpdateAsync.mockReturnValueOnce({
    isNew: true,
    manifestString: JSON.stringify(fakeManifest),
  });

  const actual = await Updates.fetchUpdateAsync();
  const expected = { isNew: true, manifest: fakeManifest };
  expect(actual).toEqual(expected);
});

it('returns the proper object when no logs from readLogEntriesAsync', async () => {
  ExpoUpdates.readLogEntriesAsync.mockReturnValueOnce([]);

  const actual = await Updates.readLogEntriesAsync();
  const expected = [];
  expect(actual).toEqual(expected);
});

it('returns the proper object when logs returned from readLogEntriesAsync', async () => {
  ExpoUpdates.readLogEntriesAsync.mockReturnValueOnce([
    {
      timestamp: 100,
      message: 'Message 1',
      code: UpdatesLogEntryCode.NONE,
      level: UpdatesLogEntryLevel.INFO,
    },
    {
      timestamp: 200,
      message: 'Message 2',
      code: UpdatesLogEntryCode.JS_RUNTIME_ERROR,
      level: UpdatesLogEntryLevel.ERROR,
      updateId: '0xxx',
      assetId: '1xxx',
      stacktrace: ['Frame 1', 'Frame 2', 'Frame 3'],
    },
  ]);

  const actual = await Updates.readLogEntriesAsync();
  expect(actual.length).toEqual(2);
  expect(actual[0].timestamp).toEqual(100);
  expect(actual[0].level).toEqual('info');
  expect(actual[0].updateId).toBeUndefined();
  expect(actual[1].code).toEqual('JSRuntimeError');
  expect(actual[1].stacktrace?.length).toEqual(3);
});

it('extraPropertiesFromManifest() when properties exist', () => {
  const manifestWithExtra: Partial<Manifest> = {
    ...mockManifest,
    extra: {
      expoClient: {
        extra: {
          eas: {
            projectId: '0000-xxxx',
          },
          stringProp: 'message',
          booleanProp: true,
          nullProp: null,
          numberProp: 1000,
        },
      },
    },
  };
  const result = Updates.extraPropertiesFromManifest(manifestWithExtra);
  // Only the properties added to 'extra' should be present
  expect(Object.keys(result)).toHaveLength(4);
  expect(result['stringProp']).toEqual('message');
  expect(result['booleanProp']).toBe(true);
  expect(result['nullProp']).toBeNull();
  expect(result['numberProp']).toEqual(1000);
  // 'eas' property should be excluded
  expect(result['eas']).toBeUndefined();
});

it('extraPropertiesFromManifest() with no extras in manifest', () => {
  const result = Updates.extraPropertiesFromManifest(mockManifest);
  expect(Object.keys(result)).toHaveLength(0);
});
