import { NetworkResponseHandler } from '../NetworkResponse';

it('responds to response body from device and debugger', () => {
  const handler = new NetworkResponseHandler();
  const debuggerSocket = { send: jest.fn() };

  // Expect the device message to be handled
  expect(
    handler.onDeviceMessage({
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
    handler.onDebuggerMessage(
      {
        id: 420,
        method: 'Network.getResponseBody',
        params: { requestId: '1337' },
      },
      { socket: debuggerSocket }
    )
  ).toBe(true);

  // Expect the proper response was sent
  expect(debuggerSocket.send).toBeCalledWith(
    JSON.stringify({
      id: 420,
      result: {
        body: 'hello',
        base64Encoded: false,
      },
    })
  );
});

it('does not respond to non-existing response', () => {
  const handler = new NetworkResponseHandler();
  const debuggerSocket = { send: jest.fn() };

  // Expect the debugger message to not be handled
  expect(
    handler.onDebuggerMessage(
      {
        id: 420,
        method: 'Network.getResponseBody',
        params: { requestId: '1337' },
      },
      { socket: debuggerSocket }
    )
  ).toBe(false);

  expect(debuggerSocket.send).not.toBeCalled();
});
