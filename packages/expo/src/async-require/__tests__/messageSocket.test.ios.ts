jest.mock('../../utils/getDevServer', () => ({
  __esModule: true,
  default: () => ({ bundleLoadedFromServer: true, url: 'http://localhost:8081/' }),
}));

const globals = globalThis as {
  WebSocket: unknown;
  __EXPO_RSC_RELOAD_LISTENERS__?: (() => unknown)[];
};

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onmessage: ((message: { data: string }) => void) | null = null;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }
}

const originalWebSocket = globals.WebSocket;

beforeEach(() => {
  MockWebSocket.instances = [];
  globals.WebSocket = MockWebSocket;
  jest.isolateModules(() => {
    // jest-expo mocks the message socket for every test.
    jest.requireActual('../messageSocket');
  });
});

afterEach(() => {
  delete globals.__EXPO_RSC_RELOAD_LISTENERS__;
  globals.WebSocket = originalWebSocket;
});

test('opens no socket until React Server Components registers a reload listener', () => {
  expect(MockWebSocket.instances).toHaveLength(0);

  globals.__EXPO_RSC_RELOAD_LISTENERS__ ||= [];
  globals.__EXPO_RSC_RELOAD_LISTENERS__ ||= [];

  expect(MockWebSocket.instances.map((socket) => socket.url)).toEqual([
    'ws://localhost:8081/message',
  ]);
});

test('calls the reload listeners on rsc-reload', () => {
  const listener = jest.fn();
  const listeners = (globals.__EXPO_RSC_RELOAD_LISTENERS__ ||= []);
  listeners.push(listener);

  MockWebSocket.instances[0]?.onmessage?.({
    data: JSON.stringify({ method: 'sendDevCommand', params: { name: 'rsc-reload' } }),
  });

  expect(listener).toHaveBeenCalledTimes(1);
});
