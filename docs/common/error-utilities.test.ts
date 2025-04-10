import { getRedirectPath } from './error-utilities';

test('redirects old building-standalone-apps paths versioned path', () => {
  const redirectPath = '/versions/latest/distribution/building-standalone-apps/';
  const newPath = getRedirectPath(redirectPath);

  expect(newPath).toEqual('/build/setup/');

  // The path with guides instead of distribution is very old
  expect(getRedirectPath('/versions/latest/guides/building-standalone-apps/')).toEqual(newPath);
});

test('redirects version vX.0.0 renamed path', () => {
  const redirectPath = '/versions/v32.0.0/guides/push-notifications/';
  const newPath = getRedirectPath(redirectPath);

  expect(newPath).toEqual('/push-notifications/overview/');
});

test('redirects version latest renamed path', () => {
  const redirectPath = '/versions/latest/guides/push-notifications/';
  const newPath = getRedirectPath(redirectPath);

  expect(newPath).toEqual('/push-notifications/overview/');
});

test('redirects versionless renamed path', () => {
  const redirectPath = '/guides/push-notifications/';
  const newPath = getRedirectPath(redirectPath);

  expect(newPath).toEqual('/push-notifications/overview/');
});

test('redirects versioned non-renamed path', () => {
  const redirectPath = '/versions/latest/workflow/expo-cli/';
  const newPath = getRedirectPath(redirectPath);

  expect(newPath).toEqual('/more/expo-cli/');
});

test('does not redirect non-renamed path', () => {
  const redirectPath = '/workflow/expo-cli/';
  const newPath = getRedirectPath(redirectPath);

  expect(newPath).toEqual('/more/expo-cli/');
});

test('adds forward slash to end of path', () => {
  const redirectPath = '/workflow/expo-cli';
  const newPath = getRedirectPath(redirectPath);

  expect(newPath).toEqual('/more/expo-cli/');
});

test('redirects old versions to latest', () => {
  const redirectPath = '/versions/v32.0.0/sdk/camera/';
  const newPath = getRedirectPath(redirectPath);

  expect(newPath).toEqual('/versions/latest/sdk/camera/');
});

test('removes null from end of paths', () => {
  const redirectPath = '/debugging/errors-and-warnings/null';
  const newPath = getRedirectPath(redirectPath);

  expect(newPath).toEqual('/debugging/errors-and-warnings/');
});

test('redirect SDK permissions to the permission guide', () => {
  expect(getRedirectPath('/versions/latest/sdk/permissions/')).toEqual('/guides/permissions/');
});
