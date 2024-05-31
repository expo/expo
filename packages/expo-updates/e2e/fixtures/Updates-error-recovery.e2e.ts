import { by, device, element, waitFor } from 'detox';
import jestExpect from 'expect';

import Server from './utils/server';
import Update from './utils/update';

const projectRoot = process.env.PROJECT_ROOT || process.cwd();
const platform = device.getPlatform();
const protocolVersion = 1;

const testElementValueAsync = async (testID: string) => {
  const attributes: any = await element(by.id(testID)).getAttributes();
  return attributes?.text || '';
};

const waitForAppToBecomeVisible = async () => {
  await waitFor(element(by.id('updateString')))
    .toBeVisible()
    .withTimeout(2000);
};

describe('Error recovery tests', () => {
  afterEach(async () => {
    await device.uninstallApp();
    Server.stop();
  });

  it('downloads new update before launching, but launches the last non-crashing update', async () => {
    Server.start(Update.serverPort, protocolVersion, 1000);

    await Server.serveSignedDirective(Update.getNoUpdateAvailableDirective(), projectRoot);

    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });

    const request1 = await Server.waitForUpdateRequest(10000);
    const request1CurrentUpdateId = request1.headers['expo-current-update-id'];
    const request1RecentFailedUpdateIds = request1.headers['expo-recent-failed-update-ids'];
    const embeddedUpdateId = request1.headers['expo-embedded-update-id'];
    jestExpect(embeddedUpdateId).toBeTruthy();
    jestExpect(request1RecentFailedUpdateIds).toBeUndefined();
    jestExpect(request1CurrentUpdateId).toEqual(embeddedUpdateId);

    await waitForAppToBecomeVisible();
    await device.terminateApp();

    const bundleFilename = 'bundle1.js';
    const newNotifyString = 'test-update-crashing';
    const hash = await Update.copyBundleToStaticFolder(
      projectRoot,
      bundleFilename,
      newNotifyString,
      platform
    );
    const manifest = Update.getUpdateManifestForBundleFilename(
      new Date(),
      hash,
      'test-update-crashing-key',
      bundleFilename,
      [],
      projectRoot
    );

    await Server.serveSignedManifest(manifest, projectRoot);

    // launch app for error recovery
    try {
      // Detox on Android may timeout from waiting idling resources because Detox doesn't support reloading the app under the hood
      await device.launchApp({
        newInstance: true,
      });
    } catch {}

    // we don't check current update ID header or failed update IDs header since the behavior for this request is not defined
    // (we don't guarantee current update to be set during a crash or the launch failure to have been registered yet)
    const request2 = await Server.waitForUpdateRequest(10000);
    const request2EmbeddedUpdateId = request2.headers['expo-embedded-update-id'];
    const request2CurrentUpdateId = request2.headers['expo-current-update-id'];
    jestExpect(embeddedUpdateId).toEqual(request2EmbeddedUpdateId);

    await device.terminateApp();

    // relaunch, it should launch the embedded update since the update being served failed to launch
    await device.launchApp({
      newInstance: true,
    });
    const request3 = await Server.waitForUpdateRequest(10000);
    const request3CurrentUpdateId = request3.headers['expo-current-update-id'];
    const request3EmbeddedUpdateId = request3.headers['expo-embedded-update-id'];
    const request3RecentFailedUpdateIds = request3.headers['expo-recent-failed-update-ids'];
    jestExpect(embeddedUpdateId).toEqual(request3EmbeddedUpdateId);
    jestExpect(embeddedUpdateId).toEqual(request3CurrentUpdateId);
    jestExpect(request3RecentFailedUpdateIds).toEqual(`"${request2CurrentUpdateId}"`);

    await waitForAppToBecomeVisible();
    const message = await testElementValueAsync('updateString');
    jestExpect(message).toBe('test');

    await device.terminateApp();
  });
});
