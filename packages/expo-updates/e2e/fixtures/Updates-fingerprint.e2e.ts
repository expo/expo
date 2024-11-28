import { by, device, element, waitFor } from 'detox';
import jestExpect from 'expect';

import Server from './utils/server';
import Update from './utils/update';

const projectRoot = process.env.PROJECT_ROOT || process.cwd();
const platform = device.getPlatform();
const protocolVersion = 1;

const debugInstructions = `
If you are seeing this, it probably means that the fingerprint in the built e2e app does not match the one in the served manifest. To debug why:
1. In .github/actions/eas-build/actions, add '--build-logger-level=debug' to the eas build command.
2. In packages/expo-updates/e2e/fixtures/project_files/e2e/tests/utils/update.ts, set printDebug to true
3. Run CI on github.
4. In EAS build page for the CI run, compare the fingerprint debug output in 'Calculate expo-updates runtime version' step with that of the 'Build success hook' step.
`;

const testElementValueAsync = async (testID: string) => {
  const attributes: any = await element(by.id(testID)).getAttributes();
  return attributes?.text || '';
};

const waitForAppToBecomeVisible = async () => {
  await waitFor(element(by.id('updateString')))
    .toBeVisible()
    .withTimeout(2000);
};

describe('Basic tests', () => {
  afterEach(async () => {
    await device.uninstallApp();
    Server.stop();
  });

  it('downloads new update before launching', async () => {
    const bundleFilename = 'bundle1.js';
    const newNotifyString = 'test-update-1';
    const hash = await Update.copyBundleToStaticFolder(
      projectRoot,
      bundleFilename,
      newNotifyString,
      platform
    );
    const manifest =
      await Update.getUpdateManifestForBundleFilenameWithFingerprintRuntimeVersionAsync(
        new Date(),
        hash,
        'test-update-1-key',
        bundleFilename,
        [],
        projectRoot,
        platform
      );

    Server.start(Update.serverPort, protocolVersion, 1000);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await waitForAppToBecomeVisible();
    const message = await testElementValueAsync('updateString');

    if (message !== 'test-update-1') {
      console.log(debugInstructions);
    }

    jestExpect(message).toBe('test-update-1');

    await device.terminateApp();
  });

  it('does not download new update when it takes longer than timeout', async () => {
    const bundleFilename = 'bundle1.js';
    const newNotifyString = 'test-update-1';
    const hash = await Update.copyBundleToStaticFolder(
      projectRoot,
      bundleFilename,
      newNotifyString,
      platform
    );
    const manifest =
      await Update.getUpdateManifestForBundleFilenameWithFingerprintRuntimeVersionAsync(
        new Date(),
        hash,
        'test-update-1-key',
        bundleFilename,
        [],
        projectRoot,
        platform
      );

    Server.start(Update.serverPort, protocolVersion, 7000);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await waitForAppToBecomeVisible();
    const message = await testElementValueAsync('updateString');

    if (message !== 'test') {
      console.log(debugInstructions);
    }

    jestExpect(message).toBe('test');

    await device.terminateApp();
  });
});
