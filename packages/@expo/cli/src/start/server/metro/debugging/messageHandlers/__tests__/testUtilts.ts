import type { Connection } from '../../types';

export function mockConnection(connection: Partial<Connection> = {}): Connection {
  return {
    page: {
      id: 'test-page-id',
      title: 'test-page',
      vm: 'test-vm',
      app: 'test-app',
      capabilities: {},
      ...(connection.page || {}),
    },
    debugger: {
      sendMessage: jest.fn(),
      userAgent: 'test-user-agent',
      ...(connection.debuggerInfo || {}),
    },
    device: {
      id: 'test-device-id',
      name: 'test-device',
      appId: 'test-app',
      sendMessage: jest.fn(),
      ...(connection.deviceInfo || {}),
    },
  };
}
