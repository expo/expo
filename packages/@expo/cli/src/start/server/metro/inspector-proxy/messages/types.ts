import { DebuggerInfo } from 'metro-inspector-proxy';
import type WS from 'ws';

/**
 * The outline of a basic Chrome DevTools Protocol request, either from device or debugger.
 * Both the request and response parameters could be optional.
 */
export type CdpMessage<
  Method extends string = string,
  Request extends object = object,
  Response extends object = object
> = {
  method: Method;
  params: Request;
  result: Response;
};

export type DeviceRequest<M extends CdpMessage> = Pick<M, 'method' | 'params'>;

export type DebuggerRequest<M extends CdpMessage> = { id: number } & Pick<M, 'method' | 'params'>;
export type DebuggerResponse<M extends CdpMessage> = M['result'];

export interface InspectorHandler<Device extends CdpMessage, Debugger extends CdpMessage> {
  onDeviceMessage(request: DeviceRequest<Device>, debuggerInfo: DebuggerInfo): void;
  onDebuggerMessage(
    request: DebuggerRequest<Debugger>,
    debuggerInfo: DebuggerInfo,
    socket: WS
  ): void | DebuggerResponse<Debugger>;
}
