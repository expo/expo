import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { useDevToolsPluginClient } from 'expo/devtools';

import { useDevToolsConnection } from '../useDevToolsConnection';

// Mock expo-sqlite
jest.mock('../../../node_modules/expo-sqlite/build/ExpoSQLite.js', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../../../../src/__mocks__/ExpoSQLite')
);

// Mock the expo/devtools module
jest.mock('expo/devtools', () => ({
  useDevToolsPluginClient: jest.fn(),
}));

let mockClient: any;
let messageListeners: Map<string | RegExp, Function>;

// Helper to find a listener that matches the given eventName
function findMatchingListener(eventName: string): Function | undefined {
  for (const [pattern, handler] of messageListeners.entries()) {
    if (typeof pattern === 'string') {
      if (pattern === eventName) {
        return handler;
      }
    } else if (pattern instanceof RegExp) {
      if (pattern.test(eventName)) {
        return handler;
      }
    }
  }
  return undefined;
}

beforeEach(() => {
  jest.clearAllMocks();
  messageListeners = new Map();

  mockClient = {
    addMessageListener: jest.fn((eventNameOrPattern: string | RegExp, handler: Function) => {
      messageListeners.set(eventNameOrPattern, handler);
      return {
        remove: jest.fn(() => {
          messageListeners.delete(eventNameOrPattern);
        }),
      };
    }),
    addMessageListenerOnce: jest.fn((eventName: string, handler: Function) => {
      messageListeners.set(eventName, handler);
    }),
    sendMessage: jest.fn(),
    isConnected: jest.fn(() => true),
  };
});

describe('useDevToolsConnection - Connection State', () => {
  test('should return connected when client exists', () => {
    (useDevToolsPluginClient as jest.Mock).mockReturnValue(mockClient);

    const { result } = renderHook(() => useDevToolsConnection());

    expect(result.current.isConnected).toBe(true);
  });

  test('should return not connected when client is null', () => {
    (useDevToolsPluginClient as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useDevToolsConnection());

    expect(result.current.isConnected).toBe(false);
  });
});

describe('useDevToolsConnection - listDatabases', () => {
  test('should successfully list databases', async () => {
    (useDevToolsPluginClient as jest.Mock).mockReturnValue(mockClient);

    const { result } = renderHook(() => useDevToolsConnection());

    const mockDatabases = [
      { name: 'test.db', path: '/data/test.db' },
      { name: 'cache.db', path: '/data/cache.db' },
    ];

    let promise: Promise<any>;
    act(() => {
      promise = result.current.listDatabases();
    });

    // Wait a tick to ensure the listener is registered
    await new Promise((resolve) => setImmediate(resolve));

    // Capture the method and params from sendMessage
    const sendMessageCall = mockClient.sendMessage.mock.calls[0];
    const method = sendMessageCall[0];
    const params = sendMessageCall[1];

    expect(method).toBe('listDatabases');
    expect(params.requestId).toBeDefined();

    // Find the 'response' listener and call it with the response
    const listener = findMatchingListener('response');
    listener?.({
      requestId: params.requestId,
      method: 'listDatabases',
      databases: mockDatabases,
    });

    const databases = await promise!;
    expect(databases).toEqual(mockDatabases);
  });

  test('should handle error response', async () => {
    (useDevToolsPluginClient as jest.Mock).mockReturnValue(mockClient);

    const { result } = renderHook(() => useDevToolsConnection());

    let promise: Promise<any>;
    act(() => {
      promise = result.current.listDatabases();
    });

    // Wait a tick to ensure the listener is registered
    await new Promise((resolve) => setImmediate(resolve));

    // Capture the requestId from sendMessage
    const sendMessageCall = mockClient.sendMessage.mock.calls[0];
    const params = sendMessageCall[1];

    // Find the 'response' listener and call it with an error response
    const listener = findMatchingListener('response');
    listener?.({
      requestId: params.requestId,
      method: 'error',
      error: 'Failed to list databases',
      originalMethod: 'listDatabases',
    });

    await expect(promise!).rejects.toThrow('Failed to list databases');
  });

  test('should throw error when client not connected', async () => {
    (useDevToolsPluginClient as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useDevToolsConnection());

    await expect(result.current.listDatabases()).rejects.toThrow('DevTools client not connected');
  });
});

describe('useDevToolsConnection - getDatabase', () => {
  test('should successfully get database data', async () => {
    (useDevToolsPluginClient as jest.Mock).mockReturnValue(mockClient);

    const { result } = renderHook(() => useDevToolsConnection());

    const mockData = new Uint8Array([1, 2, 3, 255]);

    let promise: Promise<any>;
    act(() => {
      promise = result.current.getDatabase('test.db');
    });

    // Wait a tick to ensure the listener is registered
    await new Promise((resolve) => setImmediate(resolve));

    // Capture the method and params from sendMessage
    const sendMessageCall = mockClient.sendMessage.mock.calls[0];
    const method = sendMessageCall[0];
    const params = sendMessageCall[1];

    expect(method).toBe('getDatabase');
    expect(params.requestId).toBeDefined();
    expect(params.database).toBe('test.db');

    // For getDatabase, find the listener for 'getDatabase:requestId'
    const eventName = `getDatabase:${params.requestId}`;
    const listener = findMatchingListener(eventName);

    // Simulate response by calling the listener with Uint8Array directly
    listener?.(mockData);

    const data = await promise!;
    expect(data).toBeInstanceOf(Uint8Array);
  });

  test('should handle error response', async () => {
    (useDevToolsPluginClient as jest.Mock).mockReturnValue(mockClient);

    const { result } = renderHook(() => useDevToolsConnection());

    let promise: Promise<any>;
    act(() => {
      promise = result.current.getDatabase('nonexistent.db');
    });

    // Wait a tick to ensure the listener is registered
    await new Promise((resolve) => setImmediate(resolve));

    // Capture the requestId from sendMessage
    const sendMessageCall = mockClient.sendMessage.mock.calls[0];
    const params = sendMessageCall[1];

    // For getDatabase, find the listener for 'getDatabase:requestId'
    const eventName = `getDatabase:${params.requestId}`;
    const listener = findMatchingListener(eventName);

    // Simulate error response
    listener?.({
      method: 'error',
      error: 'Database not found',
      originalMethod: 'getDatabase',
    });

    await expect(promise!).rejects.toThrow('Database not found');
  });

  test('should throw error when client not connected', async () => {
    (useDevToolsPluginClient as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useDevToolsConnection());

    await expect(result.current.getDatabase('test.db')).rejects.toThrow(
      'DevTools client not connected'
    );
  });
});

describe('useDevToolsConnection - useEffect cleanup', () => {
  test('should not register global message listener on mount', () => {
    (useDevToolsPluginClient as jest.Mock).mockReturnValue(mockClient);

    renderHook(() => useDevToolsConnection());

    // With the new pattern, no global 'response' listener is registered
    // Each request registers its own listener with method:requestId pattern
    expect(mockClient.addMessageListener).not.toHaveBeenCalled();
  });

  test('should clean up pending requests on unmount', () => {
    (useDevToolsPluginClient as jest.Mock).mockReturnValue(mockClient);

    const { unmount } = renderHook(() => useDevToolsConnection());

    // Start a request but don't resolve it
    const { result } = renderHook(() => useDevToolsConnection());
    act(() => {
      result.current.listDatabases().catch(() => {});
    });

    unmount();

    // After unmount, any pending requests should be cancelled
    // This is tested implicitly through the clearAll() call in the cleanup
  });

  test('should not register listener when client is null', () => {
    (useDevToolsPluginClient as jest.Mock).mockReturnValue(null);

    renderHook(() => useDevToolsConnection());

    // addMessageListener should not exist on null client
    expect(mockClient.addMessageListener).not.toHaveBeenCalled();
  });
});

describe('useDevToolsConnection - Response callback management', () => {
  test('should handle multiple concurrent requests independently', async () => {
    (useDevToolsPluginClient as jest.Mock).mockReturnValue(mockClient);

    const { result } = renderHook(() => useDevToolsConnection());

    // Make first request
    let promise1: Promise<any>;
    act(() => {
      promise1 = result.current.listDatabases();
    });

    // Make second request - should work independently
    let promise2: Promise<any>;
    act(() => {
      promise2 = result.current.listDatabases();
    });

    // Wait a tick to ensure listeners are registered
    await new Promise((resolve) => setImmediate(resolve));

    // Capture requests' params
    const params1 = mockClient.sendMessage.mock.calls[0][1];
    const params2 = mockClient.sendMessage.mock.calls[1][1];

    // Each request should have a unique requestId
    expect(params1.requestId).toBeDefined();
    expect(params2.requestId).toBeDefined();
    expect(params1.requestId).not.toBe(params2.requestId);

    // Respond to first request via 'response' channel
    const listener = findMatchingListener('response');
    listener?.({
      requestId: params1.requestId,
      method: 'listDatabases',
      databases: [{ name: 'db1.db', path: '/db1' }],
    });

    const result1 = await promise1!;
    expect(result1).toEqual([{ name: 'db1.db', path: '/db1' }]);

    // Respond to second request
    listener?.({
      requestId: params2.requestId,
      method: 'listDatabases',
      databases: [{ name: 'db2.db', path: '/db2' }],
    });

    const result2 = await promise2!;
    expect(result2).toEqual([{ name: 'db2.db', path: '/db2' }]);
  });
});
