import { createHash } from 'crypto';
import { vol } from 'memfs';
import pLimit from 'p-limit';
import path from 'path';

import { createFingerprintAsync } from '../Fingerprint';
import type { FileHookTransformSource, FileHookTransformFunction } from '../Fingerprint.types';
import { normalizeOptionsAsync } from '../Options';
import { createFileHashResultsAsync } from '../hash/Hash';

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('resolve-from');

describe('FileHookTransform', () => {
  const mockHook = jest
    .fn()
    .mockImplementation(
      (source: FileHookTransformSource, chunk: Buffer | string, encoding: BufferEncoding) => chunk
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
    expect(mockHook).toHaveBeenCalledTimes(1);
    expect(mockHook.mock.calls[0][0]).toEqual({ type: 'file', filePath });
    expect(mockHook.mock.calls[0][1].toString()).toEqual(contents);
    const expectHex = createHash(options.hashAlgorithm).update(contents).digest('hex');
    expect(result.hex).toBe(expectHex);
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
        (source: FileHookTransformSource, chunk: Buffer | string, encoding: BufferEncoding) => {
          if (source.type === 'contents' && source.id === 'expoConfig') {
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
