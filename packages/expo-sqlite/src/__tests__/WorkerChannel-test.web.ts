import { TextDecoder, TextEncoder } from 'util';

// `web/` is outside this tsconfig's rootDir, so load it untyped.
const { invokeWorkerSync, sendWorkerResult } = require('../../web/WorkerChannel');

// jsdom has no TextEncoder.
Object.assign(globalThis, { TextEncoder, TextDecoder });

function createWorkerReplyingWith(error: Error): Worker {
  return {
    postMessage: ({ id, lockBuffer, resultBuffer }) => {
      sendWorkerResult({ id, result: null, error, syncTrait: { lockBuffer, resultBuffer } });
    },
  } as Worker;
}

describe('Invoking the worker synchronously', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw the error message from the worker', () => {
    const worker = createWorkerReplyingWith(
      new Error('unable to close due to unfinalized statements')
    );
    expect(() => invokeWorkerSync(worker, 'close', { nativeDatabaseId: 0 })).toThrow(
      'unable to close due to unfinalized statements'
    );
  });
});
