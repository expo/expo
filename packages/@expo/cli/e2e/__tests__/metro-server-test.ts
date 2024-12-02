import { setupTestProjectWithOptionsAsync as setupTestProjectAsync } from './utils';
import { createExpoStartServer } from '../utils/expo-server';

describe('bundling code', () => {
  const expo = createExpoStartServer();

  beforeAll(async () => {
    expo.options.cwd = await setupTestProjectAsync('metro-server-bundle-code', 'with-blank');
    await expo.startAsync(['--max-workers=0']);
  });

  afterAll(async () => {
    await expo.stopAsync();
  });

  it('bundles the app entry point', async () => {
    const response = await expo.fetchAsync('/App.bundle?platform=ios');
    expect(response).toMatchObject({ status: 200 });
    expect(response.headers.get('Content-Type')).toContain('application/javascript');
  });
});

describe('serving assets', () => {
  const expo = createExpoStartServer({
    env: {
      // See: e2e/fixtures/with-assets/babel.config.js
      TEST_BABEL_PRESET_EXPO_MODULE_ID: require.resolve('babel-preset-expo'),
    },
  });

  beforeAll(async () => {
    expo.options.cwd = await setupTestProjectAsync('metro-server-bundle-asset', 'with-assets');
    await expo.startAsync(['--max-workers=0']);
  });

  afterAll(async () => {
    await expo.stopAsync();
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
});
