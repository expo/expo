import { once } from 'node:events';
import type { WebSocket } from 'ws';

import { waitForExpect, withMetroServer } from './utils';
import { Log } from '../../../../../log';
import { createMessagesSocket } from '../createMessageSocket';
import { serializeMessage } from '../utils/socketMessages';

jest.mock('../../../../../log');

describe(createMessagesSocket, () => {
  const { metro, server } = withMetroServer();

  it('handles broadcast socket messages', async () => {
    const client1 = server.connect('/message');
    const client2 = server.connect('/message');

    // Wait until the sockets are connected
    await Promise.all([once(client1, 'open'), once(client2, 'open')]);

    // Add listeners to intercept messages
    const client1Listener = jest.fn();
    const client2Listener = jest.fn();
    client1.on('message', client1Listener);
    client2.on('message', client2Listener);

    // Create and send the broadcast message from client1
    const message = serializeMessage({ method: 'reload' });
    client1.send(message);

    // Ensure both clients received the message
    await waitForExpect(() => {
      expect(client2Listener).toHaveBeenCalled();
      expect(client2Listener.mock.calls[0][0]).toBeInstanceOf(Buffer);
      expect(client2Listener.mock.calls[0][0].toString()).toBe(message);

      expect(client1Listener).toHaveBeenCalled();
      expect(client1Listener.mock.calls[0][0]).toBeInstanceOf(Buffer);
      expect(client1Listener.mock.calls[0][0].toString()).toBe(message);
    });
  });

  it('exported broadcast method broadcasts messages', async () => {
    const client1 = server.connect('/message');
    const client2 = server.connect('/message');

    // Wait until the sockets are connected
    await Promise.all([once(client1, 'open'), once(client2, 'open')]);

    // Add listeners to intercept the broadcast
    const client1Listener = jest.fn();
    const client2Listener = jest.fn();
    client1.on('message', client1Listener);
    client2.on('message', client2Listener);

    // Broadcast a message using the exported method
    metro.messagesSocket.broadcast('reload', { extra: 'data' });

    // Ensure the receivers received the message
    await waitForExpect(() => {
      expect(client1Listener).toHaveBeenCalled();
      expect(client1Listener.mock.calls[0][0]).toBeInstanceOf(Buffer);
      expect(JSON.parse(client1Listener.mock.calls[0][0].toString())).toMatchObject({
        method: 'reload',
        params: { extra: 'data' },
      });

      expect(client2Listener).toHaveBeenCalled();
      expect(client2Listener.mock.calls[0][0]).toBeInstanceOf(Buffer);
      expect(JSON.parse(client2Listener.mock.calls[0][0].toString())).toMatchObject({
        method: 'reload',
        params: { extra: 'data' },
      });
    });
  });

  it('warns when broadcasting to no clients', async () => {
    // Broadcast a message with no connected clients
    metro.messagesSocket.broadcast('test');

    // Ensure the warning was logged
    await waitForExpect(() => {
      expect(Log.warn).toHaveBeenCalledWith(expect.stringContaining('No apps connected'));
    });
  });

  it('handles `getid` server request', async () => {
    const client = server.connect('/message');
    // Wait until the socket is connected
    await once(client, 'open');
    // Request the client ID through the test helper
    const clientId = await requestClientId(client, 'test#1');
    // Ensure the client ID is received
    expect(clientId).toContain('#');
  });

  it('handles `getpeers` server request', async () => {
    // Connect clients with different query parameters
    const client1 = server.connect('/message?test=data');
    const client2 = server.connect('/message?request=sender');
    const client3 = server.connect('/message?other=test');

    // Wait until the sockets are connected
    await Promise.all([once(client1, 'open'), once(client2, 'open'), once(client3, 'open')]);

    // Fetch the client IDs of all clients
    const [client1Id, client2Id, client3Id] = await Promise.all([
      requestClientId(client1, 'getpeers#client1'),
      requestClientId(client2, 'getpeers#client2'),
      requestClientId(client3, 'getpeers#client3'),
    ]);

    // Add listener to client2 for the getpeers response
    const client2Listener = jest.fn();
    client2.on('message', client2Listener);

    // Create and send the `getpeers` request from client 2
    client2.send(serializeMessage({ id: 'testid#2', method: 'getpeers', target: 'server' }));

    // Ensure client2 received the response
    await waitForExpect(() => {
      expect(client2Listener).toHaveBeenCalled();
      expect(client2Listener.mock.calls[0][0]).toBeInstanceOf(Buffer);

      const message = JSON.parse(client2Listener.mock.calls[0][0].toString());
      expect(message).toMatchObject({
        id: 'testid#2',
        result: expect.objectContaining({
          [client1Id]: 'test=data',
          [client3Id]: 'other=test',
        }),
      });
      expect(message.result).not.toHaveProperty(client2Id);
    });
  });

  it('forwards requests and responses to target clients', async () => {
    const client1 = server.connect('/message');
    const client2 = server.connect('/message');

    // Wait until the sockets are connected
    await Promise.all([once(client1, 'open'), once(client2, 'open')]);

    // Fetch the client IDs of both
    const [client1Id, client2Id] = await Promise.all([
      requestClientId(client1, 'requestresponse#client1'),
      requestClientId(client2, 'requestresponse#client2'),
    ]);

    // Add listeners to intercept messages
    const client1Listener = jest.fn();
    const client2Listener = jest.fn();
    client1.on('message', client1Listener);
    client2.on('message', client2Listener);

    // Create and send a request from client1 to client2
    const request = {
      id: 'testrequest#1',
      method: 'testrequest',
      params: { extra: 'data' },
      target: client2Id,
    };
    client1.send(serializeMessage(request));

    // Ensure client2 received the message
    await waitForExpect(() => {
      expect(client2Listener).toHaveBeenCalled();
      expect(client2Listener.mock.calls[0][0]).toBeInstanceOf(Buffer);
      expect(JSON.parse(client2Listener.mock.calls[0][0].toString())).toMatchObject({
        method: request.method,
        params: request.params,
        id: expect.objectContaining({
          requestId: request.id,
          clientId: client1Id,
        }),
      });
    });

    // Create and send a response from client2 to client1
    const response = {
      id: { requestId: request.id, clientId: client1Id },
      result: { received: 'message' },
    };
    client2.send(serializeMessage(response));

    // Ensure client1 received the response
    await waitForExpect(() => {
      expect(client1Listener).toHaveBeenCalled();
      expect(client1Listener.mock.calls[0][0]).toBeInstanceOf(Buffer);
      expect(JSON.parse(client1Listener.mock.calls[0][0].toString())).toMatchObject({
        id: response.id.requestId,
        result: response.result,
      });
    });
  });
});

async function requestClientId(client: WebSocket, testId = 'requestclientid') {
  // Send the `getid` server request
  client.send(serializeMessage({ id: testId, method: 'getid', target: 'server' }));

  // Listen for the client ID response
  const [data] = await once(client, 'message');
  const message = JSON.parse(data.toString());

  // Only return the client ID if it matches the test ID
  if (message.id === testId) {
    return message.result;
  }

  throw new Error(`Received unexpected message when fetching client id: ${data}`);
}
