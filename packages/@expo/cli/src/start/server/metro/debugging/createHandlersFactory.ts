import type { CreateCustomMessageHandlerFn } from '@react-native/dev-middleware';

import { NetworkResponseHandler } from './messageHandlers/NetworkResponse';
import { PageReloadHandler } from './messageHandlers/PageReload';
import { VscodeDebuggerGetPossibleBreakpointsHandler } from './messageHandlers/VscodeDebuggerGetPossibleBreakpoints';
import { VscodeDebuggerSetBreakpointByUrlHandler } from './messageHandlers/VscodeDebuggerSetBreakpointByUrl';
import { VscodeRuntimeCallFunctionOnHandler } from './messageHandlers/VscodeRuntimeCallFunctionOn';
import { VscodeRuntimeGetPropertiesHandler } from './messageHandlers/VscodeRuntimeGetProperties';
import type { MetroBundlerDevServer } from '../MetroBundlerDevServer';

export function createHandlersFactory(
  metroBundler: MetroBundlerDevServer
): CreateCustomMessageHandlerFn {
  return (connection) => {
    // Only enable the custom CDP handlers for the React Native Experimental page
    if (connection.page.title !== 'React Native Experimental (Improved Chrome Reloads)') {
      return null;
    }

    const middlewares = [
      // Generic handlers
      new NetworkResponseHandler(connection),
      new PageReloadHandler(connection, metroBundler),
      // Vscode-specific handlers
      new VscodeDebuggerGetPossibleBreakpointsHandler(connection),
      new VscodeDebuggerSetBreakpointByUrlHandler(connection),
      new VscodeRuntimeGetPropertiesHandler(connection),
      new VscodeRuntimeCallFunctionOnHandler(connection),
    ].filter((middleware) => middleware.isEnabled());

    if (!middlewares.length) {
      return null;
    }

    return {
      handleDeviceMessage: (message: any) =>
        middlewares.some((middleware) => middleware.handleDeviceMessage?.(message)) || undefined,
      handleDebuggerMessage: (message: any) =>
        middlewares.some((middleware) => middleware.handleDebuggerMessage?.(message)) || undefined,
    };
  };
}
