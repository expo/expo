import fs from 'fs';
import module from 'module';
import os from 'os';
import path from 'path';
import requireString from 'require-from-string';
import { pathToFileURL } from 'url';

import {
  collectProjectModulePaths,
  createImportGraphResolveHook,
  installImportGraphHook,
  installModuleCaptureHook,
  resolveLoadedModuleSourcesAsync,
  type CapturedModule,
  type ResolvedImport,
} from '../ExpoConfigLoader';

const minimatchConstructorSpy = jest.fn();
jest.mock('minimatch', () => {
  const actual = jest.requireActual('minimatch');
  class SpyMinimatch extends actual.Minimatch {
    constructor(...args: ConstructorParameters<typeof actual.Minimatch>) {
      minimatchConstructorSpy(...args);
      super(...args);
    }
  }
  return { ...actual, Minimatch: SpyMinimatch };
});

describe('installModuleCaptureHook', () => {
  let tmpDir: string;
  let hook: ReturnType<typeof installModuleCaptureHook> | null = null;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-fingerprint-hook-'));
  });

  afterEach(() => {
    hook?.uninstall();
    hook = null;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should capture a compiled module with its authoritative filename and content', () => {
    hook = installModuleCaptureHook();
    const filename = path.join(tmpDir, 'plugin.js');
    const content = 'module.exports = 42;';
    requireString(content, filename);

    expect(hook.getCapturedModules()).toContainEqual(
      expect.objectContaining({ filename, content })
    );
  });

  it('should capture the real source filename that a transpiler passes to _compile', () => {
    // A transpiler (sucrase/tsx) reads a `.ts` source and compiles it under the real source
    // filename, so the hook must record `.ts` — not a guessed `.js`.
    hook = installModuleCaptureHook();
    const tsFilename = path.join(tmpDir, 'with-local-plugin.ts');
    const transpiled = 'module.exports = () => {};';
    requireString(transpiled, tsFilename);

    const captured = hook.getCapturedModules();
    expect(captured.some((m) => m.filename === tsFilename)).toBe(true);
    expect(captured.every((m) => !m.filename.endsWith('with-local-plugin.js'))).toBe(true);
  });

  it('should forward extra _compile arguments', () => {
    const moduleProto = (
      require('module') as { prototype: { _compile: (...args: unknown[]) => unknown } }
    ).prototype;
    const originalCompile = moduleProto._compile;
    const compileSpy = jest.fn();
    moduleProto._compile = compileSpy;
    try {
      hook = installModuleCaptureHook();
      const filename = path.join(tmpDir, 'typed.ts');
      moduleProto._compile.call({}, 'module.exports = 1;', filename, 'commonjs-typescript');
      expect(compileSpy).toHaveBeenCalledWith(
        'module.exports = 1;',
        filename,
        'commonjs-typescript'
      );
    } finally {
      hook?.uninstall();
      hook = null;
      moduleProto._compile = originalCompile;
    }
  });

  it('should stop capturing after uninstall', () => {
    hook = installModuleCaptureHook();
    hook.uninstall();
    requireString('module.exports = 1;', path.join(tmpDir, 'after-uninstall.js'));
    expect(hook.getCapturedModules()).toEqual([]);
  });
});

describe('resolveLoadedModuleSourcesAsync', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-fingerprint-resolve-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should classify an existing file as a file source with a project-relative posix path', async () => {
    const pluginDir = path.join(tmpDir, 'plugins');
    fs.mkdirSync(pluginDir, { recursive: true });
    const filePath = path.join(pluginDir, 'with-plugin.ts');
    fs.writeFileSync(filePath, 'export default {};');

    const captured: CapturedModule[] = [{ id: filePath, filename: filePath, content: 'ignored' }];
    const sources = await resolveLoadedModuleSourcesAsync(captured, tmpDir, []);

    expect(sources).toEqual([{ type: 'file', path: 'plugins/with-plugin.ts' }]);
  });

  it('should classify a module with no file on disk as a contents source with its captured content', async () => {
    const virtualPath = path.join(tmpDir, 'plugins', 'virtual.js');
    const content = 'module.exports = () => {};';
    const captured: CapturedModule[] = [{ id: virtualPath, filename: virtualPath, content }];

    const sources = await resolveLoadedModuleSourcesAsync(captured, tmpDir, []);

    expect(sources).toEqual([{ type: 'contents', id: 'plugins/virtual.js', contents: content }]);
  });

  it('should skip ignored paths', async () => {
    const nodeModDir = path.join(tmpDir, 'node_modules', 'chalk');
    fs.mkdirSync(nodeModDir, { recursive: true });
    const ignoredFile = path.join(nodeModDir, 'index.js');
    fs.writeFileSync(ignoredFile, 'x');

    const captured: CapturedModule[] = [{ id: ignoredFile, filename: ignoredFile, content: 'x' }];
    const sources = await resolveLoadedModuleSourcesAsync(captured, tmpDir, [
      '**/node_modules/chalk/**/*',
    ]);

    expect(sources).toEqual([]);
  });

  it('should dedupe modules captured more than once', async () => {
    const filePath = path.join(tmpDir, 'plugin.ts');
    fs.writeFileSync(filePath, 'export default {};');
    const captured: CapturedModule[] = [
      { id: filePath, filename: filePath, content: 'a' },
      { id: filePath, filename: filePath, content: 'a' },
    ];

    const sources = await resolveLoadedModuleSourcesAsync(captured, tmpDir, []);

    expect(sources).toEqual([{ type: 'file', path: 'plugin.ts' }]);
  });

  it('should build Minimatch objects once per call, not once per module', async () => {
    const ignoredPaths = Array.from({ length: 8 }, (_, i) => `**/ignored-${i}/**/*`);
    const captured: CapturedModule[] = Array.from({ length: 20 }, (_, i) => {
      const filePath = path.join(tmpDir, `plugin-${i}.ts`);
      fs.writeFileSync(filePath, 'export default {};');
      return { id: filePath, filename: filePath, content: 'x' };
    });

    minimatchConstructorSpy.mockClear();
    await resolveLoadedModuleSourcesAsync(captured, tmpDir, ignoredPaths);

    expect(minimatchConstructorSpy).toHaveBeenCalledTimes(ignoredPaths.length);
  });
});

describe('createImportGraphResolveHook', () => {
  const parent = path.join(os.tmpdir(), 'app', 'app.config.js');
  const child = path.join(os.tmpdir(), 'packages', 'plugin', 'index.js');
  const context: module.ResolveHookContext = {
    conditions: [],
    importAttributes: {},
    parentURL: pathToFileURL(parent).href,
  };

  it('should record an import from one file to another and return the resolution', () => {
    const imports: ResolvedImport[] = [];
    const resolution = { url: pathToFileURL(child).href };

    const result = createImportGraphResolveHook(imports)('plugin', context, () => resolution);

    expect(result).toBe(resolution);
    expect(imports).toEqual([{ parent, child }]);
  });

  it('should record only the import that first resolves a file', () => {
    const imports: ResolvedImport[] = [];
    const resolve = createImportGraphResolveHook(imports);
    const framework = path.join(os.tmpdir(), 'packages', 'config', 'index.js');
    const resolution = { url: pathToFileURL(child).href };

    resolve('plugin', { ...context, parentURL: pathToFileURL(framework).href }, () => resolution);
    resolve('plugin', context, () => resolution);

    expect(imports).toEqual([{ parent: framework, child }]);
  });

  it('should not record a builtin or an import with no parent file', () => {
    const imports: ResolvedImport[] = [];
    const resolve = createImportGraphResolveHook(imports);

    resolve('node:path', context, () => ({ url: 'node:path' }));
    resolve('plugin', { ...context, parentURL: undefined }, () => ({
      url: pathToFileURL(child).href,
    }));

    expect(imports).toEqual([]);
  });
});

describe('installImportGraphHook', () => {
  it('should register a resolve hook and deregister it on uninstall', () => {
    const deregister = jest.fn();
    const registerHooks = jest.spyOn(module, 'registerHooks').mockReturnValue({ deregister });
    try {
      const hook = installImportGraphHook();
      expect(registerHooks).toHaveBeenCalledWith({ resolve: expect.any(Function) });
      hook.uninstall();
      expect(deregister).toHaveBeenCalledTimes(1);
    } finally {
      registerHooks.mockRestore();
    }
  });
});

describe('collectProjectModulePaths', () => {
  const projectRoot = path.join(os.tmpdir(), 'monorepo', 'apps', 'app');
  const filename = (relativePath: string) => path.join(projectRoot, relativePath);
  const captured = (relativePaths: string[]): CapturedModule[] =>
    relativePaths.map((relativePath) => ({
      id: filename(relativePath),
      filename: filename(relativePath),
      content: '',
    }));
  const imported = (parent: string, child: string): ResolvedImport => ({
    parent: filename(parent),
    child: filename(child),
  });

  it('should reach a workspace module the project imports, and the modules it imports', () => {
    const modules = captured([
      'app.config.js',
      '../../packages/plugin/index.js',
      '../../packages/plugin/label.js',
      '../../packages/@expo/config/build/index.js',
    ]);
    const imports = [
      imported('app.config.js', '../../packages/plugin/index.js'),
      imported('../../packages/plugin/index.js', '../../packages/plugin/label.js'),
      imported(
        '../../node_modules/@expo/fingerprint/build/ExpoConfigLoader.js',
        '../../packages/@expo/config/build/index.js'
      ),
    ];

    expect(collectProjectModulePaths(modules, imports, projectRoot)).toEqual([
      '../../packages/plugin/index.js',
      '../../packages/plugin/label.js',
      'app.config.js',
    ]);
  });

  it('should not follow an import into node_modules', () => {
    const modules = captured([
      'app.config.js',
      '../../node_modules/third-party-plugin/index.js',
      '../../packages/helper/index.js',
    ]);
    const imports = [
      imported('app.config.js', '../../node_modules/third-party-plugin/index.js'),
      imported('../../node_modules/third-party-plugin/index.js', '../../packages/helper/index.js'),
    ];

    expect(collectProjectModulePaths(modules, imports, projectRoot)).toEqual(['app.config.js']);
  });

  it('should keep only the project-local modules when no import was recorded', () => {
    const modules = captured(['app.config.js', '../../packages/plugin/index.js']);

    expect(collectProjectModulePaths(modules, [], projectRoot)).toEqual(['app.config.js']);
  });
});
