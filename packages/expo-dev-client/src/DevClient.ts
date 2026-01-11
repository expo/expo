import { requireOptionalNativeModule } from 'expo-modules-core';

export * from 'expo-dev-menu';

type ExpoDevLauncherModule = {
  loadApp: (url: string, projectUrl?: string) => Promise<boolean>;
};

const ExpoDevLauncher = requireOptionalNativeModule<ExpoDevLauncherModule>('ExpoDevLauncher');

export async function loadAppAsync(url: string, projectUrl?: string): Promise<boolean> {
  if (ExpoDevLauncher?.loadApp) {
    return ExpoDevLauncher.loadApp(url, projectUrl);
  }

  throw new Error('ExpoDevLauncher.loadApp is not available in this build.');
}
