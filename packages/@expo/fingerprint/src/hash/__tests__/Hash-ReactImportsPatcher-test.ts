import { vol } from 'memfs';
import pLimit from 'p-limit';
import path from 'path';

import { normalizeOptionsAsync } from '../../Options';
import { createFileHashResultsAsync } from '../Hash';
import { ReactImportsPatchTransform } from '../ReactImportsPatcher';

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('../ReactImportsPatcher', () => ({
  ReactImportsPatchTransform: jest
    .fn()
    .mockImplementation(jest.requireActual('stream').PassThrough),
}));

describe(`createFileHashResultsAsync - use ReactImportsPatchTransform`, () => {
  afterEach(() => {
    vol.reset();
    jest.resetAllMocks();
  });

  it('should use ReactImportsPatchTransform when `enableReactImportsPatcher=false`', async () => {
    const limiter = pLimit(1);
    const options = await normalizeOptionsAsync('/app', {
      debug: true,
      enableReactImportsPatcher: false,
    });
    const files = {
      '/app/ios/HelloWorld/Info.plist': '',
      '/app/ios/HelloWorld/AppDelegate.h': '',
      '/app/ios/HelloWorld/AppDelegate.m': '',
      '/app/ios/HelloWorld/AppDelegate.mm': '',
      '/app/android/build.gradle': '',
    };
    vol.fromJSON(files);
    await Promise.all(
      Object.keys(files).map((filePath) =>
        createFileHashResultsAsync(path.relative('/app', filePath), limiter, '/app', options)
      )
    );
    const mockTransform = ReactImportsPatchTransform as jest.MockedClass<
      typeof ReactImportsPatchTransform
    >;
    expect(mockTransform.mock.instances.length).toBe(0);
  });

  it(`should not use ReactImportsPatchTransform if no match platforms`, async () => {
    const limiter = pLimit(1);
    const options = await normalizeOptionsAsync('/app', { debug: true, platforms: ['android'] });
    const files = {
      '/app/ios/HelloWorld/Info.plist': '',
      '/app/ios/HelloWorld/AppDelegate.h': '',
      '/app/ios/HelloWorld/AppDelegate.m': '',
      '/app/ios/HelloWorld/AppDelegate.mm': '',
      '/app/android/build.gradle': '',
    };
    vol.fromJSON(files);
    await Promise.all(
      Object.keys(files).map((filePath) =>
        createFileHashResultsAsync(path.relative('/app', filePath), limiter, '/app', options)
      )
    );
    const mockTransform = ReactImportsPatchTransform as jest.MockedClass<
      typeof ReactImportsPatchTransform
    >;
    expect(mockTransform.mock.instances.length).toBe(0);
  });

  it(`should not use ReactImportsPatchTransform if no match files`, async () => {
    const limiter = pLimit(1);
    const options = await normalizeOptionsAsync('/app', { debug: true, platforms: ['android'] });
    const files = {
      '/app/ios/HelloWorld/Info.plist': '',
      '/app/android/build.gradle': '',
    };
    vol.fromJSON(files);
    await Promise.all(
      Object.keys(files).map((filePath) =>
        createFileHashResultsAsync(path.relative('/app', filePath), limiter, '/app', options)
      )
    );
    const mockTransform = ReactImportsPatchTransform as jest.MockedClass<
      typeof ReactImportsPatchTransform
    >;
    expect(mockTransform.mock.instances.length).toBe(0);
  });
});
