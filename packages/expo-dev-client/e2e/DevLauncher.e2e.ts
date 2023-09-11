import { element, expect, waitFor, by, device } from 'detox';

const LauncherMainScreenTimeout = 100 * 1000;
const MenuTimeout = 100 * 1000;
const LocalAppTimeout = 160 * 1000;

const sleep = (duration: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), duration));

async function pressElementByString(buttonString: string) {
  const button = element(by.text(buttonString));
  await expect(button).toBeVisible();
  await tapButton(button);
}

async function pressMenuElementByString(buttonString: string, timeout: number = 0) {
  let button = element(by.text(buttonString));

  await waitFor(button).toBeVisible().withTimeout(timeout);

  // When we open the dev-menu, we will see an animation.
  // Unfortunately, if we try to click to button before the
  // animation finishes, it may not work. We might click different a button.
  // So try to wait for the animation to finish.
  await sleep(1000);

  button = element(by.text(buttonString));
  await waitFor(button).toBeVisible();

  await tapButton(button);
}

async function runWithoutSynchronization(block: () => Promise<void>) {
  await device.disableSynchronization();
  await block();
  await device.enableSynchronization();
}

function getInvocationManager() {
  // @ts-ignore
  return global.detox[Object.getOwnPropertySymbols(global.detox)[0]]._invocationManager;
}

function getLocalIPAddress(): string {
  return require('os')
    .networkInterfaces()
    .en0.find((elm: { family: string }) => elm.family === 'IPv4').address;
}

async function openMenu(): Promise<void> {
  if (device.getPlatform() === 'android') {
    return await getInvocationManager().execute({
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

async function waitForLauncherMainScreen() {
  await waitFor(element(by.id('DevLauncherMainScreen')))
    .toBeVisible()
    .withTimeout(LauncherMainScreenTimeout);
}

async function waitForAppMainScreen() {
  await waitFor(element(by.id('LocalAppMainScreen')))
    .toBeVisible()
    .withTimeout(LocalAppTimeout);
}

async function ensureThatLauncherMainScreenIsVisible() {
  if (device.getPlatform() === 'ios') {
    await expect(element(by.id('DevLauncherMainScreen'))).toBeVisible();
    return;
  }

  await waitForLauncherMainScreen();
}

async function tapButton(button: Detox.IndexableNativeElement) {
  // We have to make 2 tap - it is a bug in React Native.
  await button.multiTap(2);
}

describe('DevLauncher', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should render main screen', async () => {
    await ensureThatLauncherMainScreenIsVisible();
  });

  it('should be able to go to the settings screen and come back to the main screen', async () => {
    await ensureThatLauncherMainScreenIsVisible();

    await pressElementByString('Settings');
    await expect(element(by.id('DevLauncherSettingsScreen'))).toBeVisible();

    await pressElementByString('Home');
    await expect(element(by.id('DevLauncherMainScreen'))).toBeVisible();
  });

  it('should be able to load app from URL and come back to the launcher screen', async () => {
    await ensureThatLauncherMainScreenIsVisible();

    const urlToggle = element(by.id('DevLauncherURLToggle'));
    const urlInput = element(by.id('DevLauncherURLInput'));
    const loadButton = element(by.id('DevLauncherLoadAppButton'));

    await expect(urlToggle).toBeVisible();
    await urlToggle.tap();

    await expect(urlInput).toBeVisible();
    await expect(loadButton).toBeVisible();

    await urlInput.typeText(`http://${getLocalIPAddress()}:8081`);
    if (device.getPlatform() === 'android') {
      // close keyboard
      await device.pressBack();
    }

    await runWithoutSynchronization(async () => {
      await tapButton(loadButton);
      await waitForAppMainScreen();
      await openMenu();

      await pressMenuElementByString('Go home', MenuTimeout);

      await waitForLauncherMainScreen();
    });
  });
});
