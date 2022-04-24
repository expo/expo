import './setUpErrorHandler.fx';
export { disableErrorHandling } from './DevLauncherErrorManager';
export declare function registerErrorHandlers(): void;
export declare function isDevelopmentBuild(): boolean;
export declare type DevLauncherExtension = {
    navigateToLauncherAsync: () => Promise<void>;
};
//# sourceMappingURL=DevLauncher.d.ts.map