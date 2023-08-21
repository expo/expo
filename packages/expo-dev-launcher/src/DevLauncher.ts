import { NewManifest } from 'expo-manifests';
import { NativeModules } from 'react-native';
import './setUpErrorHandler.fx';

// Dev launcher manifests are only ones served by servers (not embedded bare manifests)
export type Manifest = NewManifest;

export { disableErrorHandling } from './DevLauncherErrorManager';

export function registerErrorHandlers() {
  console.warn(
    'DevLauncher.registerErrorHandlers has been deprecated. To enable error handlers you need to import "expo-dev-launcher" at the top of your index.js.'
  );
}

export function isDevelopmentBuild(): boolean {
  return !!NativeModules.EXDevLauncher;
}

export type DevLauncherExtension = {
  navigateToLauncherAsync: () => Promise<void>;
};
