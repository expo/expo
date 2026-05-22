import { vol } from 'memfs';
import path from 'node:path';

import { loadUserConfig } from '../loadUserConfig';

// NOTE: Bypass `require()` so the test loader reads from memfs and evaluates inline.
jest.mock('@expo/require-utils', () => {
  const actual = jest.requireActual<typeof import('@expo/require-utils')>('@expo/require-utils');
  return {
    ...actual,
    loadModuleSync(filename: string) {
      const code = require('fs').readFileSync(filename, 'utf8');
      return actual.evalModule(code, filename, { cache: false });
    },
  };
});

const cwdSpy = jest.spyOn(process, 'cwd');

// NOTE: `loadUserConfig.ts` caches resolved paths by projectRoot at the module level.
// Tests rely on a unique projectRoot per test to avoid cross-test cache pollution.
let counter = 0;
let serverRoot: string;
let projectRoot: string;

beforeEach(() => {
  counter += 1;
  serverRoot = `/t${counter}`;
  projectRoot = serverRoot;
});

afterEach(() => {
  vol.reset();
  cwdSpy.mockReset();
});

describe(loadUserConfig, () => {
  it('returns an empty result when no config is found', async () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });

    const result = await loadUserConfig({ projectRoot, serverRoot });

    expect(result.isEmpty).toBe(true);
    expect(result.filepath).toBe(path.join(projectRoot, 'metro.config.stub.js'));
    expect(result.config).toEqual({});
  });

  it('loads metro.config.js from projectRoot', async () => {
    vol.fromJSON({
      [`${projectRoot}/metro.config.js`]: 'module.exports = { cacheVersion: "js" };',
    });

    const result = await loadUserConfig({ projectRoot, serverRoot });

    expect(result.isEmpty).toBe(false);
    expect(result.filepath).toBe(path.join(projectRoot, 'metro.config.js'));
    expect(result.config).toEqual({ cacheVersion: 'js' });
  });

  it('loads metro.config.json from projectRoot', async () => {
    vol.fromJSON({
      [`${projectRoot}/metro.config.json`]: JSON.stringify({ cacheVersion: 'json' }),
    });

    const result = await loadUserConfig({ projectRoot, serverRoot });

    expect(result.filepath).toBe(path.join(projectRoot, 'metro.config.json'));
    expect(result.config).toEqual({ cacheVersion: 'json' });
  });

  it('loads metro.config.ts via TypeScript transpilation', async () => {
    vol.fromJSON({
      [`${projectRoot}/metro.config.ts`]:
        'const cfg: { cacheVersion: string } = { cacheVersion: "ts" }; export default cfg;',
    });

    const result = await loadUserConfig({ projectRoot, serverRoot });

    expect(result.config).toEqual({ cacheVersion: 'ts' });
  });

  it('unwraps __esModule default exports', async () => {
    vol.fromJSON({
      [`${projectRoot}/metro.config.js`]:
        'Object.defineProperty(exports, "__esModule", { value: true }); exports.default = { cacheVersion: "esm" };',
    });

    const result = await loadUserConfig({ projectRoot, serverRoot });

    expect(result.config).toEqual({ cacheVersion: 'esm' });
  });

  it('preserves function-style config exports', async () => {
    vol.fromJSON({
      [`${projectRoot}/metro.config.js`]: 'module.exports = (base) => ({ cacheVersion: "fn" });',
    });

    const result = await loadUserConfig({ projectRoot, serverRoot });

    expect(typeof result.config).toBe('function');
    expect((result.config as any)({})).toEqual({ cacheVersion: 'fn' });
  });

  it('loads .config/metro.[ext] when no metro.config.* exists', async () => {
    vol.fromJSON({
      [`${projectRoot}/.config/metro.js`]: 'module.exports = { cacheVersion: "dotconfig" };',
    });

    const result = await loadUserConfig({ projectRoot, serverRoot });

    expect(result.filepath).toBe(path.join(projectRoot, '.config', 'metro.js'));
    expect(result.config).toEqual({ cacheVersion: 'dotconfig' });
  });

  it('loads package.json:metro when no metro.config.* exists', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({ metro: { cacheVersion: 'pkg' } }),
    });

    const result = await loadUserConfig({ projectRoot, serverRoot });

    expect(result.filepath).toBe(path.join(projectRoot, 'package.json'));
    expect(result.config).toEqual({ cacheVersion: 'pkg' });
  });

  it('ignores package.json without a metro key', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({ name: 'app' }),
    });

    const result = await loadUserConfig({ projectRoot, serverRoot });

    expect(result.isEmpty).toBe(true);
  });

  it('prefers metro.config.js over metro.config.json at the same level', async () => {
    vol.fromJSON({
      [`${projectRoot}/metro.config.js`]: 'module.exports = { from: "js" };',
      [`${projectRoot}/metro.config.json`]: JSON.stringify({ from: 'json' }),
    });

    const result = await loadUserConfig({ projectRoot, serverRoot });

    expect(result.config).toEqual({ from: 'js' });
  });

  it('prefers metro.config.* over .config/metro.*', async () => {
    vol.fromJSON({
      [`${projectRoot}/metro.config.js`]: 'module.exports = { from: "metro.config" };',
      [`${projectRoot}/.config/metro.js`]: 'module.exports = { from: "dotconfig" };',
    });

    const result = await loadUserConfig({ projectRoot, serverRoot });

    expect(result.config).toEqual({ from: 'metro.config' });
  });

  it('prefers metro.config.* over package.json:metro', async () => {
    vol.fromJSON({
      [`${projectRoot}/metro.config.js`]: 'module.exports = { from: "metro.config" };',
      [`${projectRoot}/package.json`]: JSON.stringify({ metro: { from: 'pkg' } }),
    });

    const result = await loadUserConfig({ projectRoot, serverRoot });

    expect(result.config).toEqual({ from: 'metro.config' });
  });

  it('searches upward from projectRoot up to serverRoot', async () => {
    projectRoot = `${serverRoot}/packages/app`;
    vol.fromJSON({
      [`${serverRoot}/metro.config.js`]: 'module.exports = { cacheVersion: "workspace" };',
      [`${projectRoot}/package.json`]: '{}',
    });

    const result = await loadUserConfig({ projectRoot, serverRoot });

    expect(result.filepath).toBe(path.join(serverRoot, 'metro.config.js'));
    expect(result.config).toEqual({ cacheVersion: 'workspace' });
  });

  it('does not search above serverRoot', async () => {
    const outer = serverRoot;
    serverRoot = `${outer}/inner`;
    projectRoot = `${serverRoot}/app`;
    vol.fromJSON({
      [`${outer}/metro.config.js`]: 'module.exports = { from: "outer" };',
      [`${projectRoot}/package.json`]: '{}',
    });

    const result = await loadUserConfig({ projectRoot, serverRoot });

    expect(result.isEmpty).toBe(true);
  });

  // NOTE: Diverges from Metro: package.json:metro is intentionally only honored at projectRoot.
  it('does not search package.json:metro at parent levels', async () => {
    projectRoot = `${serverRoot}/packages/app`;
    vol.fromJSON({
      [`${serverRoot}/package.json`]: JSON.stringify({ metro: { from: 'workspace-pkg' } }),
      [`${projectRoot}/package.json`]: '{}',
    });

    const result = await loadUserConfig({ projectRoot, serverRoot });

    expect(result.isEmpty).toBe(true);
  });

  describe('overrideConfigPath', () => {
    it('loads from an absolute path', async () => {
      vol.fromJSON({
        '/elsewhere/custom.config.js': 'module.exports = { cacheVersion: "override-abs" };',
        [`${projectRoot}/package.json`]: '{}',
      });

      const result = await loadUserConfig({
        projectRoot,
        serverRoot,
        overrideConfigPath: '/elsewhere/custom.config.js',
      });

      expect(result.config).toEqual({ cacheVersion: 'override-abs' });
    });

    // NOTE: The env var is documented as cwd-relative; guards against the prior regression.
    it('resolves a relative path against cwd, not projectRoot', async () => {
      vol.fromJSON({
        '/elsewhere/custom.config.js': 'module.exports = { cacheVersion: "override-cwd" };',
        [`${projectRoot}/package.json`]: '{}',
      });
      cwdSpy.mockReturnValue('/elsewhere');

      const result = await loadUserConfig({
        projectRoot,
        serverRoot,
        overrideConfigPath: './custom.config.js',
      });

      expect(result.config).toEqual({ cacheVersion: 'override-cwd' });
    });
  });
});
