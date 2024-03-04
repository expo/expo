import { NetworkResponseMiddleware } from './deviceMiddlewares/NetworkResponse';
import { PageReloadMiddleware } from './deviceMiddlewares/PageReload';
import { VscodeDebuggerGetPossibleBreakpointsMiddleware } from './deviceMiddlewares/VscodeDebuggerGetPossibleBreakpoints';
import { VscodeDebuggerSetBreakpointByUrlMiddleware } from './deviceMiddlewares/VscodeDebuggerSetBreakpointByUrl';
import { VscodeRuntimeCallFunctionOnMiddleware } from './deviceMiddlewares/VscodeRuntimeCallFunctionOn';
import { VscodeRuntimeGetPropertiesMiddleware } from './deviceMiddlewares/VscodeRuntimeGetProperties';
import type { DeviceMiddleware, Connection } from './deviceMiddlewares/types';
import type { MetroBundlerDevServer } from '../MetroBundlerDevServer';

// TODO: use `@react-native/dev-middleware` type
export function createDeviceMiddlewareFactory(
  metroBundler: MetroBundlerDevServer
): (
  connection: Connection
) => Pick<
  InstanceType<typeof DeviceMiddleware>,
  'handleDeviceMessage' | 'handleDebuggerMessage'
> | null {
  return (connection) => {
    if (connection.page.title !== 'React Native Experimental (Improved Chrome Reloads)') {
      return null;
    }

    const middlewares = [
      // Generic handlers
      new NetworkResponseMiddleware(connection),
      new PageReloadMiddleware(connection, metroBundler),
      // Vscode-specific handlers
      new VscodeDebuggerGetPossibleBreakpointsMiddleware(connection),
      new VscodeDebuggerSetBreakpointByUrlMiddleware(connection),
      new VscodeRuntimeGetPropertiesMiddleware(connection),
      new VscodeRuntimeCallFunctionOnMiddleware(connection),
    ].filter((middleware) => middleware.isEnabled());

    return {
      handleDeviceMessage: (message: any) =>
        middlewares.some((middleware) => middleware.handleDeviceMessage?.(message) ?? false),
      handleDebuggerMessage: (message: any) =>
        middlewares.some((middleware) => middleware.handleDebuggerMessage?.(message) ?? false),
    };
  };
}
