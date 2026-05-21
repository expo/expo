import { vol } from 'memfs';
import Module from 'node:module';

import { resolveFrom } from '../resolve';

beforeEach(() => {
  vol.reset();
});

describe('direct path resolution', () => {
  it('returns the exact resolved path when the file exists', () => {
    vol.fromJSON({ '/proj/a.js': '' });
    expect(resolveFrom('/proj', './a.js')).toBe('/proj/a.js');
  });

  it('resolves moduleId relative to fromDirectory', () => {
    vol.fromJSON({ '/proj/sub/a.js': '' });
    expect(resolveFrom('/proj/sub', './a.js')).toBe('/proj/sub/a.js');
  });

  it('resolves a parent-relative specifier', () => {
    vol.fromJSON({ '/proj/a.js': '' });
    expect(resolveFrom('/proj/sub', '../a.js')).toBe('/proj/a.js');
  });

  it('accepts an absolute moduleId', () => {
    vol.fromJSON({ '/abs/a.js': '' });
    expect(resolveFrom('/proj', '/abs/a.js')).toBe('/abs/a.js');
  });

  it('does not return a directory as a direct match', () => {
    vol.fromJSON({ '/proj/dir/keep': '' });
    expect(resolveFrom('/proj', './dir')).toBeNull();
  });
});

describe('extension fallback', () => {
  it('appends each provided extension and returns the first match', () => {
    vol.fromJSON({ '/proj/a.js': '' });
    expect(resolveFrom('/proj', './a', { extensions: ['.ts', '.js'] })).toBe('/proj/a.js');
  });

  it('respects the order of the provided extensions', () => {
    vol.fromJSON({ '/proj/a.ts': '', '/proj/a.js': '' });
    expect(resolveFrom('/proj', './a', { extensions: ['.ts', '.js'] })).toBe('/proj/a.ts');
    expect(resolveFrom('/proj', './a', { extensions: ['.js', '.ts'] })).toBe('/proj/a.js');
  });

  it('normalizes extensions that omit the leading dot', () => {
    vol.fromJSON({ '/proj/a.ts': '' });
    expect(resolveFrom('/proj', './a', { extensions: ['ts'] })).toBe('/proj/a.ts');
  });

  it('falls back to default extensions when none are provided', () => {
    vol.fromJSON({ '/proj/a.js': '' });
    expect(Object.keys(Module._extensions)).toContain('.js');
    expect(resolveFrom('/proj', './a')).toBe('/proj/a.js');
  });

  it('returns null for an unresolved file specifier with no extension match', () => {
    vol.fromJSON({ '/proj/a.ts': '' });
    expect(resolveFrom('/proj', './a', { extensions: ['.js'] })).toBeNull();
  });

  it('accepts an empty extensions array', () => {
    vol.fromJSON({ '/proj/a.js': '' });
    expect(resolveFrom('/proj', './a', { extensions: [] })).toBeNull();
    expect(resolveFrom('/proj', './a.js', { extensions: [] })).toBe('/proj/a.js');
  });
});

describe('/index fallback for file specifiers', () => {
  it('returns <dir>/index.<ext> when the file specifier resolves to a directory', () => {
    vol.fromJSON({ '/proj/pkg/index.js': '' });
    expect(resolveFrom('/proj', './pkg')).toBe('/proj/pkg/index.js');
  });

  it('returns the /index file for moduleId "."', () => {
    vol.fromJSON({ '/proj/index.js': '' });
    expect(resolveFrom('/proj', '.')).toBe('/proj/index.js');
  });

  it('returns the /index file for moduleId ".."', () => {
    vol.fromJSON({ '/index.js': '' });
    expect(resolveFrom('/proj', '..')).toBe('/index.js');
  });

  it('returns the /index file for an absolute directory moduleId', () => {
    vol.fromJSON({ '/abs/pkg/index.js': '' });
    expect(resolveFrom('/proj', '/abs/pkg')).toBe('/abs/pkg/index.js');
  });

  it('honors the order of extensions for /index resolution', () => {
    vol.fromJSON({ '/proj/pkg/index.ts': '', '/proj/pkg/index.js': '' });
    expect(resolveFrom('/proj', './pkg', { extensions: ['.ts', '.js'] })).toBe(
      '/proj/pkg/index.ts'
    );
    expect(resolveFrom('/proj', './pkg', { extensions: ['.js', '.ts'] })).toBe(
      '/proj/pkg/index.js'
    );
  });

  it('does not try /index when the directory does not exist', () => {
    vol.fromJSON({ '/proj/keep': '' });
    expect(resolveFrom('/proj', './missing')).toBeNull();
  });

  it('does not try /index for .json moduleIds', () => {
    vol.fromJSON({ '/proj/pkg/index.json': '' });
    expect(resolveFrom('/proj', './pkg.json')).toBeNull();
  });

  it('tries /index when skipNodePath is enabled even for non-file specifiers', () => {
    vol.fromJSON({ '/proj/pkg/index.js': '' });
    expect(resolveFrom('/proj', 'pkg', { skipNodePath: true })).toBe('/proj/pkg/index.js');
  });
});

describe('file specifier short-circuit', () => {
  it('returns null for relative specifiers that miss, without consulting node_modules', () => {
    vol.fromJSON({ '/proj/node_modules/missing/index.js': '' });
    expect(resolveFrom('/proj', './missing')).toBeNull();
  });

  it('returns null for absolute specifiers that miss, without consulting node_modules', () => {
    vol.fromJSON({ '/proj/node_modules/missing/index.js': '' });
    expect(resolveFrom('/proj', '/absent/missing')).toBeNull();
  });
});

describe('node_modules walking', () => {
  it('resolves a bare specifier with an extension from node_modules', () => {
    vol.fromJSON({ '/proj/node_modules/pkg.js': '' });
    expect(resolveFrom('/proj', 'pkg')).toBe('/proj/node_modules/pkg.js');
  });

  it('resolves the /index file of a package directory from node_modules', () => {
    vol.fromJSON({ '/proj/node_modules/pkg/index.js': '' });
    expect(resolveFrom('/proj', 'pkg')).toBe('/proj/node_modules/pkg/index.js');
  });

  it('resolves a subpath inside a package', () => {
    vol.fromJSON({ '/proj/node_modules/pkg/sub.js': '' });
    expect(resolveFrom('/proj', 'pkg/sub')).toBe('/proj/node_modules/pkg/sub.js');
  });

  it('resolves a subpath /index inside a package', () => {
    vol.fromJSON({ '/proj/node_modules/pkg/sub/index.js': '' });
    expect(resolveFrom('/proj', 'pkg/sub')).toBe('/proj/node_modules/pkg/sub/index.js');
  });

  it('resolves a scoped package', () => {
    vol.fromJSON({ '/proj/node_modules/@scope/pkg/index.js': '' });
    expect(resolveFrom('/proj', '@scope/pkg')).toBe('/proj/node_modules/@scope/pkg/index.js');
  });

  it('walks up to ancestor node_modules folders', () => {
    vol.fromJSON({ '/proj/sub/dir/keep': '', '/node_modules/pkg/index.js': '' });
    expect(resolveFrom('/proj/sub/dir', 'pkg')).toBe('/node_modules/pkg/index.js');
  });

  it('returns the direct file match path as-is', () => {
    vol.fromJSON({ '/proj/node_modules/pkg': '' });
    expect(resolveFrom('/proj', 'pkg')).toBe('/proj/node_modules/pkg');
  });

  it('does not /index-resolve inside node_modules for .json moduleIds', () => {
    vol.fromJSON({ '/proj/node_modules/pkg/index.json': '' });
    expect(resolveFrom('/proj', 'pkg.json')).toBeNull();
  });

  it('skips node_modules walking when followSymlinks is true and skipNodePath is false', () => {
    vol.fromJSON({ '/proj/node_modules/pkg/index.js': '' });
    const spy = jest.spyOn(Module, '_resolveFilename').mockReturnValue('/native');
    try {
      expect(resolveFrom('/proj', 'pkg', { followSymlinks: true })).toBe('/native');
    } finally {
      spy.mockRestore();
    }
  });

  it('walks node_modules when followSymlinks is true and skipNodePath is true', () => {
    vol.fromJSON({ '/proj/node_modules/pkg/index.js': '' });
    expect(resolveFrom('/proj', 'pkg', { followSymlinks: true, skipNodePath: true })).toBe(
      '/proj/node_modules/pkg/index.js'
    );
  });
});

describe('followSymlinks option', () => {
  it('returns the symlinked extension match when followSymlinks is false', () => {
    vol.fromJSON({ '/real/pkg.js': '' });
    vol.mkdirSync('/proj/node_modules', { recursive: true });
    vol.symlinkSync('/real/pkg.js', '/proj/node_modules/pkg.js');
    expect(resolveFrom('/proj', 'pkg', { followSymlinks: false, skipNodePath: true })).toBe(
      '/proj/node_modules/pkg.js'
    );
  });

  it('returns the realpath of an extension match when followSymlinks is true', () => {
    vol.fromJSON({ '/real/pkg.js': '' });
    vol.mkdirSync('/proj/node_modules', { recursive: true });
    vol.symlinkSync('/real/pkg.js', '/proj/node_modules/pkg.js');
    expect(resolveFrom('/proj', 'pkg', { followSymlinks: true, skipNodePath: true })).toBe(
      '/real/pkg.js'
    );
  });

  it('returns the realpath of an /index match in node_modules when followSymlinks is true', () => {
    vol.fromJSON({ '/real/index.js': '' });
    vol.mkdirSync('/proj/node_modules/pkg', { recursive: true });
    vol.symlinkSync('/real/index.js', '/proj/node_modules/pkg/index.js');
    expect(resolveFrom('/proj', 'pkg', { followSymlinks: true, skipNodePath: true })).toBe(
      '/real/index.js'
    );
  });

  it('does not realpath /index matches in the file specifier path', () => {
    vol.fromJSON({ '/real/index.js': '' });
    vol.mkdirSync('/proj/pkg', { recursive: true });
    vol.symlinkSync('/real/index.js', '/proj/pkg/index.js');
    expect(resolveFrom('/proj', './pkg', { followSymlinks: true })).toBe('/proj/pkg/index.js');
  });

  it('defaults followSymlinks to the resolved skipNodePath value', () => {
    vol.fromJSON({ '/real/pkg.js': '' });
    vol.mkdirSync('/proj/node_modules', { recursive: true });
    vol.symlinkSync('/real/pkg.js', '/proj/node_modules/pkg.js');
    expect(resolveFrom('/proj', 'pkg', { skipNodePath: true })).toBe('/real/pkg.js');
  });
});

describe('JSON handling', () => {
  it('resolves a .json file by exact path without trying extensions', () => {
    vol.fromJSON({ '/proj/a.json': '' });
    expect(resolveFrom('/proj', './a.json')).toBe('/proj/a.json');
  });

  it('does not append extensions for .json moduleIds', () => {
    vol.fromJSON({ '/proj/a.json.js': '' });
    expect(resolveFrom('/proj', './a.json')).toBeNull();
  });

  it('resolves a .json file from node_modules', () => {
    vol.fromJSON({ '/proj/node_modules/pkg/data.json': '' });
    expect(resolveFrom('/proj', 'pkg/data.json')).toBe('/proj/node_modules/pkg/data.json');
  });

  it('allows skipNodePath=false to consult native resolution for /package.json', () => {
    const spy = jest.spyOn(Module, '_resolveFilename').mockReturnValue('/native/pkg/package.json');
    try {
      expect(resolveFrom('/proj', 'pkg/package.json', { skipNodePath: false })).toBe(
        '/native/pkg/package.json'
      );
    } finally {
      spy.mockRestore();
    }
  });

  it('keeps skipNodePath at false for bare .json moduleIds without a /package.json suffix', () => {
    const spy = jest.spyOn(Module, '_resolveFilename').mockReturnValue('/native/a.json');
    try {
      expect(resolveFrom('/proj', 'a.json')).toBe('/native/a.json');
    } finally {
      spy.mockRestore();
    }
  });
});

describe('native Node fallback', () => {
  it('invokes Module._resolveFilename when internal lookup fails', () => {
    const spy = jest.spyOn(Module, '_resolveFilename').mockReturnValue('/native/pkg.js');
    try {
      expect(resolveFrom('/proj', 'pkg')).toBe('/native/pkg.js');
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });

  it('returns null when Module._resolveFilename throws', () => {
    const spy = jest.spyOn(Module, '_resolveFilename').mockImplementation(() => {
      throw new Error('MODULE_NOT_FOUND');
    });
    try {
      expect(resolveFrom('/proj', 'pkg')).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });

  it('skips the native fallback when skipNodePath is true', () => {
    const spy = jest.spyOn(Module, '_resolveFilename');
    try {
      expect(resolveFrom('/proj', 'pkg', { skipNodePath: true })).toBeNull();
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('symlink type detection', () => {
  it('treats a symlink-to-file as a file in the direct match path', () => {
    vol.fromJSON({ '/real/a.js': '' });
    vol.mkdirSync('/proj', { recursive: true });
    vol.symlinkSync('/real/a.js', '/proj/a.js');
    expect(resolveFrom('/proj', './a.js')).toBe('/proj/a.js');
  });

  it('treats a symlink-to-directory as not existing for /index fallback', () => {
    vol.fromJSON({ '/real/pkg/index.js': '' });
    vol.mkdirSync('/proj', { recursive: true });
    vol.symlinkSync('/real/pkg', '/proj/pkg');
    expect(resolveFrom('/proj', './pkg')).toBeNull();
  });

  it('treats a broken symlink as not existing', () => {
    vol.mkdirSync('/proj', { recursive: true });
    vol.symlinkSync('/real/missing.js', '/proj/a.js');
    expect(resolveFrom('/proj', './a.js')).toBeNull();
  });
});
