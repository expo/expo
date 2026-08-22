import { vol } from 'memfs';

import {
  assertUploadableOrThrow,
  formatByteSize,
  isIgnoredUploadEntry,
  listUploadFilesAsync,
  summarizeUploadAsync,
  LAUNCH_SIZE_LIMIT_BYTES,
} from '../launchFiles';

const uploadRoot = '/project';

afterEach(() => {
  vol.reset();
});

/** Collect an upload listing, sorted so the assertion does not depend on directory order. */
async function listAsync(root = uploadRoot): Promise<string[]> {
  const paths: string[] = [];
  for await (const file of listUploadFilesAsync(root)) {
    paths.push(file.normalizedPath);
  }
  return paths.sort();
}

describe(isIgnoredUploadEntry, () => {
  it(`should ignore what the project does not need to build`, () => {
    // Every one of these is either regenerated remotely or private to this machine.
    for (const name of ['.git', 'node_modules', '.expo', '.DS_Store', '__MACOSX', '.Trashes']) {
      expect(isIgnoredUploadEntry(name)).toBe(true);
    }
  });

  it(`should ignore native build output by its full path only`, () => {
    expect(isIgnoredUploadEntry('Pods', 'ios')).toBe(true);
    expect(isIgnoredUploadEntry('build', 'ios')).toBe(true);
    expect(isIgnoredUploadEntry('.gradle', 'android')).toBe(true);
    expect(isIgnoredUploadEntry('build', 'android/app')).toBe(true);
    // The same names elsewhere are source, e.g. a `build` directory of the app itself.
    expect(isIgnoredUploadEntry('build')).toBe(false);
    expect(isIgnoredUploadEntry('Pods', 'vendor')).toBe(false);
  });

  it(`should ignore editor backup files`, () => {
    expect(isIgnoredUploadEntry('App.tsx~')).toBe(true);
    expect(isIgnoredUploadEntry('App.tsx')).toBe(false);
  });

  it(`should keep the files a project is made of`, () => {
    for (const name of ['package.json', 'app.json', 'App.tsx', '.gitignore', 'eas.json']) {
      expect(isIgnoredUploadEntry(name)).toBe(false);
    }
  });
});

describe(listUploadFilesAsync, () => {
  it(`should list the project files with posix paths`, async () => {
    vol.fromJSON({
      [`${uploadRoot}/package.json`]: '{}',
      [`${uploadRoot}/app/index.tsx`]: 'export default null;',
      [`${uploadRoot}/assets/icon.png`]: 'png',
    });

    // Posix separators whatever the platform: a tar entry name is a posix path.
    expect(await listAsync()).toEqual(['app/index.tsx', 'assets/icon.png', 'package.json']);
  });

  it(`should skip the ignored directories at any depth`, async () => {
    vol.fromJSON({
      [`${uploadRoot}/package.json`]: '{}',
      [`${uploadRoot}/node_modules/expo/package.json`]: '{}',
      [`${uploadRoot}/.git/HEAD`]: 'ref',
      [`${uploadRoot}/.expo/settings.json`]: '{}',
      [`${uploadRoot}/ios/Pods/Manifest.lock`]: 'lock',
      [`${uploadRoot}/ios/Podfile`]: 'podfile',
      [`${uploadRoot}/apps/mobile/node_modules/left-pad/index.js`]: 'js',
      [`${uploadRoot}/apps/mobile/App.tsx`]: 'tsx',
    });

    expect(await listAsync()).toEqual(['apps/mobile/App.tsx', 'ios/Podfile', 'package.json']);
  });

  it(`should report the size of every file`, async () => {
    vol.fromJSON({ [`${uploadRoot}/package.json`]: '12345' });

    const files = [];
    for await (const file of listUploadFilesAsync(uploadRoot)) {
      files.push(file);
    }

    expect(files).toEqual([
      { normalizedPath: 'package.json', path: expect.stringContaining('package.json'), size: 5 },
    ]);
  });
});

describe(summarizeUploadAsync, () => {
  it(`should count the files and add up their bytes`, async () => {
    vol.fromJSON({
      [`${uploadRoot}/package.json`]: '12345',
      [`${uploadRoot}/app/index.tsx`]: '1234567890',
      [`${uploadRoot}/node_modules/expo/index.js`]: 'ignored',
    });

    await expect(summarizeUploadAsync(uploadRoot)).resolves.toEqual({ files: 2, size: 15 });
  });

  it(`should report an empty directory as nothing to upload`, async () => {
    vol.fromJSON({ [`${uploadRoot}/node_modules/expo/index.js`]: 'ignored' });

    await expect(summarizeUploadAsync(uploadRoot)).resolves.toEqual({ files: 0, size: 0 });
  });
});

describe(assertUploadableOrThrow, () => {
  it(`should accept a project under the size limit`, () => {
    expect(() => assertUploadableOrThrow({ files: 12, size: 1024 }, uploadRoot)).not.toThrow();
  });

  it(`should refuse an empty upload before it is sent`, () => {
    expect.assertions(2);
    try {
      assertUploadableOrThrow({ files: 0, size: 0 }, uploadRoot);
    } catch (error: any) {
      expect(error.code).toBe('LAUNCH_EMPTY');
      expect(error.suggestedCommand).toContain('exagent deploy');
    }
  });

  it(`should refuse a project over the 500 MB limit, naming its size`, () => {
    // The service rejects it, so the upload is not worth the minutes it would take.
    expect.assertions(3);
    try {
      assertUploadableOrThrow({ files: 3, size: LAUNCH_SIZE_LIMIT_BYTES + 1 }, uploadRoot);
    } catch (error: any) {
      expect(error.code).toBe('LAUNCH_SIZE_LIMIT');
      expect(error.message).toContain('500 MB');
      expect(error.message).toContain('524.29 MB');
    }
  });
});

describe(formatByteSize, () => {
  it(`should print bytes below a kilobyte as bytes`, () => {
    expect(formatByteSize(0)).toBe('0 B');
    expect(formatByteSize(999)).toBe('999 B');
  });

  it(`should print larger sizes in decimal units`, () => {
    expect(formatByteSize(1000)).toBe('1.00 KB');
    expect(formatByteSize(1_500_000)).toBe('1.50 MB');
    expect(formatByteSize(524_288_001)).toBe('524.29 MB');
  });
});
