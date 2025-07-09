import { WebSocket } from 'ws';

import { evaluateJsFromCdpAsync } from '../CdpClient';

jest.mock('ws');

function createMockWebSocket(webSocketDebuggerUrl) {
  const mockWebSocket = new WebSocket(webSocketDebuggerUrl) as jest.Mocked<WebSocket>;
  const emitOpen = jest.fn();
  const emitMessage = jest.fn();
  const emitError = jest.fn();
  const emitClose = jest.fn();
  mockWebSocket.on.mockImplementation((event, handler) => {
    if (event === 'open') {
      emitOpen.mockImplementation(handler);
    } else if (event === 'message') {
      emitMessage.mockImplementation(handler);
    } else if (event === 'error') {
      emitError.mockImplementation(handler);
    } else if (event === 'close') {
      emitClose.mockImplementation(handler);
    }
    return mockWebSocket;
  });

  return { mockWebSocket, emitOpen, emitMessage, emitError, emitClose };
}

describe(evaluateJsFromCdpAsync, () => {
  const webSocketDebuggerUrl = 'ws://localhost:8081/devtools/page/1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve result of the evaluation', async () => {
    const { emitOpen, emitMessage } = createMockWebSocket(webSocketDebuggerUrl);
    const promise = evaluateJsFromCdpAsync(webSocketDebuggerUrl, '2 + 2');

    emitOpen();
    emitMessage(
      JSON.stringify({
        id: 0,
        result: { result: { type: 'string', value: '4' } },
      })
    );
    await expect(promise).resolves.toBe('4');
    expect(WebSocket.prototype.close).toHaveBeenCalled();
  });

  it('should resolve undefined result of the unmatched evaluation', async () => {
    const { emitOpen, emitMessage } = createMockWebSocket(webSocketDebuggerUrl);
    const promise = evaluateJsFromCdpAsync(webSocketDebuggerUrl, 'window.__nonexistence__');

    emitOpen();
    emitMessage(
      JSON.stringify({
        id: 0,
        result: { result: { type: 'undefined' } },
      })
    );
    await expect(promise).resolves.toBe(undefined);
    expect(WebSocket.prototype.close).toHaveBeenCalled();
  });

  it('should reject if the evaluation results in an error', async () => {
    const { emitOpen, emitMessage } = createMockWebSocket(webSocketDebuggerUrl);
    const promise = evaluateJsFromCdpAsync(webSocketDebuggerUrl, 'window.__nonexistence__');

    emitOpen();
    emitMessage(
      JSON.stringify({
        id: 0,
        error: { code: -32601, message: "Unsupported method 'hello'" },
      })
    );
    await expect(promise).rejects.toThrow("Unsupported method 'hello'");
    expect(WebSocket.prototype.close).toHaveBeenCalled();
  });

  it('should reject if the WebSocket connection fails', async () => {
    const { emitError } = createMockWebSocket(webSocketDebuggerUrl);
    const promise = evaluateJsFromCdpAsync(webSocketDebuggerUrl, '2 + 2');
    const error = new Error('Connection failed');
    emitError(error);
    await expect(promise).rejects.toThrow('Connection failed');
  });

  it('should reject if the WebSocket closes before receiving a response', async () => {
    const { emitOpen, emitClose } = createMockWebSocket(webSocketDebuggerUrl);
    const promise = evaluateJsFromCdpAsync(webSocketDebuggerUrl, '2 + 2');
    emitOpen();
    emitClose();
    await expect(promise).rejects.toThrow('WebSocket closed before response was received.');
  });

  it('should reject for request times out', async () => {
    jest.useFakeTimers();
    const promise = evaluateJsFromCdpAsync(webSocketDebuggerUrl, '2 + 2', 1000);

    jest.advanceTimersByTime(1500);

    await expect(promise).rejects.toThrow('Request timeout');
    jest.useRealTimers();
    expect(WebSocket.prototype.close).toHaveBeenCalled();
  });
});
