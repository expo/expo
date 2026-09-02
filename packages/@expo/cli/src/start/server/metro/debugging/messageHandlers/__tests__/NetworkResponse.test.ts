import { mockConnection } from '../../__tests__/mockConnection';
import { NetworkResponseHandler, NETWORK_RESPONSE_STORAGE } from '../NetworkResponse';

afterEach(() => {
  NETWORK_RESPONSE_STORAGE.clear();
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

it('evicts the oldest entry once the storage exceeds its cap', () => {
  const connection = mockConnection();
  const handler = new NetworkResponseHandler(connection);

  // 512 is the cap; pushing 513 entries should drop the oldest.
  for (let i = 0; i < 513; i++) {
    handler.handleDeviceMessage({
      method: 'Expo(Network.receivedResponseBody)',
      params: { requestId: String(i), body: '', base64Encoded: false },
    });
  }

  expect(NETWORK_RESPONSE_STORAGE.size).toBe(512);
  expect(NETWORK_RESPONSE_STORAGE.has('0')).toBe(false);
  expect(NETWORK_RESPONSE_STORAGE.has('512')).toBe(true);
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
