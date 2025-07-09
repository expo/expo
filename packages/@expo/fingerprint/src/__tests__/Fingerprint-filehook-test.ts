import { createHash, randomFill } from 'crypto';
import { vol } from 'memfs';
import { promisify } from 'node:util';
import pLimit from 'p-limit';
import path from 'path';

import { createFingerprintAsync } from '../Fingerprint';
import type { FileHookTransformSource, FileHookTransformFunction } from '../Fingerprint.types';
import { normalizeOptionsAsync } from '../Options';
import { createContentsHashResultsAsync, createFileHashResultsAsync } from '../hash/Hash';

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('resolve-from');
jest.mock('../ProjectWorkflow');
jest.mock('../utils/SpawnIPC');

describe('FileHookTransform', () => {
  const mockHook = jest
    .fn()
    .mockImplementation(
      (
        source: FileHookTransformSource,
        chunk: Buffer | string | null,
        isEndOfFile: boolean,
        encoding: BufferEncoding
      ) => chunk
    ) as jest.MockedFunction<FileHookTransformFunction>;

  afterEach(() => {
    mockHook.mockClear();
    vol.reset();
  });

  it('should call hook function from createFileHashResultsAsync', async () => {
    const filePath = 'assets/icon.png';
    const contents = 'PNG';
    const limiter = pLimit(1);
    vol.mkdirSync('/app/assets', { recursive: true });
    vol.writeFileSync(path.join('/app', filePath), contents);

    const options = await normalizeOptionsAsync('/app', { fileHookTransform: mockHook });
    const result = await createFileHashResultsAsync(filePath, limiter, '/app', options);
    expect(mockHook).toHaveBeenCalledTimes(2);
    expect(mockHook.mock.calls[0][0]).toEqual({ type: 'file', filePath });
    expect(mockHook.mock.calls[0][1].toString()).toEqual(contents);
    expect(mockHook.mock.calls[0][2]).toBe(false);
    expect(mockHook.mock.calls[1][0]).toEqual({ type: 'file', filePath });
    expect(mockHook.mock.calls[1][1]).toBe(null);
    expect(mockHook.mock.calls[1][2]).toBe(true);
    const expectHex = createHash(options.hashAlgorithm).update(contents).digest('hex');
    expect(result.hex).toBe(expectHex);
  });

  it('should allow chunk buffering in the file hook', async () => {
    let recvBuffer = Buffer.alloc(0);

    const mockChunkBufferHook = jest
      .fn()
      .mockImplementation(
        (
          source: FileHookTransformSource,
          chunk: Buffer | string | null,
          isEndOfFile: boolean,
          encoding: BufferEncoding
        ) => {
          if (chunk != null) {
            const buffer = typeof chunk === 'string' ? Buffer.from(chunk, encoding) : chunk;
            recvBuffer = Buffer.concat([recvBuffer, buffer]);
          }

          if (!isEndOfFile) {
            return null;
          }
          return recvBuffer;
        }
      ) as jest.MockedFunction<FileHookTransformFunction>;

    const filePath = 'assets/icon.png';
    // Creating a large file to simulate multiple chunks in the stream
    const fileSize = 1024 * 1024;
    const contents = await createRandomBufferAsync(fileSize);
    const limiter = pLimit(1);
    vol.mkdirSync('/app/assets', { recursive: true });
    vol.writeFileSync(path.join('/app', filePath), contents);

    const options = await normalizeOptionsAsync('/app', { fileHookTransform: mockChunkBufferHook });
    const result = await createFileHashResultsAsync(filePath, limiter, '/app', options);
    const expectHex = createHash(options.hashAlgorithm).update(contents).digest('hex');
    expect(result.hex).toBe(expectHex);

    expect(recvBuffer.byteLength).toBe(fileSize);
    const expectHex2 = createHash(options.hashAlgorithm).update(recvBuffer).digest('hex');
    expect(result.hex).toBe(expectHex2);
  });

  it('should call hook function from createFingerprintAsync', async () => {
    vol.fromJSON(require('../sourcer/__tests__/fixtures/ExpoManaged47Project.json'));
    const packageJson = JSON.parse(vol.readFileSync('/app/package.json', 'utf8').toString());
    jest.doMock('/app/package.json', () => packageJson, { virtual: true });
    const options = await normalizeOptionsAsync('/app', { fileHookTransform: mockHook });
    await createFingerprintAsync('/app', options);
    expect(mockHook).toHaveBeenCalled();
  });

  it('should call hook function from content sources', async () => {
    const mockExpoConfigHook = jest
      .fn()
      .mockImplementation(
        (
          source: FileHookTransformSource,
          chunk: Buffer | string | null,
          isEndOfFile: boolean,
          encoding: BufferEncoding
        ) => {
          if (source.type === 'contents' && source.id === 'expoConfig') {
            expect(isEndOfFile).toBe(true);
            return 'EMPTYCONFIG';
          }
          return chunk;
        }
      ) as jest.MockedFunction<FileHookTransformFunction>;
    vol.fromJSON(require('../sourcer/__tests__/fixtures/ExpoManaged47Project.json'));
    const packageJson = JSON.parse(vol.readFileSync('/app/package.json', 'utf8').toString());
    jest.doMock('/app/package.json', () => packageJson, { virtual: true });
    const options = await normalizeOptionsAsync('/app', { fileHookTransform: mockExpoConfigHook });
    const result = await createFingerprintAsync('/app', options);
    const expoConfig = result.sources.find(
      (source) => source.type === 'contents' && source.id === 'expoConfig'
    );
    // @ts-expect-error - typescript cannot infer contents type from FingerpintSource
    expect(expoConfig?.contents).toBe('EMPTYCONFIG');
    const expectHex = createHash(options.hashAlgorithm).update('EMPTYCONFIG').digest('hex');
    expect(expoConfig?.hash).toBe(expectHex);
  });
});

describe('FileHookTransform - debugInfo.isTransformed', () => {
  const mockHook = jest
    .fn()
    .mockImplementation(
      (
        source: FileHookTransformSource,
        chunk: Buffer | string | null,
        isEndOfFile: boolean,
        encoding: BufferEncoding
      ) => {
        // transform anything to empty string
        return '';
      }
    ) as jest.MockedFunction<FileHookTransformFunction>;

  afterEach(() => {
    mockHook.mockClear();
    vol.reset();
  });

  it('should contain `isTransformed` value in debugInfo from createFileHashResultsAsync in debug mode', async () => {
    const filePath = 'assets/icon.png';
    const contents = await createRandomBufferAsync(4096);
    const limiter = pLimit(1);
    vol.mkdirSync('/app/assets', { recursive: true });
    vol.writeFileSync(path.join('/app', filePath), contents);

    const options = await normalizeOptionsAsync('/app', {
      fileHookTransform: mockHook,
      debug: true,
    });
    const result = await createFileHashResultsAsync(filePath, limiter, '/app', options);
    expect(result.debugInfo?.path).toBe(filePath);
    expect(result.debugInfo?.isTransformed).toBe(true);
  });

  it('should contain `isTransformed` value in debugInfo from createContentsHashResultsAsync in debug mode', async () => {
    const options = await normalizeOptionsAsync('/app', {
      fileHookTransform: mockHook,
      debug: true,
    });
    const result = await createContentsHashResultsAsync(
      {
        type: 'contents',
        id: 'stubId',
        contents: 'stubContents',
        reasons: [],
      },
      options
    );
    expect(result.debugInfo?.isTransformed).toBe(true);
  });
});

const randomFillAsync = promisify(randomFill);
/**
 * Create a buffer filled with random data.
 */
async function createRandomBufferAsync(size: number): Promise<Buffer> {
  const chunkSize = 65536; // Maximum size per randomFill operation
  const buffer = Buffer.alloc(size); // Allocate the buffer

  let offset = 0;

  while (offset < size) {
    const remainingSize = size - offset;
    const currentChunkSize = Math.min(chunkSize, remainingSize);

    await randomFillAsync(buffer.subarray(offset, offset + currentChunkSize));
    offset += currentChunkSize;
  }

  return buffer;
}
