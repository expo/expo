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

describe(generateFaviconAssetAsync, () => {
  beforeEach(() => {
    getUserDefinedFile.mockReturnValue(null);
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

  it('returns the SVG href when the user supplied a `public/favicon.svg`', async () => {
    // Browsers don't auto-discover SVG favicons the way they do
    // `/favicon.ico`, so a `<link>` tag must still be emitted. The SVG file
    // itself is copied to the output by `copyPublicFolderAsync`, not here.
    getUserDefinedFile.mockReturnValueOnce('/project/public/favicon.svg');

    const files: ExportAssetMap = new Map();
    const result = await generateFaviconAssetAsync('/project', {
      baseUrl: '/app',
      outputDir: '/out',
      files,
      exp: { name: '', slug: '' } as any,
    });

    expect(result).toEqual({ href: '/app/favicon.svg' });
    expect(files.size).toBe(0);
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

  it('copies an SVG `web.favicon` raw (no rasterization) and returns the SVG href', async () => {
    // Rasterizing would defeat the point of an SVG favicon — features like
    // `prefers-color-scheme` media queries need the original markup to
    // survive into the served asset.
    const svgSource = '<svg xmlns="http://www.w3.org/2000/svg"/>';
    const readFileMock = jest
      .spyOn(require('fs').promises, 'readFile')
      .mockResolvedValue(Buffer.from(svgSource));

    try {
      const files: ExportAssetMap = new Map();
      const result = await generateFaviconAssetAsync('/project', {
        baseUrl: '/app',
        outputDir: '/out',
        files,
        exp: { name: '', slug: '', web: { favicon: './icon.svg' } } as any,
      });

      expect(result).toEqual({ href: '/app/favicon.svg' });
      expect(files.get('favicon.svg')).toEqual({
        contents: Buffer.from(svgSource),
        targetDomain: 'client',
      });
      // The raster pipeline must not have been invoked for the SVG input.
      const { generateImageAsync } = jest.requireMock('@expo/image-utils');
      expect(generateImageAsync).not.toHaveBeenCalled();
    } finally {
      readFileMock.mockRestore();
    }
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
});
