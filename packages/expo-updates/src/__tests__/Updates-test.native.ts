import * as Updates from '../Updates';
import ExpoUpdates from '../ExpoUpdates';

const fakeManifest = {
  id: '@jester/test-app',
  sdkVersion: '36.0.0',
};

it('returns the proper object in checkForUpdateAsync if no update is available', async () => {
  const mock = jest.fn();
  ExpoUpdates.checkForUpdateAsync = mock;
  mock.mockReturnValueOnce(false);

  const actual = await Updates.checkForUpdateAsync();
  const expected = { isAvailable: false };
  expect(actual).toEqual(expected);
});

it('returns the proper object in checkForUpdateAsync if an update is available and manifest is returned', async () => {
  const mock = jest.fn();
  ExpoUpdates.checkForUpdateAsync = mock;
  mock.mockReturnValueOnce(fakeManifest);

  const actual = await Updates.checkForUpdateAsync();
  const expected = { isAvailable: true, manifest: fakeManifest };
  expect(actual).toEqual(expected);
});

it('returns the proper object in checkForUpdateAsync if an update is available and stringified manifest is returned', async () => {
  const mock = jest.fn();
  ExpoUpdates.checkForUpdateAsync = mock;
  mock.mockReturnValueOnce(JSON.stringify(fakeManifest));

  const actual = await Updates.checkForUpdateAsync();
  const expected = { isAvailable: true, manifest: fakeManifest };
  expect(actual).toEqual(expected);
});

it('returns the proper object in fetchUpdateAsync if no update is available', async () => {
  const mock = jest.fn();
  ExpoUpdates.fetchUpdateAsync = mock;
  mock.mockReturnValueOnce(false);

  const actual = await Updates.fetchUpdateAsync();
  const expected = { isNew: false };
  expect(actual).toEqual(expected);
});

it('returns the proper object in fetchUpdateAsync if an update is available and manifest is returned', async () => {
  const mock = jest.fn();
  ExpoUpdates.fetchUpdateAsync = mock;
  mock.mockReturnValueOnce(fakeManifest);

  const actual = await Updates.fetchUpdateAsync();
  const expected = { isNew: true, manifest: fakeManifest };
  expect(actual).toEqual(expected);
});

it('returns the proper object in fetchUpdateAsync if an update is available and stringified manifest is returned', async () => {
  const mock = jest.fn();
  ExpoUpdates.fetchUpdateAsync = mock;
  mock.mockReturnValueOnce(JSON.stringify(fakeManifest));

  const actual = await Updates.fetchUpdateAsync();
  const expected = { isNew: true, manifest: fakeManifest };
  expect(actual).toEqual(expected);
});
