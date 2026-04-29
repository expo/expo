import TreeFS from '@expo/metro/metro-file-map/lib/TreeFS';
import type { Resolution } from '@expo/metro/metro-resolver';
import { vol } from 'memfs';
import path from 'path';

import {
  _resolveWithTsConfigPaths,
  _toResolveConfig,
  _loadTsConfigWithExtends,
  type TsConfigResolveConfig,
} from '../createTypescriptResolver';

beforeEach(() => {
  vol.reset();
});

// Build a real TreeFS from the current memfs volume as the depGraph._fileSystem
function createDepGraph(treeRoot: string = '/') {
  const volJson = vol.toJSON();
  const files = new Map<string, [number, number, number, null, number]>();
  for (const absPath of Object.keys(volJson)) {
    const normalPath = path.relative(treeRoot, absPath);
    if (!normalPath.startsWith('..')) {
      files.set(normalPath, [0, 0, 0, null, 0]);
    }
  }
  const treeFS = new TreeFS({ rootDir: treeRoot });
  treeFS.bulkAddOrModify(files);
  return { _fileSystem: treeFS } as any;
}

// Helper to build a TsConfigResolveConfig from a simple paths/baseUrl spec
function buildConfig(spec: {
  paths?: Record<string, string[]>;
  baseUrl?: string;
  pathsBasePath?: string;
  projectRoot?: string;
}): TsConfigResolveConfig {
  return _toResolveConfig(
    {
      paths: spec.paths,
      baseUrl: spec.baseUrl,
      pathsBasePath: spec.pathsBasePath,
    },
    spec.projectRoot ?? '/project'
  )!;
}

const resolved = (filePath: string): Resolution => ({ type: 'sourceFile', filePath });

describe(_toResolveConfig, () => {
  it('returns null for null input', () => {
    expect(_toResolveConfig(null, '/project')).toBeNull();
  });

  it('returns null when no paths and no baseUrl', () => {
    expect(_toResolveConfig({}, '/project')).toBeNull();
  });

  it('returns config for paths only', () => {
    const config = _toResolveConfig({ paths: { '@/*': ['./src/*'] } }, '/project');
    expect(config).not.toBeNull();
    expect(config!.baseUrl).toBeNull();
  });

  it('returns config for baseUrl only', () => {
    const config = _toResolveConfig({ baseUrl: '/src' }, '/project');
    expect(config).not.toBeNull();
    expect(config!.baseUrl).toBe('/src');
  });

  it('creates exact matches for non-wildcard paths', () => {
    const config = buildConfig({ paths: { lodash: ['./vendor/lodash'] } });
    expect(config.exactMatches['lodash']).toEqual(['/project/vendor/lodash']);
  });

  it('creates prefix map for wildcard paths', () => {
    const config = buildConfig({ paths: { '@/*': ['./src/*'] } });
    expect(config.prefixMap['@/']).toEqual([{ suffix: '', mapping: ['/project/src/*'] }]);
    expect(config.prefixRe).not.toBeNull();
  });

  it('filters .d.ts entries', () => {
    const config = buildConfig({
      paths: { '@/*': ['./src/*', './types/*.d.ts'] },
    });
    expect(config.prefixMap['@/'][0].mapping).toEqual(['/project/src/*']);
  });

  it('sorts prefixes longest first', () => {
    const config = buildConfig({
      paths: { '@/*': ['./a/*'], '@/utils/*': ['./b/*'] },
    });
    expect(config.prefixRe!.source).toBe('^(@\\/utils\\/|@\\/)');
  });

  it('uses pathsBasePath when baseUrl is absent', () => {
    const config = _toResolveConfig(
      { paths: { '@/*': ['./src/*'] }, pathsBasePath: '/monorepo' },
      '/project'
    );
    expect(config!.prefixMap['@/'][0].mapping).toEqual(['/monorepo/src/*']);
  });

  it('prefers baseUrl over pathsBasePath', () => {
    const config = _toResolveConfig(
      { paths: { '@/*': ['./src/*'] }, baseUrl: '/custom', pathsBasePath: '/monorepo' },
      '/project'
    );
    expect(config!.prefixMap['@/'][0].mapping).toEqual(['/custom/src/*']);
  });
});

describe(_resolveWithTsConfigPaths, () => {
  function makeResolve(resolvable: Set<string>) {
    return (moduleName: string): Resolution | null =>
      resolvable.has(moduleName) ? resolved(moduleName) : null;
  }

  it('resolves exact match', () => {
    const config = buildConfig({ paths: { lodash: ['./vendor/lodash'] } });
    const result = _resolveWithTsConfigPaths(
      config,
      'lodash',
      makeResolve(new Set(['/project/vendor/lodash']))
    );
    expect(result).toEqual(resolved('/project/vendor/lodash'));
  });

  it('returns null when exact match key exists but nothing resolves', () => {
    const config = buildConfig({ paths: { lodash: ['./vendor/lodash'] } });
    const result = _resolveWithTsConfigPaths(config, 'lodash', makeResolve(new Set()));
    expect(result).toBeNull();
  });

  it('does not fall through from exact match to wildcards', () => {
    const config = buildConfig({
      paths: { lodash: ['./vendor/lodash-WRONG'], '*': ['./*'] },
    });
    const result = _resolveWithTsConfigPaths(
      config,
      'lodash',
      makeResolve(new Set(['/project/lodash']))
    );
    expect(result).toBeNull();
  });

  it('resolves wildcard prefix match', () => {
    const config = buildConfig({ paths: { '@/*': ['./src/*'] } });
    const result = _resolveWithTsConfigPaths(
      config,
      '@/utils',
      makeResolve(new Set(['/project/src/utils']))
    );
    expect(result).toEqual(resolved('/project/src/utils'));
  });

  it('picks longest matching prefix', () => {
    const config = buildConfig({
      paths: { '@/*': ['./a/*'], '@/utils/*': ['./b/*'] },
    });
    const result = _resolveWithTsConfigPaths(
      config,
      '@/utils/helper',
      makeResolve(new Set(['/project/b/helper']))
    );
    expect(result).toEqual(resolved('/project/b/helper'));
  });

  it('handles suffix matching', () => {
    const config = buildConfig({ paths: { '*.css': ['./styles/*.css'] } });
    const result = _resolveWithTsConfigPaths(
      config,
      'button.css',
      makeResolve(new Set(['/project/styles/button.css']))
    );
    expect(result).toEqual(resolved('/project/styles/button.css'));
  });

  it('does not match when suffix is wrong', () => {
    const config = buildConfig({ paths: { '*.css': ['./styles/*.css'] } });
    const result = _resolveWithTsConfigPaths(
      config,
      'button.js',
      makeResolve(new Set(['/project/styles/button.js']))
    );
    expect(result).toBeNull();
  });

  it('tries "*" catch-all after a more specific prefix fails', () => {
    const config = buildConfig({
      paths: { '@/*': ['./src/*'], '*': ['./*'] },
    });
    const result = _resolveWithTsConfigPaths(
      config,
      '@/utils',
      makeResolve(new Set(['/project/@/utils']))
    );
    expect(result).toEqual(resolved('/project/@/utils'));
  });

  it('catch-all fallthrough respects suffix matching', () => {
    const config = buildConfig({
      paths: { '@/*': ['./src/*'], '*.css': ['./styles/*.css'] },
    });
    // @/button.css fails via @/ prefix, falls through to *.css catch-all
    const result = _resolveWithTsConfigPaths(
      config,
      '@/button.css',
      makeResolve(new Set(['/project/styles/@/button.css']))
    );
    expect(result).toEqual(resolved('/project/styles/@/button.css'));
  });

  it('catch-all fallthrough skips entries with wrong suffix', () => {
    const config = buildConfig({
      paths: { '@/*': ['./src/*'], '*.css': ['./styles/*.css'] },
    });
    // @/utils fails via @/ prefix, falls through to *.css catch-all but suffix doesn't match
    const result = _resolveWithTsConfigPaths(
      config,
      '@/utils',
      makeResolve(new Set(['/project/styles/@/utils.css']))
    );
    expect(result).toBeNull();
  });

  it('does not retry "*" catch-all when it was the matched prefix', () => {
    const config = buildConfig({ paths: { '*': ['./vendor/*'] } });
    const resolve = jest.fn(() => null);
    const result = _resolveWithTsConfigPaths(config, 'lodash', resolve);
    expect(result).toBeNull();
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it('falls back to baseUrl when no prefix matches', () => {
    const config = buildConfig({ baseUrl: '/src', paths: { '@/*': ['./lib/*'] } });
    const result = _resolveWithTsConfigPaths(config, 'utils', makeResolve(new Set(['/src/utils'])));
    expect(result).toEqual(resolved('/src/utils'));
  });

  it('does not try baseUrl after prefix match consumed the name', () => {
    const config = buildConfig({ baseUrl: '/src', paths: { '@/*': ['./lib/*'] } });
    const result = _resolveWithTsConfigPaths(
      config,
      '@/utils',
      makeResolve(new Set(['/src/@/utils']))
    );
    expect(result).toBeNull();
  });

  it('returns null when nothing matches and no baseUrl', () => {
    const config = buildConfig({ paths: { '@/*': ['./src/*'] } });
    const result = _resolveWithTsConfigPaths(config, 'lodash', makeResolve(new Set()));
    expect(result).toBeNull();
  });

  it('tries multiple mapping entries for a pattern', () => {
    const config = buildConfig({
      paths: { '@/*': ['./src/*', './lib/*'] },
    });
    const result = _resolveWithTsConfigPaths(
      config,
      '@/utils',
      makeResolve(new Set(['/project/lib/utils']))
    );
    expect(result).toEqual(resolved('/project/lib/utils'));
  });
});

describe(_loadTsConfigWithExtends, () => {
  it('loads a simple tsconfig with paths and baseUrl', () => {
    vol.fromJSON(
      {
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            baseUrl: '.',
            paths: { '@/*': ['./src/*'] },
          },
        }),
      },
      '/project'
    );
    const result = _loadTsConfigWithExtends(
      '/project',
      '/project/tsconfig.json',
      createDepGraph('/project')
    );
    expect(result).toMatchObject({
      baseUrl: '/project',
      paths: { '@/*': ['./src/*'] },
    });
  });

  it('inherits paths from an extended config', () => {
    vol.fromJSON(
      {
        'tsconfig.json': JSON.stringify({ extends: './tsconfig.base.json' }),
        'tsconfig.base.json': JSON.stringify({
          compilerOptions: {
            paths: { '@shared/*': ['./packages/shared/src/*'] },
          },
        }),
      },
      '/project'
    );
    const result = _loadTsConfigWithExtends(
      '/project',
      '/project/tsconfig.json',
      createDepGraph('/project')
    );
    expect(result).toMatchObject({
      paths: { '@shared/*': ['./packages/shared/src/*'] },
    });
  });

  it('child paths override parent paths', () => {
    vol.fromJSON(
      {
        'tsconfig.json': JSON.stringify({
          extends: './base.json',
          compilerOptions: { paths: { '@/*': ['./child/*'] } },
        }),
        'base.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./parent/*'] } },
        }),
      },
      '/project'
    );
    const result = _loadTsConfigWithExtends(
      '/project',
      '/project/tsconfig.json',
      createDepGraph('/project')
    );
    expect(result!.paths).toEqual({ '@/*': ['./child/*'] });
  });

  it('handles array extends (TS 5.0+), last wins', () => {
    vol.fromJSON(
      {
        'tsconfig.json': JSON.stringify({
          extends: ['./a.json', './b.json'],
        }),
        'a.json': JSON.stringify({
          compilerOptions: { baseUrl: './from-a' },
        }),
        'b.json': JSON.stringify({
          compilerOptions: { baseUrl: './from-b' },
        }),
      },
      '/project'
    );
    const result = _loadTsConfigWithExtends(
      '/project',
      '/project/tsconfig.json',
      createDepGraph('/project')
    );
    expect(result!.baseUrl).toBe('/project/from-b');
  });

  it('tracks pathsBasePath as the directory of the config that defines paths', () => {
    vol.fromJSON({
      '/monorepo/tsconfig.base.json': JSON.stringify({
        compilerOptions: {
          paths: { '@shared/*': ['./packages/shared/src/*'] },
        },
      }),
      '/monorepo/packages/app/tsconfig.json': JSON.stringify({
        extends: '../../tsconfig.base.json',
      }),
    });
    const result = _loadTsConfigWithExtends(
      '/monorepo/packages/app',
      '/monorepo/packages/app/tsconfig.json',
      createDepGraph('/monorepo')
    );
    expect(result!.pathsBasePath).toBe('/monorepo');
  });

  it('substitutes ${configDir} in baseUrl using root config directory', () => {
    vol.fromJSON(
      {
        'tsconfig.json': JSON.stringify({
          compilerOptions: { baseUrl: '${configDir}/src' },
        }),
      },
      '/project'
    );
    const result = _loadTsConfigWithExtends(
      '/project',
      '/project/tsconfig.json',
      createDepGraph('/project')
    );
    expect(result!.baseUrl).toBe('/project/src');
  });

  it('substitutes ${configDir} in paths values', () => {
    vol.fromJSON(
      {
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            paths: { '@/*': ['${configDir}/src/*'] },
          },
        }),
      },
      '/project'
    );
    const result = _loadTsConfigWithExtends(
      '/project',
      '/project/tsconfig.json',
      createDepGraph('/project')
    );
    // substituteConfigDir replaces ${configDir} with './' so the raw value is './/src/*'
    // path.join in toResolveConfig normalizes this when building the resolve config
    expect(result!.paths!['@/*']).toEqual(['.//src/*']);
  });

  it('detects circular extends', () => {
    vol.fromJSON(
      {
        'a.json': JSON.stringify({ extends: './b.json' }),
        'b.json': JSON.stringify({ extends: './a.json' }),
      },
      '/project'
    );
    const result = _loadTsConfigWithExtends(
      '/project',
      '/project/a.json',
      createDepGraph('/project')
    );
    expect(result).not.toBeNull();
  });

  it('tracks all config paths for the watcher', () => {
    vol.fromJSON({
      '/project/tsconfig.json': JSON.stringify({ extends: './base.json' }),
      '/project/base.json': JSON.stringify({
        compilerOptions: { paths: { '@/*': ['./src/*'] } },
      }),
    });
    const result = _loadTsConfigWithExtends(
      '/project',
      '/project/tsconfig.json',
      createDepGraph('/project')
    );
    expect(result!.configNormalPaths).toBeInstanceOf(Set);
    expect(result!.configNormalPaths!.size).toBe(2);
    expect(result!.configNormalPaths!.has('tsconfig.json')).toBe(true);
    expect(result!.configNormalPaths!.has('base.json')).toBe(true);
  });

  it('resolves extends with .json appended', () => {
    vol.fromJSON(
      {
        'tsconfig.json': JSON.stringify({ extends: './base' }),
        'base.json': JSON.stringify({
          compilerOptions: { baseUrl: '.' },
        }),
      },
      '/project'
    );
    const result = _loadTsConfigWithExtends(
      '/project',
      '/project/tsconfig.json',
      createDepGraph('/project')
    );
    expect(result!.baseUrl).toBe('/project');
  });

  it('returns empty paths/baseUrl when config has no compilerOptions', () => {
    vol.fromJSON({ 'tsconfig.json': JSON.stringify({}) }, '/project');
    const result = _loadTsConfigWithExtends(
      '/project',
      '/project/tsconfig.json',
      createDepGraph('/project')
    );
    expect(result!.baseUrl).toBeUndefined();
    expect(result!.paths).toBeUndefined();
  });

  it('resolves extends from node_modules package with tsconfig.json', () => {
    vol.fromJSON({
      '/project/tsconfig.json': JSON.stringify({
        extends: '@tsconfig/node20',
      }),
      '/project/node_modules/@tsconfig/node20/tsconfig.json': JSON.stringify({
        compilerOptions: { baseUrl: '.' },
      }),
    });
    const result = _loadTsConfigWithExtends(
      '/project',
      '/project/tsconfig.json',
      createDepGraph('/project')
    );
    expect(result!.baseUrl).toBe('/project');
  });

  it('resolves extends from node_modules with .json appended', () => {
    vol.fromJSON({
      '/project/tsconfig.json': JSON.stringify({
        extends: '@tsconfig/strictest',
      }),
      '/project/node_modules/@tsconfig/strictest.json': JSON.stringify({
        compilerOptions: { paths: { '@/*': ['./src/*'] } },
      }),
    });
    const result = _loadTsConfigWithExtends(
      '/project',
      '/project/tsconfig.json',
      createDepGraph('/project')
    );
    expect(result!.paths).toEqual({ '@/*': ['./src/*'] });
  });

  it('inherits baseUrl from parent while child defines own paths', () => {
    vol.fromJSON(
      {
        'tsconfig.json': JSON.stringify({
          extends: './base.json',
          compilerOptions: { paths: { '@/*': ['./src/*'] } },
        }),
        'base.json': JSON.stringify({
          compilerOptions: { baseUrl: './custom-base' },
        }),
      },
      '/project'
    );
    const result = _loadTsConfigWithExtends(
      '/project',
      '/project/tsconfig.json',
      createDepGraph('/project')
    );
    expect(result!.baseUrl).toBe('/project/custom-base');
    expect(result!.paths).toEqual({ '@/*': ['./src/*'] });
    expect(result!.pathsBasePath).toBe('/project');
  });

  it('filters non-string values in paths entries', () => {
    vol.fromJSON(
      {
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            paths: { '@/*': ['./src/*', 123, null, './lib/*'] },
          },
        }),
      },
      '/project'
    );
    const result = _loadTsConfigWithExtends(
      '/project',
      '/project/tsconfig.json',
      createDepGraph('/project')
    );
    expect(result!.paths!['@/*']).toEqual(['./src/*', './lib/*']);
  });

  it('substitutes ${configDir} in paths from extended config using that config dir', () => {
    vol.fromJSON({
      '/monorepo/packages/app/tsconfig.json': JSON.stringify({
        extends: '../../tsconfig.base.json',
      }),
      '/monorepo/tsconfig.base.json': JSON.stringify({
        compilerOptions: {
          paths: { '@shared/*': ['${configDir}/packages/shared/src/*'] },
        },
      }),
    });
    const result = _loadTsConfigWithExtends(
      '/monorepo/packages/app',
      '/monorepo/packages/app/tsconfig.json',
      createDepGraph('/monorepo')
    );
    expect(result!.paths!['@shared/*']).toEqual(['.//packages/shared/src/*']);
  });
});
