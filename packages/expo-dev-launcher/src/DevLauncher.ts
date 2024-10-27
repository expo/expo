import { ExpoUpdatesManifest } from 'expo-manifests';
import { NativeModules } from 'react-native';
import './setUpErrorHandler.fx';

/**
 * @hidden Dev launcher manifests are only ones served by servers (not embedded bare manifests)
 */
export type Manifest = ExpoUpdatesManifest;

export { disableErrorHandling } from './DevLauncherErrorManager';

/**
 * @hidden
 */
export function registerErrorHandlers() {
  console.warn(
    'DevLauncher.registerErrorHandlers has been deprecated. To enable error handlers you need to import "expo-dev-launcher" at the top of your index.js.'
  );
}

/**
 * A method that returns a boolean to indicate if the current application is a development build.
 */
export function isDevelopmentBuild(): boolean {
  return !!NativeModules.EXDevLauncher;
}

/**
 * @hidden
 */
export type DevLauncherExtension = {
  navigateToLauncherAsync: () => Promise<void>;
};
