import { vol } from 'memfs';

import { RootPathUtils } from '../../../lib/RootPathUtils';
import type { FallbackFilesystem } from '../../../types';
import createFallbackFilesystem, { isFallbackDir } from '../fallback';

const rootDir = '/project';

function createFallback(
  overrides: {
    extensions?: string[];
    ignore?: (path: string) => boolean;
    includeSymlinks?: boolean;
  } = {}
): FallbackFilesystem {
  return createFallbackFilesystem({
    rootPathUtils: new RootPathUtils(rootDir),
    extensions: overrides.extensions ?? ['js', 'ts'],
    ignore: overrides.ignore ?? (() => false),
    includeSymlinks: overrides.includeSymlinks ?? true,
  });
}

describe('createFallbackFilesystem', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('lookup', () => {
    test('returns file metadata for a regular file with matching extension', () => {
      vol.fromJSON({ '/project/foo.js': 'content' });
      const fallback = createFallback();
      const node = fallback.lookup('foo.js', '/project/foo.js', undefined);

      expect(node).not.toBeNull();
      expect(Array.isArray(node)).toBe(true);
      const meta = node as any[];
      expect(meta[0]).toBeGreaterThan(0); // mtime
      expect(meta[4]).toBe(0); // SYMLINK = 0 for regular files
    });

    test('returns null for a file with non-matching extension', () => {
      vol.fromJSON({ '/project/foo.txt': 'content' });
      const fallback = createFallback({ extensions: ['js'] });
      const node = fallback.lookup('foo.txt', '/project/foo.txt', undefined);

      expect(node).toBeNull();
    });

    test('returns null for ignored paths', () => {
      vol.fromJSON({ '/project/foo.js': 'content' });
      const fallback = createFallback({
        ignore: (p) => p.includes('foo'),
      });
      const node = fallback.lookup('foo.js', '/project/foo.js', undefined);

      expect(node).toBeNull();
    });

    test('returns null for nonexistent paths', () => {
      const fallback = createFallback();
      const node = fallback.lookup('missing.js', '/project/missing.js', undefined);

      expect(node).toBeNull();
    });

    test('returns a directory Map for a directory', () => {
      vol.fromJSON({ '/project/dir/file.js': 'content' });
      const fallback = createFallback();
      const node = fallback.lookup('dir', '/project/dir', undefined);

      expect(node).toBeInstanceOf(Map);
      // Should be populated (shouldFallbackCrawlDir returns true for 'dir')
      expect((node as Map<string, any>).has('file.js')).toBe(true);
    });

    test('returns empty Map for directories that should not be crawled', () => {
      vol.fromJSON({ '/project/node_modules/pkg/index.js': 'content' });
      const fallback = createFallback();
      const node = fallback.lookup('node_modules', '/project/node_modules', undefined);

      expect(node).toBeInstanceOf(Map);
      expect((node as Map<string, any>).size).toBe(0);
    });

    test('returns symlink metadata with resolved target', () => {
      vol.fromJSON({ '/project/target.js': 'content' });
      vol.symlinkSync('/project/target.js', '/project/link.js');
      const fallback = createFallback();
      const node = fallback.lookup('link.js', '/project/link.js', undefined);

      expect(node).not.toBeNull();
      const meta = node as any[];
      expect(typeof meta[4]).toBe('string'); // SYMLINK = target path
      expect(meta[4]).toBe('target.js');
    });

    test('returns null for symlinks when includeSymlinks is false', () => {
      vol.fromJSON({ '/project/target.js': 'content' });
      vol.symlinkSync('/project/target.js', '/project/link.js');
      const fallback = createFallback({ includeSymlinks: false });
      const node = fallback.lookup('link.js', '/project/link.js', undefined);

      expect(node).toBeNull();
    });

    test('preserves existing directory Map entries', () => {
      vol.fromJSON({
        '/project/dir/new.js': 'new',
        '/project/dir/existing.js': 'existing',
      });
      const fallback = createFallback();
      const existing = new Map([['existing.js', [999, 5, 0, null, 0, null] as any]]);
      const node = fallback.lookup('dir', '/project/dir', existing);

      expect(node).toBeInstanceOf(Map);
      const dir = node as Map<string, any>;
      // Existing entry preserved (not overwritten)
      expect(dir.get('existing.js')?.[0]).toBe(999);
      // New entry added
      expect(dir.has('new.js')).toBe(true);
    });
  });

  describe('readdir', () => {
    test('returns directory entries filtered by extension', () => {
      vol.fromJSON({
        '/project/src/a.js': 'a',
        '/project/src/b.ts': 'b',
        '/project/src/c.txt': 'c',
      });
      const fallback = createFallback({ extensions: ['js', 'ts'] });
      const result = fallback.readdir('src', '/project/src', undefined);

      expect(result).toBeInstanceOf(Map);
      expect(result!.has('a.js')).toBe(true);
      expect(result!.has('b.ts')).toBe(true);
      expect(result!.has('c.txt')).toBe(false);
    });

    test('includes subdirectories as empty Maps', () => {
      vol.fromJSON({
        '/project/src/sub/file.js': 'content',
      });
      const fallback = createFallback();
      const result = fallback.readdir('src', '/project/src', undefined);

      expect(result).toBeInstanceOf(Map);
      expect(result!.get('sub')).toBeInstanceOf(Map);
    });

    test('includes symlinks with unresolved marker when includeSymlinks is true', () => {
      vol.fromJSON({ '/project/src/target.js': 'target' });
      vol.symlinkSync('/project/src/target.js', '/project/src/link.js');
      const fallback = createFallback({ includeSymlinks: true });
      const result = fallback.readdir('src', '/project/src', undefined);

      expect(result).toBeInstanceOf(Map);
      const linkMeta = result!.get('link.js') as any[];
      expect(linkMeta[4]).toBe(1); // unresolved symlink marker
    });

    test('skips symlinks when includeSymlinks is false', () => {
      vol.fromJSON({ '/project/src/target.js': 'target' });
      vol.symlinkSync('/project/src/target.js', '/project/src/link.js');
      const fallback = createFallback({ includeSymlinks: false });
      const result = fallback.readdir('src', '/project/src', undefined);

      expect(result).toBeInstanceOf(Map);
      expect(result!.has('link.js')).toBe(false);
    });

    test('applies ignore filter to children', () => {
      vol.fromJSON({
        '/project/src/keep.js': 'keep',
        '/project/src/skip.js': 'skip',
      });
      const fallback = createFallback({
        ignore: (p) => p.includes('skip'),
      });
      const result = fallback.readdir('src', '/project/src', undefined);

      expect(result!.has('keep.js')).toBe(true);
      expect(result!.has('skip.js')).toBe(false);
    });

    test('returns null for nonexistent directory', () => {
      const fallback = createFallback();
      const result = fallback.readdir('missing', '/project/missing', undefined);

      expect(result).toBeNull();
    });

    test('does not re-read an already marked directory', () => {
      vol.fromJSON({ '/project/src/a.js': 'a' });
      const fallback = createFallback();

      // First call populates and marks
      const first = fallback.readdir('src', '/project/src', undefined);
      expect(first).toBeInstanceOf(Map);

      // Mutate the vol — but the marked dir should be returned as-is
      vol.fromJSON({ '/project/src/a.js': 'a', '/project/src/b.js': 'b' });
      const second = fallback.readdir('src', '/project/src', first);
      expect(second).toBe(first); // same reference
      expect(second!.has('b.js')).toBe(false); // not re-read
    });

    test('does not overwrite existing entries in provided dirNode', () => {
      vol.fromJSON({
        '/project/src/file.js': 'new',
      });
      const fallback = createFallback();
      const existing = new Map([['file.js', [999, 5, 0, null, 0, null] as any]]);
      const result = fallback.readdir('src', '/project/src', existing);

      expect(result!.get('file.js')?.[0]).toBe(999); // preserved
    });

    test('skips .git and .hg directories', () => {
      vol.fromJSON({
        '/project/src/keep.js': 'a',
        '/project/src/.git/HEAD': 'ref',
        '/project/src/.hg/store/data': 'binary',
      });
      const fallback = createFallback();
      const result = fallback.readdir('src', '/project/src', undefined);

      expect(result).toBeInstanceOf(Map);
      expect(result!.has('keep.js')).toBe(true);
      expect(result!.has('.git')).toBe(false);
      expect(result!.has('.hg')).toBe(false);
    });

    test('skips .git and .hg even when ignore would not match them', () => {
      vol.fromJSON({
        '/project/src/.git/HEAD': 'ref',
        '/project/src/keep.js': 'a',
      });
      const fallback = createFallback({ ignore: () => false });
      const result = fallback.readdir('src', '/project/src', undefined);

      expect(result!.has('.git')).toBe(false);
    });
  });

  describe('directory marking (isFallbackDir)', () => {
    test('readdir result is marked as a fallback dir', () => {
      vol.fromJSON({ '/project/src/a.js': 'a' });
      const fallback = createFallback();
      const result = fallback.readdir('src', '/project/src', undefined);

      expect(isFallbackDir(result)).toBe(true);
    });

    test('readdir child directories are marked as fallback dirs', () => {
      vol.fromJSON({ '/project/src/sub/file.js': 'content' });
      const fallback = createFallback();
      const result = fallback.readdir('src', '/project/src', undefined);

      const sub = result!.get('sub');
      expect(sub).toBeInstanceOf(Map);
      expect(isFallbackDir(sub)).toBe(true);
    });

    test('lookup-returned directory (crawled) is marked as a fallback dir', () => {
      vol.fromJSON({ '/project/dir/file.js': 'content' });
      const fallback = createFallback();
      const node = fallback.lookup('dir', '/project/dir', undefined);

      expect(isFallbackDir(node)).toBe(true);
    });

    test('lookup-returned directory (non-crawled) is marked as a fallback dir', () => {
      vol.fromJSON({ '/project/node_modules/pkg/index.js': 'content' });
      const fallback = createFallback();
      const node = fallback.lookup('node_modules', '/project/node_modules', undefined);

      expect(node).toBeInstanceOf(Map);
      expect((node as Map<string, any>).size).toBe(0);
      expect(isFallbackDir(node)).toBe(true);
    });

    test('readdir skips CRAWLED dirs but not VISITED dirs', () => {
      vol.fromJSON({
        '/project/src/a.js': 'a',
        '/project/src/sub/b.js': 'b',
      });
      const fallback = createFallback();

      // First readdir returns the parent (CRAWLED) with child sub (VISITED)
      const parent = fallback.readdir('src', '/project/src', undefined);
      const sub = parent!.get('sub') as Map<string, any>;
      expect(sub.size).toBe(0); // VISITED, not yet populated

      // readdir on the VISITED child should populate it (not skip)
      const populated = fallback.readdir('src/sub', '/project/src/sub', sub);
      expect(populated).toBe(sub); // same reference, mutated in place
      expect(sub.has('b.js')).toBe(true);

      // readdir again on the now-CRAWLED child should skip
      vol.fromJSON({
        '/project/src/a.js': 'a',
        '/project/src/sub/b.js': 'b',
        '/project/src/sub/c.js': 'c',
      });
      const skipped = fallback.readdir('src/sub', '/project/src/sub', sub);
      expect(skipped).toBe(sub);
      expect(sub.has('c.js')).toBe(false); // not re-read
    });

    test('unmarked Maps are not fallback dirs', () => {
      expect(isFallbackDir(new Map())).toBe(false);
    });

    test('non-directory lookup results are not marked', () => {
      vol.fromJSON({ '/project/file.js': 'content' });
      const fallback = createFallback();
      const node = fallback.lookup('file.js', '/project/file.js', undefined);

      expect(Array.isArray(node)).toBe(true);
      expect(isFallbackDir(node)).toBe(false);
    });
  });
});

// shouldFallbackCrawlDir is the only platform-sensitive function (uses path.sep).
// Test it with both win32 and posix separators.
describe.each([['win32'], ['posix']] as const)('shouldFallbackCrawlDir on %s', (platform) => {
  let mockPathModule: typeof import('path');
  let shouldFallbackCrawlDir: typeof import('../fallback').shouldFallbackCrawlDir;

  const p = (filePath: string): string =>
    platform === 'win32' ? filePath.replace(/\//g, '\\').replace(/^\\/, 'C:\\') : filePath;

  beforeAll(() => {
    mockPathModule = jest.requireActual<typeof import('path')>('path')[platform];
  });

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('path', () => mockPathModule);
    shouldFallbackCrawlDir = require('../fallback').shouldFallbackCrawlDir;
  });

  afterEach(() => {
    jest.dontMock('path');
  });

  test('returns true for regular directories', () => {
    expect(shouldFallbackCrawlDir(p('/project/src'))).toBe(true);
    expect(shouldFallbackCrawlDir(p('/project/lib'))).toBe(true);
  });

  test('returns true for ".." (parent indirection)', () => {
    expect(shouldFallbackCrawlDir(p('/project/..'))).toBe(true);
    expect(shouldFallbackCrawlDir('..')).toBe(true);
  });

  test('returns false for dot-prefixed directories', () => {
    expect(shouldFallbackCrawlDir(p('/project/.git'))).toBe(false);
    expect(shouldFallbackCrawlDir(p('/project/.hg'))).toBe(false);
    expect(shouldFallbackCrawlDir(p('/project/.cache'))).toBe(false);
    expect(shouldFallbackCrawlDir('.hidden')).toBe(false);
  });

  test('returns false for node_modules', () => {
    expect(shouldFallbackCrawlDir(p('/project/node_modules'))).toBe(false);
    expect(shouldFallbackCrawlDir('node_modules')).toBe(false);
  });

  test('returns true for directories containing "node_modules" as a substring', () => {
    expect(shouldFallbackCrawlDir(p('/project/not_node_modules'))).toBe(true);
    expect(shouldFallbackCrawlDir(p('/project/node_modules_extra'))).toBe(true);
  });
});
