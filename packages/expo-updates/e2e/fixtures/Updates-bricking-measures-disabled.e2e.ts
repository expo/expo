import { by, device, element, waitFor } from 'detox';
import jestExpect from 'expect';
import { setTimeout } from 'timers/promises';

import Server from './utils/server';
import Update from './utils/update';

const projectRoot = process.env.PROJECT_ROOT || process.cwd();
const platform = device.getPlatform();
const protocolVersion = 1;

const testElementValueAsync = async (testID: string) => {
  const attributes: any = await element(by.id(testID)).getAttributes();
  return attributes?.text || '';
};

const pressTestButtonAsync = async (testID: string) => {
  await element(by.id(testID)).tap();
};

const waitForAppToBecomeVisible = async () => {
  await waitFor(element(by.id('updateString')))
    .toBeVisible()
    .withTimeout(3000);
};

describe('Basic tests', () => {
  afterEach(async () => {
    await device.uninstallApp();
    Server.stop();
  });

  it('downloads and launches overridden URL and request headers', async () => {
    const bundleFilename = 'bundle1.js';
    const newNotifyString = 'test-update-1';
    const hash = await Update.copyBundleToStaticFolder(
      projectRoot,
      bundleFilename,
      newNotifyString,
      platform
    );
    const manifest = Update.getUpdateManifestForBundleFilename(
      new Date(),
      hash,
      'test-update-1-key',
      bundleFilename,
      [],
      projectRoot
    );

    Server.start(Update.serverPort, protocolVersion, 0, /* shouldServeOverriddenUrl */ true);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await waitForAppToBecomeVisible();

    // should not have updated (should have gotten 204 from server)
    const message = await testElementValueAsync('updateString');
    jestExpect(message).toBe('test');

    await pressTestButtonAsync('setUpdateURLAndRequestHeadersOverride');

    await setTimeout(1000);

    await device.terminateApp();

    await device.launchApp({
      newInstance: true,
    });
    await waitForAppToBecomeVisible();
    // should not have updated (should have gotten 204 from server)
    const message2 = await testElementValueAsync('updateString');
    jestExpect(message2).toBe(newNotifyString);
  });
});
