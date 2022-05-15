import { DevLauncherExtension } from 'expo-dev-launcher';

export const DevLauncher: DevLauncherExtension = {
  navigateToLauncherAsync: jest.fn(),
};

export const isDevLauncherInstalled = true;
