import { element, expect, waitFor, by, device } from 'detox';

const MenuTimeout = 70 * 1000;
const LauncherMainScreenTimeout = 50 * 1000;
const LocalAppTimeout = 80 * 1000;

const sleep = (duration: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), duration));

async function pressMenuButton(buttonString: string) {
  let button = element(by.text(buttonString));

  await waitFor(button).toBeVisible().withTimeout(MenuTimeout);

  // When we open the dev-menu, we will see an animation.
  // Unfortunately, if we try to click to button before the
  // animation finishes, it may not work. We might click different a button.
  // So try to wait for the animation to finish.
  await sleep(1000);

  button = element(by.text(buttonString));
  await waitFor(button).toBeVisible();

  await button.tap();
}

function getInvocationManager() {
  // @ts-ignore
  return global.detox[Object.getOwnPropertySymbols(global.detox)[0]]._invocationManager;
}

function getLocalIPAddress(): string {
  if (device.getPlatform() === 'ios') {
    return 'localhost';
  }
  return require('os')
    .networkInterfaces()
    .en0.find((elm: { family: string }) => elm.family === 'IPv4').address;
}

async function openMenu(): Promise<void> {
  if (device.getPlatform() === 'android') {
    return getInvocationManager().execute({
      target: {
        type: 'Class',
        value: 'com.testrunner.DevClientDetoxHelper',
      },
      method: 'openMenu',
      args: [],
    });
  }
  return await device.shake();
}

describe('DevLauncher', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should render main screen', async () => {
    await expect(element(by.id('DevLauncherMainScreen'))).toBeVisible();
  });

  it('should be able to open dev menu', async () => {
    await expect(element(by.id('DevLauncherMainScreen'))).toBeVisible();

    await openMenu();

    await waitFor(element(by.id('DevMenuMainScreen')))
      .toBeVisible()
      .withTimeout(MenuTimeout);
  });

  it('should be able to load app from URL', async () => {
    const urlInput = element(by.id('DevLauncherURLInput'));
    const loadButton = element(by.id('DevLauncherLoadAppButton'));

    await expect(urlInput).toBeVisible();
    await expect(loadButton).toBeVisible();

    await urlInput.typeText(`http://${getLocalIPAddress()}:8081`);
    if (device.getPlatform() === 'android') {
      // close keyboard
      await device.pressBack();
    }
    await loadButton.multiTap(2);

    await waitFor(element(by.id('LocalAppMainScreen')))
      .toBeVisible()
      .withTimeout(LocalAppTimeout);
  });

  it('should be able to come back to the dev launcher screen', async () => {
    const urlInput = element(by.id('DevLauncherURLInput'));
    const loadButton = element(by.id('DevLauncherLoadAppButton'));

    await expect(urlInput).toBeVisible();
    await expect(loadButton).toBeVisible();

    await urlInput.typeText(`http://${getLocalIPAddress()}:8081`);
    if (device.getPlatform() === 'android') {
      // close keyboard
      await device.pressBack();
    }
    await loadButton.multiTap(2);

    await waitFor(element(by.id('LocalAppMainScreen')))
      .toBeVisible()
      .withTimeout(LocalAppTimeout);

    await openMenu();

    await pressMenuButton('Back to Launcher');

    await waitFor(element(by.id('DevLauncherMainScreen')))
      .toBeVisible()
      .withTimeout(LauncherMainScreenTimeout);
  });
});
