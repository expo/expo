// @flow

import { EventEmitter, type EventSubscription } from 'fbemitter';
import { Constants } from 'expo-constants';
import invariant from 'invariant';
import UUID from 'uuid-js';

import LogSerialization from './LogSerialization';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogEntry = {
  count: number,
  level: LogLevel,
  body: Array<LogData>,
  includesStack: boolean,
  groupDepth?: number,
} & LogEntryFields;

export type LogEntryFields = {
  shouldHide?: boolean,
  groupDepth?: number,
  groupCollapsed?: boolean,
};

export type LogData = string | {| message: string, stack: string |};

type TransportErrorListener = ({ error: Error, response?: Response }) => void;

const _sessionId = UUID.create().toString();
const _logQueue: Array<LogEntry> = [];
const _transportEventEmitter = new EventEmitter();

let _logCounter = 0;
let _isSendingLogs = false;
let _completionPromise: ?Promise<void>;
let _resolveCompletion: ?() => void;

async function enqueueRemoteLogAsync(
  level: LogLevel,
  additionalFields: LogEntryFields,
  data: Array<mixed>
): Promise<void> {
  if (_isReactNativeWarning(data)) {
    // Remove the stack trace from the warning message since we'll capture our own
    invariant(data.length > 0, `Warnings must include log arguments`);
    invariant(typeof data[0] === 'string', `The log argument for a warning must be a string`);

    const warning = data[0];
    const lines = warning.split('\n');
    if (lines.length > 1 && /^\s+in /.test(lines[1])) {
      data[0] = lines[0];
    }
  }

  let { body, includesStack } = await LogSerialization.serializeLogDataAsync(data, level);

  _logQueue.push({
    count: _logCounter++,
    level,
    body,
    includesStack,
    ...additionalFields,
  });

  // Send the logs asynchronously (system errors are emitted with transport error events) and throw an uncaught error
  _sendRemoteLogsAsync().catch(error => {
    setImmediate(() => {
      throw error;
    });
  });
}

async function _sendRemoteLogsAsync(): Promise<void> {
  if (_isSendingLogs || !_logQueue.length) {
    return;
  }

  // Our current transport policy is to send all of the pending log messages in one batch. If we opt
  // for another policy (ex: throttling) this is where to to implement it.
  let batch = _logQueue.splice(0);

  let { logUrl } = Constants.manifest;
  invariant(typeof logUrl === 'string', 'The Expo project manifest must specify `logUrl`');

  _isSendingLogs = true;
  try {
    await _sendNextLogBatchAsync(batch, logUrl);
  } finally {
    _isSendingLogs = false;
  }

  if (_logQueue.length) {
    return _sendRemoteLogsAsync();
  } else if (_resolveCompletion) {
    _resolveCompletion();
  }
}

async function _sendNextLogBatchAsync(batch: Array<LogEntry>, logUrl: string): Promise<void> {
  let response;
  try {
    response = await fetch(logUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Connection: 'keep-alive',
        'Proxy-Connection': 'keep-alive',
        Accept: 'application/json',
        'Device-Id': Constants.installationId,
        'Device-Name': Constants.deviceName,
        'Session-Id': _sessionId,
      },
      body: JSON.stringify(batch),
    });
  } catch (error) {
    _transportEventEmitter.emit('error', { error });
    return;
  }

  let success = response.status >= 200 && response.status < 300;
  if (!success) {
    _transportEventEmitter.emit('error', {
      error: new Error(`An HTTP error occurred when sending remote logs`),
      response,
    });
  }
}

function addTransportErrorListener(listener: TransportErrorListener): EventSubscription {
  return _transportEventEmitter.addListener('error', listener);
}

function _isReactNativeWarning(data: Array<mixed>): boolean {
  // NOTE: RN does the same thing internally for YellowBox
  return data.length === 1 && typeof data[0] === 'string' && data[0].startsWith('Warning: ');
}

export default {
  enqueueRemoteLogAsync,
  addTransportErrorListener,
};

/**
 * Returns a promise that resolves when all entries in the log queue have been sent. This method is
 * intended for testing only.
 */
export function __waitForEmptyLogQueueAsync(): Promise<void> {
  if (_completionPromise) {
    return _completionPromise;
  }

  if (!_isSendingLogs && !_logQueue.length) {
    return Promise.resolve();
  }

  _completionPromise = new Promise(resolve => {
    _resolveCompletion = () => {
      invariant(!_isSendingLogs, `Must not be sending logs at completion`);
      invariant(!_logQueue.length, `Log queue must be empty at completion`);

      _completionPromise = null;
      _resolveCompletion = null;

      resolve();
    };
  });
  return _completionPromise;
}
