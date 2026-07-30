import path from 'node:path';

import { generateFaviconAssetAsync } from '../favicon';
import type { ExportAssetMap } from '../saveAssets';

jest.mock('../publicFolder', () => ({
  getUserDefinedFile: jest.fn(() => null),
}));

jest.mock('@expo/image-utils', () => ({
  generateImageAsync: jest.fn(async () => ({ source: Buffer.from([0]) })),
  generateFaviconAsync: jest.fn(async () => Buffer.from([1, 2, 3])),
}));

const { getUserDefinedFile } = jest.requireMock('../publicFolder') as {
  getUserDefinedFile: jest.Mock;
};

const SVG_CONTENT = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

describe(generateFaviconAssetAsync, () => {
  beforeEach(() => {
    getUserDefinedFile.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns `null` when the user already supplied a `public/favicon.ico`', async () => {
    getUserDefinedFile.mockReturnValueOnce('/project/public/favicon.ico');

    const result = await generateFaviconAssetAsync('/project', {
      baseUrl: '',
      outputDir: '/out',
      exp: { name: '', slug: '', web: { favicon: './icon.png' } } as any,
    });

    expect(result).toBeNull();
  });

  it('returns `null` when `web.favicon` is not set', async () => {
    const result = await generateFaviconAssetAsync('/project', {
      baseUrl: '',
      outputDir: '/out',
      exp: { name: '', slug: '' } as any,
    });

    expect(result).toBeNull();
  });

  it('writes the `.ico` into the asset map and returns the `baseUrl`-prefixed href', async () => {
    const files: ExportAssetMap = new Map();
    const result = await generateFaviconAssetAsync('/project', {
      baseUrl: '/app',
      outputDir: '/out',
      files,
      exp: { name: '', slug: '', web: { favicon: './icon.png' } } as any,
    });

    expect(result).toEqual({ href: '/app/favicon.ico' });
    expect(files.get('favicon.ico')).toEqual({
      contents: Buffer.from([1, 2, 3]),
      targetDomain: 'client',
    });
  });

  it('writes to disk when no asset map is provided', async () => {
    const fsMock = jest.spyOn(require('fs').promises, 'writeFile').mockResolvedValue(undefined);
    try {
      await generateFaviconAssetAsync('/project', {
        baseUrl: '',
        outputDir: '/out',
        exp: { name: '', slug: '', web: { favicon: './icon.png' } } as any,
      });
      expect(fsMock).toHaveBeenCalledWith(path.join('/out', 'favicon.ico'), Buffer.from([1, 2, 3]));
    } finally {
      fsMock.mockRestore();
    }
  });

  it('copies `.svg` files raw with `.svg` extension', async () => {
    const files: ExportAssetMap = new Map();
    const readFileMock = jest
      .spyOn(require('fs').promises, 'readFile')
      .mockResolvedValue(SVG_CONTENT);

    const result = await generateFaviconAssetAsync('/project', {
      baseUrl: '',
      outputDir: '/out',
      files,
      exp: { name: '', slug: '', web: { favicon: './assets/favicon.svg' } } as any,
    });

    expect(result).toEqual({ href: '/favicon.svg' });
    expect(files.get('favicon.svg')).toEqual({
      contents: SVG_CONTENT,
      targetDomain: 'client',
    });
    expect(readFileMock).toHaveBeenCalledWith(path.resolve('/project', './assets/favicon.svg'));
  });

  it('returns `null` with a warning when SVG source file is missing and not forced', async () => {
    const warnMock = jest.spyOn(require('../log').Log, 'warn').mockImplementation(() => {});
    jest.spyOn(require('fs').promises, 'readFile').mockRejectedValue({ code: 'ENOENT' });

    const result = await generateFaviconAssetAsync('/project', {
      baseUrl: '',
      outputDir: '/out',
      exp: { name: '', slug: '', web: { favicon: './missing.svg' } } as any,
    });

    expect(result).toBeNull();
    expect(warnMock).toHaveBeenCalledWith(
      'Favicon source file in Expo config (web.favicon) does not exist: ./missing.svg'
    );
    warnMock.mockRestore();
  });
});
