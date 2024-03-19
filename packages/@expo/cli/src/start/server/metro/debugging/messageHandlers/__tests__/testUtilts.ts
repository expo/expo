import type WS from 'ws';

import type { Connection } from '../../types';

type PartialConnection = {
  page?: Partial<Connection['page']>;
  debuggerInfo?: Partial<Connection['debuggerInfo']>;
  deviceInfo?: Partial<Connection['deviceInfo']>;
};

export function mockConnection(connection: PartialConnection = {}): Connection {
  return {
    page: {
      id: 'test-page-id',
      title: 'test-page',
      vm: 'test-vm',
      app: 'test-app',
      capabilities: {},
      ...(connection.page || {}),
    },
    debuggerInfo: {
      socket: { send: jest.fn() } as unknown as WS,
      userAgent: 'test-user-agent',
      ...(connection.debuggerInfo || {}),
    },
    deviceInfo: {
      id: 'test-device-id',
      name: 'test-device',
      appId: 'test-app',
      socket: { send: jest.fn() } as unknown as WS,
      ...(connection.deviceInfo || {}),
    },
  };
}
