import { vol } from 'memfs';
import path from 'path';

import { convertEntryPointToRelative } from '../paths';

jest.mock('fs', () => require('memfs').fs);
jest.mock('node:fs', () => require('memfs').fs);

let mockWorkspaceRoot: string | null = null;
jest.mock('resolve-workspace-root', () => ({
  resolveWorkspaceRoot: () => mockWorkspaceRoot,
  getWorkspaceGlobs: () => null,
}));

// Uses unique project roots per test to avoid the `_metroServerRootCache`
let testId = 0;
function setup(opts: {
  files?: Record<string, string>;
  symlinks?: Record<string, string>;
  workspaceRoot?: string;
}) {
  const id = String(++testId);
  const prefix = `/test${id}`;
  const files: Record<string, string> = {};
  for (const [key, value] of Object.entries(opts.files ?? {})) {
    files[prefix + key] = value;
  }
  vol.fromJSON(files, '/');
  for (const [linkPath, target] of Object.entries(opts.symlinks ?? {})) {
    vol.mkdirSync(path.dirname(prefix + linkPath), { recursive: true });
    vol.symlinkSync(prefix + target, prefix + linkPath);
  }
  mockWorkspaceRoot = opts.workspaceRoot ? prefix + opts.workspaceRoot : null;
  return (p: string) => prefix + p;
}

describe(convertEntryPointToRelative, () => {
  afterEach(() => {
    vol.reset();
    mockWorkspaceRoot = null;
  });

  it('returns relative path from project root', () => {
    const p = setup({ files: { '/project/app/index.js': '' } });
    expect(convertEntryPointToRelative(p('/project'), p('/project/app/index.js'))).toBe(
      'app/index'
    );
  });

  it('strips custom extension', () => {
    const p = setup({ files: { '/project/app/index.ts': '' } });
    expect(convertEntryPointToRelative(p('/project'), p('/project/app/index.ts'), '.ts')).toBe(
      'app/index'
    );
  });

  it('does not strip extension when extname is null', () => {
    const p = setup({ files: { '/project/app/index.js': '' } });
    expect(convertEntryPointToRelative(p('/project'), p('/project/app/index.js'), null)).toBe(
      'app/index.js'
    );
  });

  it('uses realServerRoot when absolutePath starts with it', () => {
    const p = setup({
      files: { '/real/project/index.js': '' },
      symlinks: { '/linked/project': '/real/project' },
      workspaceRoot: '/linked/project',
    });
    // absolutePath uses the real path, serverRoot is the symlink
    expect(convertEntryPointToRelative(p('/linked/project'), p('/real/project/index.js'))).toBe(
      'index'
    );
  });

  it('preserves symlinked serverRoot when absolutePath already matches it', () => {
    const p = setup({
      files: { '/real/project/index.js': '' },
      symlinks: { '/linked/project': '/real/project' },
      workspaceRoot: '/linked/project',
    });
    // absolutePath uses the symlinked path
    expect(convertEntryPointToRelative(p('/linked/project'), p('/linked/project/index.js'))).toBe(
      'index'
    );
  });

  it('preserves symlinks below the server root', () => {
    const p = setup({
      files: { '/real/monorepo/packages/real-app/index.js': '' },
      symlinks: {
        '/real/monorepo/packages/linked-app': '/real/monorepo/packages/real-app',
      },
      workspaceRoot: '/real/monorepo',
    });
    expect(
      convertEntryPointToRelative(
        p('/real/monorepo/packages/real-app'),
        p('/real/monorepo/packages/linked-app/index.js')
      )
    ).toBe('packages/linked-app/index');
  });

  it('resolves symlinked absolutePath when it matches realServerRoot', () => {
    const p = setup({
      files: { '/real/monorepo/packages/app/index.js': '' },
      symlinks: {
        '/linked/monorepo': '/real/monorepo',
        '/other-link/index.js': '/real/monorepo/packages/app/index.js',
      },
      workspaceRoot: '/linked/monorepo',
    });
    // absolutePath is a symlink outside both roots, but resolves under realServerRoot
    expect(
      convertEntryPointToRelative(p('/linked/monorepo/packages/app'), p('/other-link/index.js'))
    ).toBe('packages/app/index');
  });

  it('handles non-existent absolutePath under serverRoot', () => {
    const p = setup({
      files: { '/real/project/.gitkeep': '' },
      symlinks: { '/linked/project': '/real/project' },
      workspaceRoot: '/linked/project',
    });
    expect(convertEntryPointToRelative(p('/linked/project'), p('/linked/project/missing.js'))).toBe(
      'missing'
    );
  });

  it('handles non-existent absolutePath under realServerRoot', () => {
    const p = setup({
      files: { '/real/project/.gitkeep': '' },
      symlinks: { '/linked/project': '/real/project' },
      workspaceRoot: '/linked/project',
    });
    expect(convertEntryPointToRelative(p('/linked/project'), p('/real/project/missing.js'))).toBe(
      'missing'
    );
  });

  it('handles non-existent absolutePath outside both roots', () => {
    const p = setup({
      files: { '/real/project/.gitkeep': '' },
      symlinks: { '/linked/project': '/real/project' },
      workspaceRoot: '/linked/project',
    });
    expect(convertEntryPointToRelative(p('/linked/project'), p('/nowhere/missing.js'))).toContain(
      'missing'
    );
  });

  it('handles non-existent serverRoot', () => {
    const p = setup({
      files: {},
      workspaceRoot: '/does-not-exist',
    });
    expect(convertEntryPointToRelative(p('/does-not-exist'), p('/does-not-exist/index.js'))).toBe(
      'index'
    );
  });

  it('falls back to realpath for both when absolutePath is outside both roots', () => {
    const p = setup({
      files: {
        '/real/monorepo/packages/app/index.js': '',
        '/real/external/index.js': '',
      },
      symlinks: {
        '/linked/monorepo': '/real/monorepo',
        '/linked/external': '/real/external',
      },
      workspaceRoot: '/linked/monorepo',
    });
    // absolutePath resolves outside the server root entirely
    const result = convertEntryPointToRelative(
      p('/linked/monorepo/packages/app'),
      p('/linked/external/index.js')
    );
    expect(result).toContain('external/index');
  });

  it('returns relative path in monorepo with serverRoot above projectRoot', () => {
    const p = setup({
      files: { '/monorepo/packages/app/index.js': '' },
      workspaceRoot: '/monorepo',
    });
    expect(
      convertEntryPointToRelative(p('/monorepo/packages/app'), p('/monorepo/packages/app/index.js'))
    ).toBe('packages/app/index');
  });
});
