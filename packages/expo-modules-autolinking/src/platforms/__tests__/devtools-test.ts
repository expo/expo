import { vol } from 'memfs';
import * as path from 'path';

import { ExpoModuleConfig } from '../../ExpoModuleConfig';
import { resolveModuleAsync } from '../devtools';

jest.mock('fs/promises');

afterEach(() => {
  vol.reset();
  jest.resetAllMocks();
});

function createRevision(
  pkgDir: string,
  webpageRoot: string | undefined,
  cliBanner?: boolean,
  bannerTitle?: string
) {
  return {
    name: 'example-devtools',
    path: pkgDir,
    version: '0.0.1',
    config: new ExpoModuleConfig({
      platforms: ['devtools'],
      devtools: {
        ...(webpageRoot != null ? { webpageRoot } : {}),
        ...(cliBanner != null ? { cliBanner } : {}),
        ...(bannerTitle != null ? { bannerTitle } : {}),
      },
    }),
  };
}

describe(resolveModuleAsync, () => {
  it('returns null when devtools config is absent', async () => {
    const result = await resolveModuleAsync('example-devtools', {
      name: 'example-devtools',
      path: '/pkg',
      version: '0.0.1',
      config: new ExpoModuleConfig({ platforms: ['devtools'] }),
    });
    expect(result).toBeNull();
  });

  it('resolves a package-local webpageRoot to an absolute path inside the package', async () => {
    const pkgDir = path.resolve('/node_modules/example-devtools');
    const result = await resolveModuleAsync('example-devtools', createRevision(pkgDir, 'web'));
    expect(result).not.toBeNull();
    expect(result!.webpageRoot).toBe(path.join(pkgDir, 'web'));
    expect(result!.cliBanner).toBe(false);
  });

  it('resolves cliBanner option', async () => {
    const pkgDir = path.resolve('/node_modules/example-devtools');
    const result = await resolveModuleAsync(
      'example-devtools',
      createRevision(pkgDir, 'web', true)
    );
    expect(result).not.toBeNull();
    expect(result!.cliBanner).toBe(true);
  });

  it('resolves bannerTitle option', async () => {
    const pkgDir = path.resolve('/node_modules/example-devtools');
    const result = await resolveModuleAsync(
      'example-devtools',
      createRevision(pkgDir, 'web', true, 'Example DevTools')
    );
    expect(result).not.toBeNull();
    expect(result!.bannerTitle).toBe('Example DevTools');
  });

  it('drops webpageRoot when it traverses out of the package directory', async () => {
    const pkgDir = path.resolve('/project/node_modules/malicious');
    const result = await resolveModuleAsync('malicious', createRevision(pkgDir, '../..'));
    expect(result).not.toBeNull();
    expect(result!.webpageRoot).toBeUndefined();
  });
});
