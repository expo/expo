import type { CustomMessageHandlerConnection } from '@react-native/dev-middleware';

export type Connection = CustomMessageHandlerConnection;
export type DeviceMetadata = Connection['device'];
export type DebuggerMetadata = Connection['debugger'];
export type Page = Connection['page'];
export type TargetCapabilityFlags = Page['capabilities'];

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
    this.device.sendMessage(JSON.stringify(message));
    return true;
  }

  /** Send a message directly to the debugger */
  sendToDebugger<T = DeviceResponse | DebuggerResponse>(message: T): true {
    this.debugger.sendMessage(JSON.stringify(message));
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

/**
 * The outline of a basic Chrome DevTools Protocol request, either from device or debugger.
 * Both the request and response parameters could be optional, use `never` to enforce these fields.
 */
export type CdpMessage<
  Method extends string = string,
  Request extends object = object,
  Response extends object = object,
> = {
  id: number;
  method: Method;
  params: Request;
  result: Response;
};

export type DeviceRequest<M extends CdpMessage = CdpMessage> = Pick<M, 'method' | 'params'>;
export type DeviceResponse<M extends CdpMessage = CdpMessage> = Pick<M, 'id' | 'result'>;

export type DebuggerRequest<M extends CdpMessage = CdpMessage> = Pick<
  M,
  'id' | 'method' | 'params'
>;
export type DebuggerResponse<M extends CdpMessage = CdpMessage> = Pick<M, 'result'>;
