import ExpoUpdates from '../ExpoUpdates';
import * as Updates from '../Updates';

const fakeManifest = {
  id: '@jester/test-app',
  sdkVersion: '36.0.0',
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
