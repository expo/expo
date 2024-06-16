import ExpoUpdates from '../ExpoUpdates';
import * as Updates from '../Updates';
import {
  Manifest,
  UpdateCheckResultAvailable,
  UpdatesLogEntryCode,
  UpdatesLogEntryLevel,
} from '../Updates.types';

const fakeManifest = {
  id: '@jester/test-app',
  sdkVersion: '36.0.0',
} as any as Manifest;

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
  jest.mocked(ExpoUpdates.checkForUpdateAsync).mockResolvedValueOnce({
    isAvailable: true,
    manifest: fakeManifest,
    isRollBackToEmbedded: false,
    reason: undefined,
  } as UpdateCheckResultAvailable & { manifestString?: string });

  const actual = await Updates.checkForUpdateAsync();
  const expected = { isAvailable: true, manifest: fakeManifest, isRollBackToEmbedded: false };
  expect(actual).toEqual(expected);
});

it('returns the proper object in checkForUpdateAsync if an update is available and manifestString is returned', async () => {
  jest.mocked(ExpoUpdates.checkForUpdateAsync).mockResolvedValueOnce({
    isAvailable: true,
    manifest: undefined,
    manifestString: JSON.stringify(fakeManifest),
    isRollBackToEmbedded: false,
    reason: undefined,
  });

  const actual = await Updates.checkForUpdateAsync();
  const expected = { isAvailable: true, manifest: fakeManifest, isRollBackToEmbedded: false };
  expect(actual).toEqual(expected);
});

it('returns the proper object in fetchUpdateAsync if an update is available and manifest is returned', async () => {
  jest
    .mocked(ExpoUpdates.fetchUpdateAsync)
    .mockResolvedValueOnce({ isNew: true, manifest: fakeManifest, isRollBackToEmbedded: false });

  const actual = await Updates.fetchUpdateAsync();
  const expected = { isNew: true, manifest: fakeManifest, isRollBackToEmbedded: false };
  expect(actual).toEqual(expected);
});

it('returns the proper object in fetchUpdateAsync if an update is available and manifestString is returned', async () => {
  jest.mocked(ExpoUpdates.fetchUpdateAsync).mockResolvedValueOnce({
    isNew: true,
    manifestString: JSON.stringify(fakeManifest),
    isRollBackToEmbedded: false,
  });

  const actual = await Updates.fetchUpdateAsync();
  const expected = { isNew: true, manifest: fakeManifest, isRollBackToEmbedded: false };
  expect(actual).toEqual(expected);
});

it('returns the proper object when no logs from readLogEntriesAsync', async () => {
  jest.mocked(ExpoUpdates.readLogEntriesAsync).mockResolvedValueOnce([]);

  const actual = await Updates.readLogEntriesAsync();
  const expected = [];
  expect(actual).toEqual(expected);
});

it('returns the proper object when logs returned from readLogEntriesAsync', async () => {
  jest.mocked(ExpoUpdates.readLogEntriesAsync).mockResolvedValueOnce([
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
