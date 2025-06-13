export interface DevtoolsApp {
  /** Unique device ID combined with the page ID */
  id: string;
  /** Information about the underlying CDP implementation, e.g. "React Native Bridgeless [C++ connection]" */
  title: string;
  /** The application ID that is currently running on the device, e.g. "dev.expo.bareexpo" */
  appId: string;
  /** The description of the runtime, e.g. "React Native Bridgeless [C++ connection]" */
  description: string;
  /** The internal `devtools://..` URL for the debugger to connect to */
  devtoolsFrontendUrl: string;
  /** The websocket URL for the debugger to connect to */
  webSocketDebuggerUrl: string;
  /**
   * Human-readable device name
   * @since react-native@0.73
   */
  deviceName: string;
}
