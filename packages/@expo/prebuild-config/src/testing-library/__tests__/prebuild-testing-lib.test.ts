import { vol } from 'memfs';

import {
  applyTemplateFixture,
  compileModsAsync,
  getAndroidManifestStringLikePrebuild,
  getInfoPlistPathLikePrebuild,
  mockProcessPlatform,
  unmockProcessPlatform,
} from './prebuild-tester';

jest.setTimeout(30 * 1000);

jest.mock('fs');

const originalWarn = console.warn;

beforeEach(async () => {
  console.warn = jest.fn();
  mockProcessPlatform('not-darwin');
});

afterEach(() => {
  console.warn = originalWarn;
  vol.reset();
  unmockProcessPlatform();
});

it('runs normally for a single iOS prebuild', async () => {
  const projectRoot = applyTemplateFixture('/app');
  // Prebuilt config
  const config = await compileModsAsync({}, { projectRoot, platforms: ['ios'] });

  // App config should have been modified
  expect(config.name).toBe('app');
  expect(config.ios?.infoPlist).toBeDefined();
  expect(config.ios?.entitlements).toBeDefined();
  expect(config.ios?.infoPlist?.CFBundleURLTypes).toBeDefined();

  expect(Object.values(config.mods!.ios!).every((value) => typeof value === 'function')).toBe(true);

  expect(config).toMatchInfoPlist(expect.objectContaining({ CFBundleDisplayName: 'app' }));
  expect(config).toMatchAppleEntitlements({});
});

it('runs normally for a single Android prebuild', async () => {
  const projectRoot = applyTemplateFixture('/app');
  // Prebuilt config
  const config = await compileModsAsync({}, { projectRoot, platforms: ['android'] });

  // App config should have been modified
  expect(config.name).toBe('app');
  expect(config.ios?.infoPlist).not.toBeDefined();
  expect(config.ios?.entitlements).not.toBeDefined();

  expect(Object.values(config.mods!.ios!).every((value) => typeof value === 'function')).toBe(true);

  // Default value from fixture files.
  expect(config).toMatchInfoPlist(expect.objectContaining({ CFBundleName: '$(PRODUCT_NAME)' }));
});

it('compiles expo-image-picker', async () => {
  const projectRoot = applyTemplateFixture('/app');
  // Prebuilt config
  const config = await compileModsAsync(
    {
      plugins: [jest.requireActual('expo-image-picker/app.plugin.js').default],
    },
    { projectRoot, platforms: ['ios', 'android'] }
  );

  // App config should have been modified
  expect(config.name).toBe('app');
  expect(config.ios?.infoPlist).toBeDefined();
  expect(config.ios?.entitlements).toBeDefined();
  expect(config.ios?.infoPlist?.CFBundleURLTypes).toBeDefined();

  expect(Object.values(config.mods!.ios!).every((value) => typeof value === 'function')).toBe(true);

  expect(config).toHaveModHistory('expo-image-picker');

  expect(config).toMatchInfoPlist(
    expect.objectContaining({
      NSCameraUsageDescription: expect.stringMatching(
        /Allow \$\(PRODUCT_NAME\) to access your camera/
      ),
    })
  );
});

it('compiles expo-camera without camera permission', async () => {
  const projectRoot = applyTemplateFixture('/app');
  // Prebuilt config
  const config = await compileModsAsync(
    {
      plugins: [
        [
          jest.requireActual('expo-camera/app.plugin.js').default,
          {
            cameraPermission: false,
          },
        ],
      ],
    },
    { projectRoot, platforms: ['ios'] }
  );
  expect(config).toHaveModHistory('expo-camera');

  expect(getInfoPlistPathLikePrebuild(config)).not.toMatch(/NSCameraUsageDescription/);
});

it('compiles expo-camera', async () => {
  const projectRoot = applyTemplateFixture('/app');
  // Prebuilt config
  const config = await compileModsAsync(
    {
      plugins: [
        [
          jest.requireActual('expo-camera/app.plugin.js').default,
          {
            cameraPermission: 'custom message',
          },
        ],
      ],
    },
    { projectRoot, platforms: ['ios', 'android'] }
  );

  // Ensure the camera plugin was applied
  expect(config).toHaveModHistory('expo-camera');
  // Ensure the iOS camera permission string is set
  expect(config).toMatchInfoPlist(
    expect.objectContaining({
      NSCameraUsageDescription: expect.stringMatching(/custom message/),
    })
  );
  // Ensure the Android camera permission is added
  expect(getAndroidManifestStringLikePrebuild(config)).toMatch(
    /<uses-permission android:name="android.permission.CAMERA"\/>/
  );
});
