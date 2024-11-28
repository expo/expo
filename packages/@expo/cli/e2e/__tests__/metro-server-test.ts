import {
  ExpoSourceStartCommand,
  setupTestProjectWithOptionsAsync as setupTestProjectAsync,
} from './utils';

describe('bundling code', () => {
  let expo: ExpoSourceStartCommand;

  beforeAll(async () => {
    const projectRoot = await setupTestProjectAsync('metro-server-bundle-code', 'with-blank');
    expo = new ExpoSourceStartCommand(projectRoot);
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
  let expo: ExpoSourceStartCommand;

  beforeAll(async () => {
    const projectRoot = await setupTestProjectAsync('metro-server-bundle-asset', 'with-assets');
    expo = new ExpoSourceStartCommand(projectRoot, {
      // See: e2e/fixtures/with-assets/babel.config.js
      TEST_BABEL_PRESET_EXPO_MODULE_ID: require.resolve('babel-preset-expo'),
    });
    await expo.startAsync();
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
