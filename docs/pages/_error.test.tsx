import { getRenamedPath } from './_error';

test('redirects version vX.0.0 renamed path', () => {
  const redirectPath = '/versions/v32.0.0/guides/push-notifications/';
  const newPath = getRenamedPath(redirectPath);

  expect(newPath).toEqual('/push-notifications/overview/');
});

test('redirects version latest renamed path', () => {
  const redirectPath = '/versions/latest/guides/push-notifications/';
  const newPath = getRenamedPath(redirectPath);

  expect(newPath).toEqual('/push-notifications/overview/');
});

test('redirects versionless path', () => {
  const redirectPath = '/guides/push-notifications/';
  const newPath = getRenamedPath(redirectPath);

  expect(newPath).toEqual('/push-notifications/overview/');
});

test('does not redirect versioned non-renamed path', () => {
  const redirectPath = '/versions/latest/workflow/expo-cli/';
  const newPath = getRenamedPath(redirectPath);

  expect(newPath).toEqual(redirectPath);
});

test('does not redirect non-renamed path', () => {
  const redirectPath = '/workflow/expo-cli/';
  const newPath = getRenamedPath(redirectPath);

  expect(newPath).toEqual(redirectPath);
});
