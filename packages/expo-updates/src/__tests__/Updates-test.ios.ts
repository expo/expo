import ExponentUpdates from '../ExponentUpdates';
import * as Updates from '../Updates';

const fakeManifest = {
  id: '@jester/test-app',
  sdkVersion: '36.0.0',
};

it('returns the proper object in checkForUpdateAsync if an update is available and manifest is returned', async () => {
  ExponentUpdates.checkForUpdateAsync.mockReturnValueOnce(fakeManifest);

  const actual = await Updates.checkForUpdateAsync();
  const expected = { isAvailable: true, manifest: fakeManifest };
  expect(actual).toEqual(expected);
});

it('returns the proper object in checkForUpdateAsync if an update is available and manifestString is returned', async () => {
  ExponentUpdates.checkForUpdateAsync.mockReturnValueOnce(JSON.stringify(fakeManifest));

  const actual = await Updates.checkForUpdateAsync();
  const expected = { isAvailable: true, manifest: fakeManifest };
  expect(actual).toEqual(expected);
});

it('returns the proper object in checkForUpdateAsync if an update is not available', async () => {
  ExponentUpdates.checkForUpdateAsync.mockReturnValueOnce(false);

  const actual = await Updates.checkForUpdateAsync();
  const expected = { isAvailable: false };
  expect(actual).toEqual(expected);
});

it('returns the proper object in fetchUpdateAsync if an update is available and manifest is returned', async () => {
  ExponentUpdates.fetchUpdateAsync.mockReturnValueOnce(fakeManifest);

  const actual = await Updates.fetchUpdateAsync();
  const expected = { isNew: true, manifest: fakeManifest };
  expect(actual).toEqual(expected);
});

it('returns the proper object in fetchUpdateAsync if an update is available and manifestString is returned', async () => {
  ExponentUpdates.fetchUpdateAsync.mockReturnValueOnce(JSON.stringify(fakeManifest));

  const actual = await Updates.fetchUpdateAsync();
  const expected = { isNew: true, manifest: fakeManifest };
  expect(actual).toEqual(expected);
});

it('returns the proper object in fetchUpdateAsync if an update is not available', async () => {
  ExponentUpdates.fetchUpdateAsync.mockReturnValueOnce(false);

  const actual = await Updates.fetchUpdateAsync();
  const expected = { isNew: false };
  expect(actual).toEqual(expected);
});
