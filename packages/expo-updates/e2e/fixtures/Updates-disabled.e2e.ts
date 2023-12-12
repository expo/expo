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
});
