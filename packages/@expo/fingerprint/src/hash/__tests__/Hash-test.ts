import { createHash } from 'crypto';
import { vol } from 'memfs';
import pLimit from 'p-limit';
import path from 'path';

import { HashSource } from '../../Fingerprint.types';
import { normalizeOptions } from '../../Options';
import {
  createContentsHashResultsAsync,
  createDirHashResultsAsync,
  createFileHashResultsAsync,
  createFingerprintFromSourcesAsync,
  createFingerprintSourceAsync,
  createSourceId,
} from '../Hash';

jest.mock('fs');
jest.mock('fs/promises');

describe(createFingerprintFromSourcesAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('snapshot', async () => {
    vol.mkdirSync('/app');
    vol.writeFileSync(path.join('/app', 'app.json'), '{}');

    const sources: HashSource[] = [
      { type: 'contents', id: 'foo', contents: 'HelloWorld', reasons: ['foo'] },
      { type: 'file', filePath: 'app.json', reasons: ['expoConfig'] },
    ];

    expect(await createFingerprintFromSourcesAsync(sources, '/app', normalizeOptions()))
      .toMatchInlineSnapshot(`
      {
        "hash": "ec7d81780f735d5e289b27cdcc04a6c99d2621dc",
        "sources": [
          {
            "contents": "HelloWorld",
            "hash": "db8ac1c259eb89d4a131b253bacfca5f319d54f2",
            "id": "foo",
            "reasons": [
              "foo",
            ],
            "type": "contents",
          },
          {
            "filePath": "app.json",
            "hash": "bf21a9e8fbc5a3846fb05b4fa0859e0917b2202f",
            "reasons": [
              "expoConfig",
            ],
            "type": "file",
          },
        ],
      }
    `);
  });
});

describe(createFingerprintSourceAsync, () => {
  it('should merge hash value to original source', async () => {
    const source: HashSource = {
      type: 'contents',
      id: 'foo',
      contents: 'HelloWorld',
      reasons: ['foo'],
    };
    const expectedResult = {
      ...source,
      hash: 'db8ac1c259eb89d4a131b253bacfca5f319d54f2',
    };
    expect(
      await createFingerprintSourceAsync(source, pLimit(1), '/app', normalizeOptions())
    ).toEqual(expectedResult);
  });
});

describe(createContentsHashResultsAsync, () => {
  it('should return {id, hex} result', async () => {
    const id = 'foo';
    const contents = '{}';
    const options = normalizeOptions();
    const result = await createContentsHashResultsAsync(
      {
        type: 'contents',
        id,
        contents,
        reasons: [id],
      },
      options
    );

    const expectHex = createHash(options.hashAlgorithm).update(contents).digest('hex');
    expect(result.id).toEqual(id);
    expect(result.hex).toEqual(expectHex);
  });
});

describe(createFileHashResultsAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return {id, hex} result', async () => {
    const filePath = 'app.json';
    const contents = '{}';
    const limiter = pLimit(1);
    const options = normalizeOptions();
    vol.mkdirSync('/app');
    vol.writeFileSync(path.join('/app', filePath), contents);

    const result = await createFileHashResultsAsync(filePath, limiter, '/app', options);

    const expectHex = createHash(options.hashAlgorithm).update(contents).digest('hex');
    expect(result.id).toEqual(filePath);
    expect(result.hex).toEqual(expectHex);
  });
});

describe(createDirHashResultsAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return {id, hex} result', async () => {
    const limiter = pLimit(3);
    const options = normalizeOptions();
    const volJSON = {
      '/app/ios/Podfile': '...',
      '/app/eas.json': '{}',
      '/app/app.json': '{}',
      '/app/android/build.gradle': '...',
    };
    vol.fromJSON(volJSON);
    const result = await createDirHashResultsAsync('.', limiter, '/app', options);

    expect(result?.id).toEqual('.');
    expect(result?.hex).not.toBe('');
  });

  it('should return stable result from sorted files', async () => {
    const limiter = pLimit(3);
    const options = normalizeOptions();
    const volJSON = {
      '/app/ios/Podfile': '...',
      '/app/eas.json': '{}',
      '/app/app.json': '{}',
      '/app/android/build.gradle': '...',
    };
    vol.fromJSON(volJSON);
    const result = await createDirHashResultsAsync('.', limiter, '/app', options);

    vol.reset();
    const sortedVolJSON = {
      '/app/app.json': '{}',
      '/app/eas.json': '{}',
      '/app/android/build.gradle': '...',
      '/app/ios/Podfile': '...',
    };
    vol.fromJSON(sortedVolJSON);
    const sortedResult = await createDirHashResultsAsync('.', limiter, '/app', options);

    expect(result?.id).toEqual(sortedResult?.id);
    expect(result?.hex).toEqual(sortedResult?.hex);
  });
});

describe(createSourceId, () => {
  it(`should use filePath as id for file or dir`, () => {
    const fileSource: HashSource = {
      type: 'file',
      filePath: '/app/app.json',
      reasons: ['expoConfig'],
    };
    expect(createSourceId(fileSource)).toBe('/app/app.json');

    const dirSource: HashSource = { type: 'dir', filePath: '/app/ios', reasons: ['bareNativeDir'] };
    expect(createSourceId(dirSource)).toBe('/app/ios');
  });

  it(`should use given id for contents`, () => {
    const source: HashSource = {
      type: 'contents',
      id: 'foo',
      contents: 'HelloWorld',
      reasons: ['foo'],
    };
    expect(createSourceId(source)).toBe('foo');
  });
});
