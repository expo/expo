import { mockConnection } from '../../__tests__/mockConnection';
import { NetworkResponseHandler, NETWORK_RESPONSE_STORAGE } from '../NetworkResponse';

afterEach(() => {
  NETWORK_RESPONSE_STORAGE.clear();
});

it('is disabled when device capability includes `nativeNetworkInspection`', () => {
  // @ts-expect-error There are more capabilities, but we only care about this one
  const connection = mockConnection({ page: { capabilities: { nativeNetworkInspection: true } } });
  const handler = new NetworkResponseHandler(connection);
  expect(handler.isEnabled()).toBe(false);
});

it('is enabled when device capability is missing `nativeNetworkInspection`', () => {
  const connection = mockConnection();
  const handler = new NetworkResponseHandler(connection);
  expect(handler.isEnabled()).toBe(true);
});

it('responds to response body from device and debugger', () => {
  const connection = mockConnection();
  const handler = new NetworkResponseHandler(connection);

  // Expect the device message to be handled
  expect(
    handler.handleDeviceMessage({
      method: 'Expo(Network.receivedResponseBody)',
      params: {
        requestId: '1337',
        body: 'hello',
        base64Encoded: false,
      },
    })
  ).toBe(true);

  // Expect the debugger message to be handled
  expect(
    handler.handleDebuggerMessage({
      id: 420,
      method: 'Network.getResponseBody',
      params: { requestId: '1337' },
    })
  ).toBe(true);

  // Expect the proper response was sent
  expect(connection.debugger.sendMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 420,
      result: {
        body: 'hello',
        base64Encoded: false,
      },
    })
  );
});

it('does not respond to non-existing response', () => {
  const connection = mockConnection();
  const handler = new NetworkResponseHandler(connection);

  // Expect the debugger message to not be handled
  expect(
    handler.handleDebuggerMessage({
      id: 420,
      method: 'Network.getResponseBody',
      params: { requestId: '1337' },
    })
  ).toBe(false);

  expect(connection.debugger.sendMessage).not.toHaveBeenCalled();
});

// Known issue of the collision and will be resolved later
it('known to have response collision from global `NETWORK_RESPONSE_STORAGE`', () => {
  const connection = mockConnection();
  const handler = new NetworkResponseHandler(connection);

  // Expect the device message to be handled
  expect(
    handler.handleDeviceMessage({
      method: 'Expo(Network.receivedResponseBody)',
      params: {
        requestId: '1337',
        body: 'hello',
        base64Encoded: false,
      },
    })
  ).toBe(true);

  // Expect the debugger message to be handled
  expect(
    handler.handleDebuggerMessage({
      id: 420,
      method: 'Network.getResponseBody',
      params: { requestId: '1337' },
    })
  ).toBe(true);

  const connection2 = mockConnection();
  const handler2 = new NetworkResponseHandler(connection2);

  expect(
    handler2.handleDebuggerMessage({
      id: 420,
      method: 'Network.getResponseBody',
      params: { requestId: '1337' },
    })
  ).toBe(true);
});
