import { mockConnection } from './mockConnection';
import { createHandlersFactory } from '../createHandlersFactory';
import type {
  NetworkGetResponseBody,
  NetworkReceivedResponseBody,
} from '../messageHandlers/NetworkResponse';
import { pageIsSupported } from '../pageIsSupported';
import type { DebuggerRequest, DeviceRequest } from '../types';

jest.mock('../pageIsSupported');

it('returns `null` for unsupported page', () => {
  jest.mocked(pageIsSupported).mockReturnValue(false);

  const metroBundler = { broadcastMessage: jest.fn() };
  const factory = createHandlersFactory(metroBundler);
  const connection = mockConnection();

  expect(factory(connection)).toBeNull();
});

it('returns custom handlers for supported page', () => {
  jest.mocked(pageIsSupported).mockReturnValue(true);

  const metroBundler = { broadcastMessage: jest.fn() };
  const factory = createHandlersFactory(metroBundler);
  const connection = mockConnection();

  expect(factory(connection)).toMatchObject({
    handleDeviceMessage: expect.any(Function),
    handleDebuggerMessage: expect.any(Function),
  });
});

it('can intercept device and debugger messages', () => {
  jest.mocked(pageIsSupported).mockReturnValue(true);

  const metroBundler = { broadcastMessage: jest.fn() };
  const factory = createHandlersFactory(metroBundler);
  const connection = mockConnection();
  const handlers = factory(connection);

  expect(handlers).not.toBeNull();

  // Intercepted by NetworkResponseHandler.handleDeviceMessage
  const deviceMessage: DeviceRequest<NetworkReceivedResponseBody> = {
    method: 'Expo(Network.receivedResponseBody)',
    params: { requestId: '1', base64Encoded: true, body: '' },
  };

  // Test if device message is intercepted (not sent to debugger)
  expect(handlers?.handleDeviceMessage(deviceMessage as any)).toBe(true);

  // Intercepted by NetworkResponseHandler.handleDebuggerMessage
  const debuggerMessage: DebuggerRequest<NetworkGetResponseBody> = {
    id: 420,
    method: 'Network.getResponseBody',
    params: { requestId: '1' },
  };

  // Test if debugger message is intercepted (not sent to device)
  expect(handlers?.handleDebuggerMessage(debuggerMessage as any)).toBe(true);
});
