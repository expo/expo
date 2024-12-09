/* eslint-env jest */
import { setupTestProjectWithOptionsAsync } from './utils';
import { createExpoStart } from '../utils/expo';

const expo = createExpoStart({
  env: {
    TEST_BABEL_PRESET_EXPO_MODULE_ID: require.resolve('babel-preset-expo'),
    EXPO_USE_FAST_RESOLVER: 'true',
  },
});

beforeAll(async () => {
  expo.options.cwd = await setupTestProjectWithOptionsAsync('metro-server', 'with-assets');
  await expo.startAsync();
});
afterAll(async () => {
  await expo.stopAsync();
});

it('bundles the app entry point', async () => {
  const response = await expo.fetchBundleAsync('/App.bundle?platform=ios');
  expect(response).toMatchObject({ status: 200 });
  expect(response.headers.get('Content-Type')).toContain('application/javascript');
});

it('serves assets using url pathname references', async () => {
  const response = await expo.fetchAsync('/assets/assets/icon.png');
  expect(response).toMatchObject({ status: 200 });
  expect(response.headers.get('Content-Type')).toContain('image/png');
});

it('serves assets using unstable_path references', async () => {
  const response = await expo.fetchAsync(
    `/assets?unstable_path=${encodeURIComponent('./assets/icon.png')}`
  );
  expect(response).toMatchObject({ status: 200 });
  expect(response.headers.get('Content-Type')).toContain('image/png');
});

it('serves assets from public folder', async () => {
  const response = await expo.fetchAsync('/favicon.ico');
  expect(response).toMatchObject({ status: 200 });
  expect(response.headers.get('Content-Type')).toContain('image/x-icon');
});
