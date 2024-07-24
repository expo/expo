import { ExpoUpdatesManifest } from 'expo-manifests';
import './setUpErrorHandler.fx';
/**
 * @hidden Dev launcher manifests are only ones served by servers (not embedded bare manifests)
 */
export type Manifest = ExpoUpdatesManifest;
export { disableErrorHandling } from './DevLauncherErrorManager';
/**
 * @hidden
 */
export declare function registerErrorHandlers(): void;
/**
 * A method that returns a boolean to indicate if the current application is a development build.
 */
export declare function isDevelopmentBuild(): boolean;
/**
 * @hidden
 */
export type DevLauncherExtension = {
    navigateToLauncherAsync: () => Promise<void>;
};
//# sourceMappingURL=DevLauncher.d.ts.map