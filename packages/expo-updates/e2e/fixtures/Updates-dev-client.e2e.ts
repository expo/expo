import { by, device, element, waitFor } from 'detox';
import jestExpect from 'expect';
import { setTimeout } from 'timers/promises';

const platform = device.getPlatform();

const testElementValueAsync = async (testID: string) => {
  const attributes: any = await element(by.id(testID)).getAttributes();
  return attributes?.text || '';
};

const pressTestButtonAsync = async (testID: string) => await element(by.id(testID)).tap();

const waitForAppToBecomeVisible = async () => {
  await waitFor(element(by.id('updateString')))
    .toBeVisible()
    .withTimeout(2000);
};

describe('Basic tests', () => {
  afterEach(async () => {
    await device.uninstallApp();
  });

  it('starts app, shows info when updates are disabled', async () => {
    console.warn(`Platform = ${platform}`);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await waitForAppToBecomeVisible();

    // TODO(wschurman): need to launch a dev server for dev client and tap the server in the UI

    jestExpect(await testElementValueAsync('updateString')).toBe('test');
    jestExpect(await testElementValueAsync('updateID')).toBeTruthy();
    jestExpect(await testElementValueAsync('runtimeVersion')).toBe('');
    jestExpect(await testElementValueAsync('checkAutomatically')).toBe('NEVER');
    jestExpect(await testElementValueAsync('isEmbeddedLaunch')).toBe('false');
    jestExpect(await testElementValueAsync('availableUpdateID')).toBe('undefined');
    jestExpect(await testElementValueAsync('lastJSAPIErrorMessage')).toBe('false');

    await pressTestButtonAsync('callJSAPI');
    await setTimeout(2000);
    jestExpect(await testElementValueAsync('lastJSAPIErrorMessage')).toBe('true');

    await device.terminateApp();
  });

  it('reloads', async () => {
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await waitForAppToBecomeVisible();

    // TODO(wschurman): need to launch a dev server for dev client and tap the server in the UI

    const isReloadingBefore = await testElementValueAsync('isReloading');
    jestExpect(isReloadingBefore).toBe('false');
    const startTimeBefore = parseInt(await testElementValueAsync('startTime'), 10);
    jestExpect(startTimeBefore).toBeGreaterThan(0);

    await pressTestButtonAsync('reload');

    // wait 3 seconds for reload to complete
    // it's delayed 2 seconds after the button press in the client so the button press finish registers in detox
    await setTimeout(3000);

    const isReloadingAfter = await testElementValueAsync('isReloading');
    jestExpect(isReloadingAfter).toBe('false');
    const startTimeAfter = parseInt(await testElementValueAsync('startTime'), 10);
    jestExpect(startTimeAfter).toBeGreaterThan(startTimeBefore);

    await device.terminateApp();
  });
});
