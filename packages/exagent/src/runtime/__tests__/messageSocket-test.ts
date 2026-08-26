import type WebSocketImpl from 'ws';

import {
  connectMessageSocketAsync,
  MESSAGE_SOCKET_ENDPOINT,
  MESSAGE_SOCKET_PROTOCOL_VERSION,
  peersChanged,
  resolveMessageSocketUrl,
} from '../messageSocket';
import { MockWebSocket } from './MockWebSocket';

/** A responder that answers `getpeers` with a fixed peer map, the way the dev server does. */
function peerResponder(peers: Record<string, string | null>, version = 2) {
  return (request: any, socket: MockWebSocket) => {
    if (request.method === 'getpeers' && request.target === 'server') {
      socket.emit('message', JSON.stringify({ id: request.id, result: peers, version }));
    }
  };
}

/** A mock that records what was written to it, synchronously, before the responder runs. */
class RecordingWebSocket extends MockWebSocket {
  constructor(
    url: string,
    responder: (request: any, socket: MockWebSocket) => void,
    private readonly sent: any[]
  ) {
    super(url, responder);
  }

  override send(payload: string) {
    this.sent.push(JSON.parse(payload));
    super.send(payload);
  }
}

function connect(
  responder: (request: any, socket: MockWebSocket) => void,
  sent: any[] = [],
  url = 'http://127.0.0.1:8081'
) {
  return connectMessageSocketAsync(url, {
    createWebSocket: (target) =>
      new RecordingWebSocket(target, responder, sent) as unknown as WebSocketImpl,
  });
}

describe(resolveMessageSocketUrl, () => {
  it(`should turn a dev server origin into the message endpoint`, () => {
    expect(resolveMessageSocketUrl('http://127.0.0.1:8170')).toBe('ws://127.0.0.1:8170/message');
  });

  it(`should use wss for an https dev server`, () => {
    expect(resolveMessageSocketUrl('https://dev.example.com')).toBe(
      'wss://dev.example.com/message'
    );
  });

  it(`should tolerate a trailing slash`, () => {
    expect(resolveMessageSocketUrl('http://127.0.0.1:8170/')).toBe('ws://127.0.0.1:8170/message');
  });

  it(`should name the endpoint the dev server mounts`, () => {
    expect(MESSAGE_SOCKET_ENDPOINT).toBe('/message');
  });
});

describe(connectMessageSocketAsync, () => {
  // The protocol version is the whole difference between a delivered command and a silently
  // dropped one, so it is asserted on the wire rather than trusted.
  it(`should stamp every message with the protocol version`, async () => {
    const sent: any[] = [];
    const socket = await connect(peerResponder({ 'socket#1': 'role=ios' }), sent);

    await socket.getPeersAsync({ timeoutMs: 50 });
    socket.broadcastReload();
    socket.close();

    expect(sent).toHaveLength(2);
    for (const message of sent) {
      expect(message.version).toBe(MESSAGE_SOCKET_PROTOCOL_VERSION);
    }
    expect(MESSAGE_SOCKET_PROTOCOL_VERSION).toBe(2);
  });

  it(`should broadcast reload with no id and no target, which is what makes it a broadcast`, async () => {
    const sent: any[] = [];
    const socket = await connect(peerResponder({}), sent);

    socket.broadcastReload();
    socket.close();

    expect(sent[0]).toEqual({ version: 2, method: 'reload' });
    expect(sent[0]).not.toHaveProperty('id');
    expect(sent[0]).not.toHaveProperty('target');
  });

  it(`should read the peers the dev server reports`, async () => {
    const socket = await connect(peerResponder({ 'socket#3': 'role=ios', 'socket#4': null }));

    await expect(socket.getPeersAsync({ timeoutMs: 50 })).resolves.toEqual({
      'socket#3': 'role=ios',
      'socket#4': null,
    });
    socket.close();
  });

  // A dev server whose protocol version this client does not speak drops the request without an
  // error, so silence is the only signal there is — and it must not read as "no peers".
  it(`should answer null when the request is not replied to`, async () => {
    const socket = await connect(() => {});

    await expect(socket.getPeersAsync({ timeoutMs: 30 })).resolves.toBeNull();
    socket.close();
  });

  it(`should answer null when the reply carries another protocol version`, async () => {
    const socket = await connect(peerResponder({ 'socket#1': 'role=ios' }, 99));

    await expect(socket.getPeersAsync({ timeoutMs: 30 })).resolves.toBeNull();
    socket.close();
  });

  it(`should match a reply to the request that asked for it`, async () => {
    const socket = await connect((request, mock) => {
      mock.emit(
        'message',
        JSON.stringify({ id: 'someone-elses-request', result: { a: null }, version: 2 })
      );
      mock.emit('message', JSON.stringify({ id: request.id, result: { mine: null }, version: 2 }));
    });

    await expect(socket.getPeersAsync({ timeoutMs: 50 })).resolves.toEqual({ mine: null });
    socket.close();
  });
});

describe(peersChanged, () => {
  // The dev server's socket ids come from a counter that never reuses a value, so a changed id is
  // proof of a new connection rather than a heuristic.
  it(`should report a change when a peer reconnected under a new id`, () => {
    expect(peersChanged({ 'socket#7': 'role=ios' }, { 'socket#10': 'role=ios' })).toBe(true);
  });

  it(`should report no change when the same ids are still connected`, () => {
    expect(
      peersChanged(
        { 'socket#7': 'role=ios', 'socket#8': null },
        { 'socket#7': 'role=ios', 'socket#8': null }
      )
    ).toBe(false);
  });

  it(`should report a change when a peer went away and did not come back`, () => {
    expect(peersChanged({ 'socket#7': 'role=ios' }, {})).toBe(true);
  });

  // Either side unknown means the comparison was never made, which is not evidence of a change.
  it(`should answer null when either side is unknown`, () => {
    expect(peersChanged(null, { 'socket#1': null })).toBeNull();
    expect(peersChanged({ 'socket#1': null }, null)).toBeNull();
  });
});
