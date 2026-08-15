import type { CreateCustomMessageHandlerFn } from '@react-native/dev-middleware';

import { event } from '../inspectorEvents';
import { NetworkResponseHandler } from './messageHandlers/NetworkResponse';
import { VscodeDebuggerGetPossibleBreakpointsHandler } from './messageHandlers/VscodeDebuggerGetPossibleBreakpoints';
import { VscodeDebuggerSetBreakpointByUrlHandler } from './messageHandlers/VscodeDebuggerSetBreakpointByUrl';
import { VscodeRuntimeCallFunctionOnHandler } from './messageHandlers/VscodeRuntimeCallFunctionOn';
import { VscodeRuntimeEvaluateHandler } from './messageHandlers/VscodeRuntimeEvaluate';
import { VscodeRuntimeGetPropertiesHandler } from './messageHandlers/VscodeRuntimeGetProperties';
import { pageIsSupported } from './pageIsSupported';

export function createHandlersFactory(): CreateCustomMessageHandlerFn {
  return (connection) => {
    event('handler_init', { title: connection.page.title });

    if (!pageIsSupported(connection.page)) {
      event('handler_unsupported', { title: connection.page.title });
      return null;
    }

    const handlers = [
      // Generic handlers
      new NetworkResponseHandler(connection),
      // Vscode-specific handlers
      new VscodeDebuggerGetPossibleBreakpointsHandler(connection),
      new VscodeDebuggerSetBreakpointByUrlHandler(connection),
      new VscodeRuntimeGetPropertiesHandler(connection),
      new VscodeRuntimeCallFunctionOnHandler(connection),
      new VscodeRuntimeEvaluateHandler(connection),
    ].filter((middleware) => middleware.isEnabled());

    if (!handlers.length) {
      event('handler_all_disabled', {});
      return null;
    }

    event('handler_ready', { handlers: handlers.map((m) => m.constructor.name).join(', ') });

    return {
      handleDeviceMessage: (message: any) =>
        withMessageDebug(
          'device',
          message,
          handlers.some((middleware) => middleware.handleDeviceMessage?.(message))
        ),
      handleDebuggerMessage: (message: any) =>
        withMessageDebug(
          'debugger',
          message,
          handlers.some((middleware) => middleware.handleDebuggerMessage?.(message))
        ),
    };
  };
}

function withMessageDebug(_type: 'device' | 'debugger', _message: any, result?: null | boolean) {
  return result || undefined;
}
