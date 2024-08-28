import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { mockSpawnPromise } from '../../__tests__/spawn-utils';
import { isFileIgnoredAsync, existsAndIsNotIgnoredAsync } from '../files';

jest.mock('fs');

describe(isFileIgnoredAsync, () => {
  it(`returns true if git check-ignore succeeds`, async () => {
    jest
      .mocked(spawnAsync)
      .mockImplementationOnce(() =>
        mockSpawnPromise(
          Promise.resolve({
            status: 0,
            stdout: '',
          })
        )
      )
      .mockImplementationOnce(() => {
        return mockSpawnPromise(Promise.resolve({ status: 0, stdout: '' }));
      });
    const result = await isFileIgnoredAsync('file');
    expect(result).toBe(true);
  });

  it(`returns false if git check-ignore fails`, async () => {
    jest
      .mocked(spawnAsync)
      .mockImplementationOnce(() =>
        mockSpawnPromise(
          Promise.resolve({
            status: 0,
            stdout: '',
          })
        )
      )
      .mockImplementationOnce(() => {
        const error: any = new Error();
        error.status = -1; // git check-ignore errors if file is not ignored
        return mockSpawnPromise(Promise.reject(error));
      });
    const result = await isFileIgnoredAsync('file');
    expect(result).toBe(false);
  });
});

describe(existsAndIsNotIgnoredAsync, () => {
  it(`returns true if git check-ignore fails and file exists`, async () => {
    vol.fromJSON({
      '/test.txt': 'test',
    });
    jest
      .mocked(spawnAsync)
      .mockImplementationOnce(() =>
        mockSpawnPromise(
          Promise.resolve({
            status: 0,
            stdout: '',
          })
        )
      )
      .mockImplementationOnce(() => {
        const error: any = new Error();
        error.status = -1; // git check-ignore errors if file is not ignored
        return mockSpawnPromise(Promise.reject(error));
      });
    const result = await existsAndIsNotIgnoredAsync('/test.txt');
    expect(result).toBe(true);
  });
});
