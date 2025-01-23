import type { Resolution, ResolutionContext } from 'metro-resolver';
import path from 'node:path';

import type { ExpoCustomMetroResolver } from './withMetroResolvers';

const debug = require('debug')('expo:start:server:metro:multi-platform') as typeof console.log;

type ExpoStrictResolver = (
  context: ResolutionContext,
  platform: string | null
) => (moduleName: string) => Resolution;

/**
 * React Native used to have logs from android/ios devices emitted in the terminal.
 * This uses a now legacy logging API, which is disabled starting from React Native 0.77.
 * To keep the terminal-emitted logs we temporarily swap out the following file:
 *   - `react-native/Libraries/Core/setUpDeveloperTools.js`
 * It allows us to disable the "logging is going away" warning, and re-enable the legacy logging system.
 *
 * In the future, this must be replaced by a CDP client connected from Expo CLI that listens for `Runtime.consoleAPICalled` events.
 * Unfortunately this is not possible yet due to two major limitations in the current CDP implementation.
 *   1. Expo CLI can't listen for new inspectable devices
 *   2. Fuxebox / inspector proxy only allows 1 debugger to be connected simultaneously
 */
export function createExpoTerminalLogResolver({
  getStrictResolver,
}: {
  getStrictResolver: ExpoStrictResolver;
}): ExpoCustomMetroResolver {
  let originModulePath: string;
  const setupDevtoolsModule = require.resolve(
    '@expo/cli/static/virtual/react-native/Libraries/Core/setUpDeveloperTools.js'
  );

  return function requestExpoTerminalLogModule(context, moduleName, platform) {
    if (platform !== 'android' && platform !== 'ios') {
      return null;
    }

    // Resolve `react-native/Libraries/Core/setUpDeveloperTools` to forked version
    if (moduleIsSetupDevTools(context, moduleName)) {
      debug('Redirecting module:', moduleName, '->', setupDevtoolsModule);

      originModulePath = path.join(
        path.dirname(context.originModulePath),
        path.basename(moduleName)
      );

      return {
        type: 'sourceFile',
        filePath: setupDevtoolsModule,
      };
    }

    // Resolve dependants of forked version to the original path
    if (
      originModulePath &&
      context.originModulePath.endsWith(
        '@expo/cli/static/virtual/react-native/Libraries/Core/setUpDeveloperTools.js'
      )
    ) {
      return getStrictResolver({ ...context, originModulePath }, platform)(moduleName);
    }

    return null;
  };
}

function moduleIsSetupDevTools(context: ResolutionContext, moduleName: string) {
  return (
    moduleName === 'react-native/Libraries/Core/setUpDeveloperTools' ||
    (moduleName.endsWith('/setUpDeveloperTools') &&
      path.dirname(context.originModulePath).endsWith('react-native/Libraries/Core'))
  );
}
