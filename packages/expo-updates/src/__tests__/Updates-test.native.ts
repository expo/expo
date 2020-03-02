import ExpoUpdates from '../ExpoUpdates';
import * as Updates from '../Updates';

const fakeManifest = {
  id: '@jester/test-app',
  sdkVersion: '36.0.0',
};

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
