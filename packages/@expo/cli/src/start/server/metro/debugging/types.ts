import type { CustomMessageHandlerConnection } from '@react-native/dev-middleware';

export type Connection = CustomMessageHandlerConnection;
export type DeviceMetadata = Connection['device'];
export type DebuggerMetadata = Connection['debugger'];
export type Page = Connection['page'];
export type TargetCapabilityFlags = Page['capabilities'];

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
