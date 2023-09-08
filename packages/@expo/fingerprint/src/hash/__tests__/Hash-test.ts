import { createHash } from 'crypto';
import { vol } from 'memfs';
import pLimit from 'p-limit';
import path from 'path';

import { HashSource } from '../../Fingerprint.types';
import { normalizeOptionsAsync } from '../../Options';
import {
  createContentsHashResultsAsync,
  createDirHashResultsAsync,
  createFileHashResultsAsync,
  createFingerprintFromSourcesAsync,
  createFingerprintSourceAsync,
  createSourceId,
  isIgnoredPath,
} from '../Hash';

jest.mock('fs');
jest.mock('fs/promises');

describe(createFingerprintFromSourcesAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('snapshot', async () => {
    const filePath = 'assets/icon.png';
    vol.mkdirSync('/app');
    vol.mkdirSync('/app/assets');
    vol.writeFileSync(path.join('/app', filePath), '{}');

    const sources: HashSource[] = [
      { type: 'contents', id: 'foo', contents: 'HelloWorld', reasons: ['foo'] },
      { type: 'file', filePath, reasons: ['icon'] },
    ];

    expect(
      await createFingerprintFromSourcesAsync(sources, '/app', await normalizeOptionsAsync('/app'))
    ).toMatchInlineSnapshot(`
      {
        "hash": "ca7d58cd60289daa5cddcf99fcaa1d339bfc2c1a",
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
            "filePath": "assets/icon.png",
            "hash": "bf21a9e8fbc5a3846fb05b4fa0859e0917b2202f",
            "reasons": [
              "icon",
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
      await createFingerprintSourceAsync(
        source,
        pLimit(1),
        '/app',
        await normalizeOptionsAsync('/app')
      )
    ).toEqual(expectedResult);
  });
});

describe(createContentsHashResultsAsync, () => {
  it('should return {id, hex} result', async () => {
    const id = 'foo';
    const contents = '{}';
    const options = await normalizeOptionsAsync('/app');
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
    const filePath = 'assets/icon.png';
    const contents = '{}';
    const limiter = pLimit(1);
    const options = await normalizeOptionsAsync('/app');
    vol.mkdirSync('/app');
    vol.mkdirSync('/app/assets');
    vol.writeFileSync(path.join('/app', filePath), contents);

    const result = await createFileHashResultsAsync(filePath, limiter, '/app', options);

    const expectHex = createHash(options.hashAlgorithm).update(contents).digest('hex');
    expect(result?.id).toEqual(filePath);
    expect(result?.hex).toEqual(expectHex);
  });

  it('should ignore file if it is in options.ignorePaths', async () => {
    const filePath = 'app.json';
    const contents = '{}';
    const limiter = pLimit(1);
    const options = await normalizeOptionsAsync('/app');
    options.ignorePaths = ['*.json'];
    vol.mkdirSync('/app');
    vol.writeFileSync(path.join('/app', filePath), contents);

    const result = await createFileHashResultsAsync(filePath, limiter, '/app', options);
    expect(result).toBe(null);
  });
});

describe(createDirHashResultsAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return {id, hex} result', async () => {
    const limiter = pLimit(3);
    const options = await normalizeOptionsAsync('/app');
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

  it('should ignore dir if it is in options.ignorePaths', async () => {
    const limiter = pLimit(3);
    const options = await normalizeOptionsAsync('/app');
    options.ignorePaths = ['ios/**/*', 'android/**/*'];
    const volJSON = {
      '/app/ios/Podfile': '...',
      '/app/eas.json': '{}',
      '/app/app.json': '{}',
      '/app/android/build.gradle': '...',
    };
    vol.fromJSON(volJSON);

    const fingerprint1 = await createDirHashResultsAsync('.', limiter, '/app', options);

    vol.reset();
    const volJSONIgnoreNativeProjects = {
      '/app/eas.json': '{}',
      '/app/app.json': '{}',
    };
    vol.fromJSON(volJSONIgnoreNativeProjects);
    const fingerprint2 = await createDirHashResultsAsync('.', limiter, '/app', options);
    expect(fingerprint1).toEqual(fingerprint2);
  });

  it('should return stable result from sorted files', async () => {
    const limiter = pLimit(3);
    const options = await normalizeOptionsAsync('/app');
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

describe(isIgnoredPath, () => {
  it('should support file pattern', () => {
    expect(isIgnoredPath('app.json', ['app.json'])).toBe(true);
    expect(isIgnoredPath('app.ts', ['*.{js,ts}'])).toBe(true);
    expect(isIgnoredPath('/dir/app.json', ['/dir/*.json'])).toBe(true);
  });

  it('should support directory pattern', () => {
    expect(isIgnoredPath('/app/ios/Podfile', ['**/ios/**/*'])).toBe(true);
  });

  it('case sensitive by design', () => {
    expect(isIgnoredPath('app.json', ['APP.JSON'])).toBe(false);
  });

  it('should include dot files from wildcard pattern', () => {
    expect(isIgnoredPath('.bashrc', ['*'])).toBe(true);
  });

  it('no `matchBase` and `partial` by design', () => {
    expect(isIgnoredPath('/dir/app.json', ['app.json'])).toBe(false);
  });

  it('match a file inside a dir should use a globstar', () => {
    expect(isIgnoredPath('/dir/app.ts', ['*'])).toBe(false);
    expect(isIgnoredPath('/dir/app.ts', ['**/*'])).toBe(true);
  });

  it('should use `!` to override default ignorePaths', () => {
    const ignorePaths = ['**/ios/**/*', '!**/ios/Podfile', '**/android/**/*'];
    expect(isIgnoredPath('/app/ios/Podfile', ignorePaths)).toBe(false);
    expect(isIgnoredPath('/app/ios/Podfile.lock', ignorePaths)).toBe(true);
  });
});
