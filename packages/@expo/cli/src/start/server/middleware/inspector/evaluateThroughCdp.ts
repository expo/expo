import type Protocol from 'devtools-protocol';
import { setTimeout } from 'node:timers';
import { WebSocket, RawData } from 'ws';

import {
  CdpMessage,
  DebuggerRequest,
  DeviceResponse,
  WrappedEvent,
} from '../../metro/debugging/types';

const debug = require('debug')(
  'expo:start:server:middleware:inspector:evaluateThroughCdp'
) as typeof console.log;

type RuntimeEvaluate = CdpMessage<
  'Runtime.evaluate',
  Protocol.Runtime.EvaluateRequest,
  Protocol.Runtime.EvaluateResponse
>;

/**
 * Evaluate arbitrary JavaScript code through CDP's `Runtime.evaluate` request.
 * This will handle the required listeners and resolves once the evaluation response is received.
 * All used event listeners are cleaned up automatically.
 */
export async function evaluateThroughCdpSocket<T = any>(
  socket: WebSocket,
  evaluateSource: string,
  pageId: string,
  timeoutMs: number = 2000
) {
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  // TODO: make more distinct
  const requestId = -69;
  const message: WrappedEvent = {
    event: 'wrappedEvent',
    payload: {
      pageId,
      wrappedEvent: JSON.stringify({
        id: requestId,
        method: 'Runtime.evaluate',
        params: { expression: evaluateSource },
      }), // satisfies DebuggerRequest<RuntimeEvaluate>,
    },
  };

  // Ensure possible errors are surfaced
  const onSocketError = (error: Error) => reject(error);
  const onSocketClose = () => reject(new Error('Socket closed before receiving a response'));

  // Handle the `Runtime.evaluate` responses
  const onSocketMessage = (raw: RawData, isBinary: boolean) => {
    // Ignore binary messages
    if (isBinary) return;

    const data = raw.toString();
    debug('message received', data);

    try {
      if (!data.includes(`${requestId}`)) return;
      const response: DeviceResponse<RuntimeEvaluate> = JSON.parse(data);
      // Ignore other CDP communication
      if (response.id !== requestId) return;
      // Convert evaluation exceptions
      if (response.result.exceptionDetails) {
        return reject(errorFromExceptionDetails(response.result.exceptionDetails));
      }
      // Convert evaluation responses
      resolve(resultFromResponse(response.result.result) as T);
    } catch (error) {
      reject(error);
    }
  };

  // Ensure the request is timed-out and not pending indefinitely
  const timeoutId = setTimeout(
    () => reject(new Error('Socket evaluation request timed out')),
    timeoutMs
  );

  try {
    debug('Sending evaluation request', message);
    socket.send(JSON.stringify(message));
    socket.once('close', onSocketClose);
    socket.once('error', onSocketError);
    socket.on('message', onSocketMessage);
    return await promise;
  } finally {
    clearTimeout(timeoutId);
    socket.off('close', onSocketClose);
    socket.off('error', onSocketError);
    socket.off('message', onSocketMessage);
  }
}

function errorFromExceptionDetails(details: Protocol.Runtime.ExceptionDetails) {
  // TODO: add stack traces
  return new Error('Failed to evaluate: ' + details.text);
}

function resultFromResponse(result: Protocol.Runtime.RemoteObject) {
  if (result.type === 'string') {
    return result;
  }

  // TODO: handle more

  return undefined;
}

/**
 * Evaluate arbitrary JavaScript code through CDP's `Runtime.evaluate` request.
 * This will open the websocket just for the evaluation request, and close the socket on response.
 */
export async function evaluateThroughCdpUrl<T = any>(
  socketUrl: string,
  evaluateSource: string,
  pageId: string,
  timeoutMs: number = 2000
) {
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  let socket: WebSocket | null = null;

  const onSocketError = (error: Error) => reject(error);
  const onSocketClose = () => reject(new Error('Socket closed before fully opening'));
  const onSocketOpen = () => {
    debug('Socket opened');
    evaluateThroughCdpSocket(socket!, evaluateSource, pageId, timeoutMs)
      .then(resolve)
      .catch(reject);
  };

  try {
    socket = new WebSocket(socketUrl);
    socket.once('close', onSocketClose);
    socket.once('error', onSocketError);
    socket.once('open', onSocketOpen);
    return await promise;
  } finally {
    socket?.off('close', onSocketClose);
    socket?.off('error', onSocketError);
    socket?.off('open', onSocketOpen);
  }
}
