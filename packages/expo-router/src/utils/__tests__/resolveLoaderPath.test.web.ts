import * as path from 'node:path';

import { resolveLoaderModulePath, LoaderResolutionOptions } from '../resolveLoaderPath';

describe(resolveLoaderModulePath, () => {
  describe('development mode', () => {
    const devOptions: LoaderResolutionOptions = {
      isExporting: false,
    };

    it.each([
      { input: './index.js', expected: './index' },
      { input: './index.ts', expected: './index' },
      { input: './index.tsx', expected: './index' },
      { input: './index.jsx', expected: './index' },
      { input: './index', expected: './index' },
      { input: './posts/[id]', expected: './posts/[id]' },
      { input: './app/index.tsx', expected: './app/index' },
      { input: './app/(tabs)/home.js', expected: './app/(tabs)/home' },
      { input: '/absolute/path/file.ts', expected: '/absolute/path/file' },
      { input: 'app/index.tsx', expected: 'app/index' },
      { input: 'posts/[id].js', expected: 'posts/[id]' },
    ])('resolves $input to $expected', ({ input, expected }) => {
      expect(resolveLoaderModulePath(input, devOptions)).toBe(expected);
    });
  });

  describe('export mode', () => {
    const exportOptions: LoaderResolutionOptions = {
      isExporting: true,
      projectRoot: '/Users/test/project',
      routerRoot: 'app',
    };

    it.each([
      { input: './index.tsx', expected: path.resolve('/Users/test/project/app', 'index') },
      {
        input: './posts/[id].tsx',
        expected: path.resolve('/Users/test/project/app', 'posts/[id]'),
      },
      {
        input: './(tabs)/home.tsx',
        expected: path.resolve('/Users/test/project/app', '(tabs)/home'),
      },
      { input: '/absolute/path/to/file.ts', expected: '/absolute/path/to/file' },
      { input: 'posts/[id].tsx', expected: path.resolve('/Users/test/project/app', 'posts/[id]') },
      { input: './file.js', expected: path.resolve('/Users/test/project/app', 'file') },
      { input: './file.ts', expected: path.resolve('/Users/test/project/app', 'file') },
      { input: './file.tsx', expected: path.resolve('/Users/test/project/app', 'file') },
      { input: './file.jsx', expected: path.resolve('/Users/test/project/app', 'file') },
    ])('resolves $input to $expected', ({ input, expected }) => {
      expect(resolveLoaderModulePath(input, exportOptions)).toBe(expected);
    });
  });

  it('handles missing options gracefully', () => {
    expect(resolveLoaderModulePath('./index.tsx', {})).toBe('./index');
  });

  it('handles paths with multiple dots', () => {
    const options: LoaderResolutionOptions = {
      isExporting: true,
      projectRoot: '/project',
      routerRoot: 'app',
    };

    const result = resolveLoaderModulePath('./file.test.tsx', options);
    expect(result).toBe(path.resolve('/project/app', 'file.test'));
  });
});
