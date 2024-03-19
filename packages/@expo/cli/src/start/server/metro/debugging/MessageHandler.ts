import type {
  Connection,
  DebuggerMetadata,
  DebuggerRequest,
  DebuggerResponse,
  DeviceMetadata,
  DeviceRequest,
  DeviceResponse,
  Page,
} from './types';

export abstract class MessageHandler {
  protected page: Page;
  protected device: DeviceMetadata;
  protected debugger: DebuggerMetadata;

  constructor(connection: Connection) {
    this.page = connection.page;
    this.device = connection.device;
    this.debugger = connection.debugger;
  }

  /** Determine if this middleware should be enabled or disabled, based on the page capabilities */
  isEnabled(): boolean {
    return true;
  }

  /** Send a message directly to the device */
  sendToDevice<T = DeviceResponse | DebuggerResponse>(message: T): true {
    // @ts-expect-error Type `T` is json serializable, just not the same one from `@react-native/dev-middleware`
    this.device.sendMessage(message);
    return true;
  }

  /** Send a message directly to the debugger */
  sendToDebugger<T = DeviceResponse | DebuggerResponse>(message: T): true {
    // @ts-expect-error Type `T` is json serializable, just not the same one from `@react-native/dev-middleware`
    this.debugger.sendMessage(message);
    return true;
  }

  /**
   * Intercept a message coming from the device, modify or respond to it through `this._sendMessageToDevice`.
   * Return `true` if the message was handled, this will stop the message propagation.
   */
  handleDeviceMessage?(message: DeviceRequest | DeviceResponse): boolean;

  /**
   * Intercept a message coming from the debugger, modify or respond to it through `socket.send`.
   * Return `true` if the message was handled, this will stop the message propagation.
   */
  handleDebuggerMessage?(message: DebuggerRequest | DebuggerResponse): boolean;
}
