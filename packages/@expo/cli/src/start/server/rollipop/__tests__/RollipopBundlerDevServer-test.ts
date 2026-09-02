import os from 'node:os';

import { getPlatformBundlers } from '../../platformBundlers';
import { resolveAnnouncedHost, RollipopBundlerDevServer } from '../RollipopBundlerDevServer';

// Real (unmocked) behavior of the platform-bundler mapping and the dev-server
// host resolution. These encode the integration's correctness contracts:
//  - a global `--bundler` override must NOT misconfigure tvOS/macOS (Xcode
//    targets that rollipop does not build);
//  - `resolveAnnouncedHost` must pick a host-reachable address when bound to
//    0.0.0.0 so the iOS Simulator (isolated loopback) can connect.

describe(getPlatformBundlers, () => {
  it('defaults every platform to metro when no override is given', () => {
    const bundlers = getPlatformBundlers('/', {});
    expect(bundlers).toEqual({
      ios: 'metro',
      android: 'metro',
      web: 'metro',
      tvos: 'metro',
      macos: 'metro',
    });
  });

  it('applies a global --bundler override only to ios/android, never tvos/macos', () => {
    const bundlers = getPlatformBundlers('/', {}, 'rollipop');
    expect(bundlers.ios).toBe('rollipop');
    expect(bundlers.android).toBe('rollipop');
    // tvOS and macOS are Xcode-built — keep metro so native builds keep working.
    expect(bundlers.tvos).toBe('metro');
    expect(bundlers.macos).toBe('metro');
  });

  it('honors a per-platform ios.bundler when no override is set', () => {
    const bundlers = getPlatformBundlers('/', { ios: { bundler: 'rollipop' } as any });
    expect(bundlers.ios).toBe('rollipop');
    expect(bundlers.android).toBe('metro');
    expect(bundlers.tvos).toBe('metro');
    expect(bundlers.macos).toBe('metro');
  });

  it('a global override wins over a per-platform ios.bundler', () => {
    const bundlers = getPlatformBundlers('/', { ios: { bundler: 'metro' } as any }, 'rollipop');
    expect(bundlers.ios).toBe('rollipop');
  });
});

describe(resolveAnnouncedHost, () => {
  const origInterfaces = os.networkInterfaces;
  afterEach(() => {
    os.networkInterfaces = origInterfaces;
    delete process.env.ROLLIPOP_DEV_HOST;
  });

  it('returns the bind host verbatim when not bound to all interfaces', () => {
    expect(resolveAnnouncedHost('localhost')).toBe('localhost');
    expect(resolveAnnouncedHost('127.0.0.1')).toBe('127.0.0.1');
  });

  it('honors ROLLIPOP_DEV_HOST when bound to 0.0.0.0', () => {
    process.env.ROLLIPOP_DEV_HOST = '192.168.1.50';
    expect(resolveAnnouncedHost('0.0.0.0')).toBe('192.168.1.50');
  });

  it('picks the first non-internal IPv4 when bound to 0.0.0.0', () => {
    os.networkInterfaces = () => ({
      lo0: [
        {
          family: 'IPv4',
          internal: true,
          address: '127.0.0.1',
          netmask: '255.0.0.0',
          mac: '00:00',
          cidr: '127.0.0.1/8',
        },
      ],
      en0: [
        {
          family: 'IPv4',
          internal: false,
          address: '10.0.0.7',
          netmask: '255.255.255.0',
          mac: '00:00',
          cidr: '10.0.0.7/24',
        },
      ],
    });
    expect(resolveAnnouncedHost('0.0.0.0')).toBe('10.0.0.7');
  });

  it('falls back to localhost when no external interface exists', () => {
    os.networkInterfaces = () => ({
      lo0: [
        {
          family: 'IPv4',
          internal: true,
          address: '127.0.0.1',
          netmask: '255.0.0.0',
          mac: '00:00',
          cidr: '127.0.0.1/8',
        },
      ],
    });
    expect(resolveAnnouncedHost('0.0.0.0')).toBe('localhost');
  });
});

describe('message-socket relay', () => {
  const WebSocketServer = require('ws').WebSocketServer;

  it('forwards CLI-originated commands to Rollipop over the /message ws', async () => {
    const wss = new WebSocketServer({ port: 0 });
    const received: any[] = [];
    wss.on('connection', (socket: any) => {
      socket.on('message', (data: any) => received.push(JSON.parse(data.toString())));
    });

    const port: number = await new Promise((resolve) => {
      wss.on('listening', () => resolve((wss.address() as any).port));
    });
    const host = '127.0.0.1';

    // The relay methods are private; exercise them through a typed cast.
    const server = new RollipopBundlerDevServer('/', {
      ios: 'rollipop',
      android: 'rollipop',
      web: 'webpack',
      tvos: 'metro',
      macos: 'metro',
    } as any) as any;
    await server.connectMessageSocket(host, port);
    expect(server.messageSocketClient).not.toBeNull();

    const socket = server.createMessageSocket();
    socket.broadcast('reload', { foo: 'bar' });
    socket.broadcast('devMenu');

    // Give the ws a tick to deliver.
    await new Promise((r) => setTimeout(r, 50));

    expect(received).toContainEqual({ type: 'reload', data: { foo: 'bar' } });
    expect(received).toContainEqual({ type: 'devMenu', data: {} });
    expect(socket.getClientCount()).toBe(1);

    server.messageSocketClient?.close();
    wss.close();
  });

  it('broadcast is a safe no-op when the relay is not connected', () => {
    const server = new RollipopBundlerDevServer('/', {
      ios: 'rollipop',
      android: 'rollipop',
      web: 'webpack',
      tvos: 'metro',
      macos: 'metro',
    } as any) as any;
    const socket = server.createMessageSocket();
    expect(() => socket.broadcast('reload')).not.toThrow();
    expect(socket.getClientCount()).toBe(0);
  });
});
