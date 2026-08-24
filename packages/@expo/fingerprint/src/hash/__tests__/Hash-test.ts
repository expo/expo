import { createHash } from 'crypto';
import { vol } from 'memfs';
import path from 'path';

import type { DebugInfoDir, HashSource } from '../../Fingerprint.types';
import { normalizeOptionsAsync } from '../../Options';
import { createLimiter } from '../../utils/Concurrency';
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
jest.mock('../../ProjectWorkflow');

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
      await createFingerprintFromSourcesAsync(
        sources,
        '/app',
        await normalizeOptionsAsync('/app', { debug: true })
      )
    ).toMatchInlineSnapshot(`
      {
        "hash": "ca7d58cd60289daa5cddcf99fcaa1d339bfc2c1a",
        "sources": [
          {
            "contents": "HelloWorld",
            "debugInfo": {
              "hash": "db8ac1c259eb89d4a131b253bacfca5f319d54f2",
            },
            "hash": "db8ac1c259eb89d4a131b253bacfca5f319d54f2",
            "id": "foo",
            "reasons": [
              "foo",
            ],
            "type": "contents",
          },
          {
            "debugInfo": {
              "hash": "bf21a9e8fbc5a3846fb05b4fa0859e0917b2202f",
              "path": "assets/icon.png",
            },
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
      debugInfo: {
        hash: 'db8ac1c259eb89d4a131b253bacfca5f319d54f2',
      },
    };
    expect(
      await createFingerprintSourceAsync(
        source,
        createLimiter(1),
        '/app',
        await normalizeOptionsAsync('/app', { debug: true })
      )
    ).toEqual(expectedResult);
  });

  it('does not include debug info when debug option is falsey', async () => {
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
        createLimiter(1),
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
    const options = await normalizeOptionsAsync('/app', { debug: true });
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
    const limiter = createLimiter(1);
    const options = await normalizeOptionsAsync('/app', { debug: true });
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
    const limiter = createLimiter(1);
    const options = await normalizeOptionsAsync('/app', { debug: true, ignorePaths: ['*.json'] });
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
    const limiter = createLimiter(3);
    const options = await normalizeOptionsAsync('/app', { debug: true });
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
    const limiter = createLimiter(3);
    const options = await normalizeOptionsAsync('/app', {
      debug: true,
      ignorePaths: ['ios/**/*', 'android/**/*'],
    });
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

  it('should partially ignore dir if it is in options.ignorePaths but using negated pattern to include some files', async () => {
    const limiter = createLimiter(3);
    const options = await normalizeOptionsAsync('/app', {
      debug: true,
      ignorePaths: ['ios/**/*', '!ios/Podfile', 'android/**/*'],
    });
    const volJSON = {
      '/app/ios/Podfile': '...',
      '/app/ios/HelloWorld/AppDelegate.mm': '...',
      '/app/eas.json': '{}',
      '/app/app.json': '{}',
      '/app/android/build.gradle': '...',
    };
    vol.fromJSON(volJSON);

    const fingerprint1 = await createDirHashResultsAsync('.', limiter, '/app', options);
    const iosDir = fingerprint1?.debugInfo?.children.find(
      (child) => (child as DebugInfoDir)?.children != null && child?.path === 'ios'
    ) as DebugInfoDir;
    expect(iosDir).toBeDefined();
    expect(iosDir.children.length).toBe(1);
    expect(iosDir.children[0]?.path).toBe('ios/Podfile');
  });

  it('should return stable result from sorted files', async () => {
    const limiter = createLimiter(3);
    const options = await normalizeOptionsAsync('/app', { debug: true });
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

describe('virtual store paths', () => {
  afterEach(() => {
    vol.reset();
  });

  // pnpm and the other isolated installers place a package under a store directory whose name
  // encodes the resolved peer dependencies. The default ignore paths currently drop those paths as
  // nested `node_modules`, so opt them back in to exercise the hashing itself.
  const optIn = { ignorePaths: ['!**/node_modules/**/node_modules/**'] };

  const cameraA =
    'node_modules/.pnpm/expo-camera@1.0.0_react-native@0.86.0/node_modules/expo-camera';
  // Same package and version, a peer dependency elsewhere in the tree was bumped.
  const cameraB =
    'node_modules/.pnpm/expo-camera@1.0.0_react-native@0.86.1_@babel+core@7.28.4/node_modules/expo-camera';

  async function hashDirAsync(volJSON: Record<string, string>, dirPath: string) {
    vol.reset();
    vol.fromJSON(volJSON);
    const options = await normalizeOptionsAsync('/app', optIn);
    const result = await createDirHashResultsAsync(dirPath, createLimiter(3), '/app', options);
    return result?.hex ?? null;
  }

  async function fingerprintDirSourceAsync(volJSON: Record<string, string>, dirPath: string) {
    vol.reset();
    vol.fromJSON(volJSON);
    const options = await normalizeOptionsAsync('/app', optIn);
    const sources: HashSource[] = [
      { type: 'dir', filePath: dirPath, reasons: ['expoAutolinkingAndroid'] },
    ];
    return (await createFingerprintFromSourcesAsync(sources, '/app', options)).hash;
  }

  it('should return the same dir hash when only the store suffix changed', async () => {
    const hexA = await hashDirAsync(
      { [`/app/${cameraA}/android/build.gradle`]: 'apply plugin: com.android.library' },
      `${cameraA}/android`
    );
    const hexB = await hashDirAsync(
      { [`/app/${cameraB}/android/build.gradle`]: 'apply plugin: com.android.library' },
      `${cameraB}/android`
    );

    expect(hexA).not.toBeNull();
    expect(hexB).toEqual(hexA);
  });

  it('should return the same fingerprint when only the store suffix changed', async () => {
    const hashA = await fingerprintDirSourceAsync(
      { [`/app/${cameraA}/android/build.gradle`]: 'apply plugin: com.android.library' },
      `${cameraA}/android`
    );
    const hashB = await fingerprintDirSourceAsync(
      { [`/app/${cameraB}/android/build.gradle`]: 'apply plugin: com.android.library' },
      `${cameraB}/android`
    );

    expect(hashB).toEqual(hashA);
  });

  it('should still change the dir hash when a file is renamed', async () => {
    const before = await hashDirAsync(
      { [`/app/${cameraA}/android/build.gradle`]: 'apply plugin: com.android.library' },
      `${cameraA}/android`
    );
    const after = await hashDirAsync(
      { [`/app/${cameraA}/android/settings.gradle`]: 'apply plugin: com.android.library' },
      `${cameraA}/android`
    );

    expect(after).not.toEqual(before);
  });

  it('should still change the dir hash when a file is moved into a subdirectory', async () => {
    const before = await hashDirAsync(
      { [`/app/${cameraA}/android/build.gradle`]: 'apply plugin: com.android.library' },
      `${cameraA}/android`
    );
    const after = await hashDirAsync(
      { [`/app/${cameraA}/android/gradle/build.gradle`]: 'apply plugin: com.android.library' },
      `${cameraA}/android`
    );

    expect(after).not.toEqual(before);
  });

  it('should still change the dir hash when a file moves out of a nested dependency', async () => {
    const before = await hashDirAsync(
      {
        [`/app/${cameraA}/node_modules/nested/android/build.gradle`]:
          'apply plugin: com.android.library',
      },
      cameraA
    );
    const after = await hashDirAsync(
      { [`/app/${cameraA}/nested/android/build.gradle`]: 'apply plugin: com.android.library' },
      cameraA
    );

    expect(after).not.toEqual(before);
  });

  it('should keep two store packages with identical contents apart', async () => {
    const media = 'node_modules/.pnpm/expo-media-library@1.0.0/node_modules/expo-media-library';
    const cameraHash = await fingerprintDirSourceAsync(
      { [`/app/${cameraA}/android/build.gradle`]: 'apply plugin: com.android.library' },
      `${cameraA}/android`
    );
    const mediaHash = await fingerprintDirSourceAsync(
      { [`/app/${media}/android/build.gradle`]: 'apply plugin: com.android.library' },
      `${media}/android`
    );

    expect(mediaHash).not.toEqual(cameraHash);
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

  it(`should use override hash key for file or dir`, () => {
    const fileSource: HashSource = {
      type: 'file',
      filePath: '/app/app.json',
      reasons: ['expoConfig'],
      overrideHashKey: 'overrideKey',
    };
    expect(createSourceId(fileSource)).toBe('overrideKey');

    const dirSource: HashSource = {
      type: 'dir',
      filePath: '/app/ios',
      reasons: ['bareNativeDir'],
      overrideHashKey: 'overrideKey',
    };
    expect(createSourceId(dirSource)).toBe('overrideKey');
  });
});
