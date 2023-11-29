import { unstable_Device } from '@react-native/dev-middleware';

declare module '@react-native/dev-middleware' {
  type DebuggerInfo = NonNullable<unstable_Device['_debuggerConnection']>;
  type DebuggerRequest = Parameters<unstable_Device['_interceptMessageFromDebugger']>[0];
}
