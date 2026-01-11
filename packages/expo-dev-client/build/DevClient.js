import { requireOptionalNativeModule } from 'expo-modules-core';
export * from 'expo-dev-menu';
const ExpoDevLauncher = requireOptionalNativeModule('ExpoDevLauncher');
export async function loadAppAsync(url, projectUrl) {
    if (ExpoDevLauncher?.loadApp) {
        return ExpoDevLauncher.loadApp(url, projectUrl);
    }
    throw new Error('ExpoDevLauncher.loadApp is not available in this build.');
}
//# sourceMappingURL=DevClient.js.map