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

  it('downloads and launches with new update when startup takes less time than fallbackToCacheTimeout', async () => {
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

    Server.start(Update.serverPort, protocolVersion, 1000);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await waitForAppToBecomeVisible();
    const message = await testElementValueAsync('updateString');
    jestExpect(message).toBe('test-update-1');

    await device.terminateApp();
  });

  it('downloads but does not launch with new update when startup takes more time than fallbackToCacheTimeout', async () => {
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

    Server.start(Update.serverPort, protocolVersion, 12000);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await waitForAppToBecomeVisible();

    // this needs to be longer than the server artificial delay
    await setTimeout(15000);

    const message = await testElementValueAsync('updateString');
    jestExpect(message).toBe('test');

    const wasIsStartupProcedureRunningEverTrue = await testElementValueAsync(
      'wasIsStartupProcedureRunningEverTrue'
    );
    jestExpect(wasIsStartupProcedureRunningEverTrue).toBe('true');

    const isStartupProcedureRunning = await testElementValueAsync(
      'state.isStartupProcedureRunning'
    );
    jestExpect(isStartupProcedureRunning).toBe('false');

    await device.terminateApp();
  });
});
