import { NetworkResponseHandler } from '../NetworkRespose';

describe(NetworkResponseHandler, () => {
  it('returns response data by request id', () => {
    const handler = new NetworkResponseHandler();
    const responseData = {
      body: 'hello',
      base64Encoded: false,
    };

    handler.onDeviceMessage({
      method: 'Expo(Network.receivedResponseBody)',
      params: { requestId: '1337', ...responseData },
    });

    const response = handler.onDebuggerMessage({
      id: 420,
      method: 'Network.getResponseBody',
      params: { requestId: '1337' },
    });

    expect(response).toMatchObject(responseData);
  });

  it('returns null request id is not found', () => {
    const handler = new NetworkResponseHandler();
    const response = handler.onDebuggerMessage({
      id: 420,
      method: 'Network.getResponseBody',
      params: { requestId: '1337' },
    });

    expect(response).toBeNull();
  });
});
