import { NativeModules } from 'react-native';
import './setUpErrorHandler.fx';
export { disableErrorHandling } from './DevLauncherErrorManager';
export function registerErrorHandlers() {
    console.warn('DevLauncher.registerErrorHandlers has been deprecated. To enable error handlers you need to import "expo-dev-launcher" at the top of your index.js.');
}
export function isDevelopmentBuild() {
    return !!NativeModules.EXDevLauncher;
}
//# sourceMappingURL=DevLauncher.js.map