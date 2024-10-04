import type { unstable_Device } from '@react-native/dev-middleware';

// @ts-expect-error until we sort out an issue with private members
export type DebuggerMetadata = NonNullable<unstable_Device['_debuggerConnection']>;

export interface InspectorHandler {
  /**
   * Intercept a message coming from the device, modify or respond to it through `this._sendMessageToDevice`.
   * Return `true` if the message was handled, this will stop the message propagation.
   */
  onDeviceMessage?(message: DeviceRequest | DeviceResponse, info: DebuggerMetadata): boolean;

  /**
   * Intercept a message coming from the debugger, modify or respond to it through `socket.send`.
   * Return `true` if the message was handled, this will stop the message propagation.
   */
  onDebuggerMessage?(message: DebuggerRequest, info: DebuggerMetadata): boolean;
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
