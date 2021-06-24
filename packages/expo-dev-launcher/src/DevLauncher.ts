import './setUpErrorHandler.fx';
export { disableErrorHandling } from './DevLauncherErrorManager';

export function registerErrorHandlers() {
  console.warn(
    'DevLauncher.registerErrorHandlers was deprecated. To enable error handlers you need to import "expo-dev-launcher" on top of your index.js.'
  );
}
