import { test as base } from '@e2e-dev/mobile';

export const test = base.extend<{ openLink: (url: string) => Promise<void> }>({
  openLink: async ({ device, platform }, use) => {
    await use(async (url) => {
      await device.openLink(url);
      // A fresh iOS simulator asks "Open in “Router Tester”?" the first time, then opens links directly.
      if (platform === 'ios') {
        await device.alert('accept').catch(() => {});
      }
    });
  },
});
