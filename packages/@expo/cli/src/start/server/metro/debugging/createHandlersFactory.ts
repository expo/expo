import type { CreateCustomMessageHandlerFn } from '@react-native/dev-middleware';

import { NetworkResponseHandler } from './messageHandlers/NetworkResponse';
import { PageReloadHandler } from './messageHandlers/PageReload';
import { VscodeDebuggerGetPossibleBreakpointsHandler } from './messageHandlers/VscodeDebuggerGetPossibleBreakpoints';
import { VscodeDebuggerSetBreakpointByUrlHandler } from './messageHandlers/VscodeDebuggerSetBreakpointByUrl';
import { VscodeRuntimeCallFunctionOnHandler } from './messageHandlers/VscodeRuntimeCallFunctionOn';
import { VscodeRuntimeGetPropertiesHandler } from './messageHandlers/VscodeRuntimeGetProperties';
import type { MetroBundlerDevServer } from '../MetroBundlerDevServer';

const debug = require('debug')('expo:metro:debugging:messageHandlers') as typeof console.log;

export function createHandlersFactory(
  metroBundler: MetroBundlerDevServer
): CreateCustomMessageHandlerFn {
  return (connection) => {
    debug('Initializing for connection: ', connection.page.title);

    // Only enable the custom CDP handlers for the React Native Experimental page
    if (connection.page.title !== 'Hermes React Native') {
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

    debug(
      'Initialized with middlewares: ',
      middlewares.map((middleware) => middleware.constructor.name).join(', ')
    );

    return {
      handleDeviceMessage: (message: any) =>
        withMessageDebug(
          'device',
          message,
          middlewares.some((middleware) => middleware.handleDeviceMessage?.(message))
        ),
      handleDebuggerMessage: (message: any) => {
        withMessageDebug(
          'debugger',
          message,
          middlewares.some((middleware) => middleware.handleDebuggerMessage?.(message))
        );
      },
    };
  };
}

function withMessageDebug(type: 'device' | 'debugger', message: any, result?: null | boolean) {
  const status = result ? 'handled' : 'ignored';
  const prefix = type === 'device' ? '(debugger) <- (device)' : '(debugger) -> (device)';

  try {
    debug(`%s = %s:`, prefix, status, JSON.stringify(message));
  } catch {
    debug(`%s = %s:`, prefix, status, 'message not serializable');
  }

  return result || undefined;
}
