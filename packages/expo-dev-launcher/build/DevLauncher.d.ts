import { NewManifest, LegacyManifest } from 'expo-manifests';
import './setUpErrorHandler.fx';
export type Manifest = NewManifest | LegacyManifest;
export { disableErrorHandling } from './DevLauncherErrorManager';
export declare function registerErrorHandlers(): void;
export declare function isDevelopmentBuild(): boolean;
export type DevLauncherExtension = {
    navigateToLauncherAsync: () => Promise<void>;
};
//# sourceMappingURL=DevLauncher.d.ts.map