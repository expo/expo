import fs from 'fs';
import module from 'module';
import os from 'os';
import path from 'path';
import requireString from 'require-from-string';
import { pathToFileURL } from 'url';

import {
  collectProjectModulePaths,
  createESModuleLoadHook,
  createImportGraphResolveHook,
  installImportGraphHook,
  installModuleCaptureHook,
  resolveLoadedModuleSourcesAsync,
  type CapturedModule,
  type ModuleImport,
} from '../ExpoConfigLoader';

const LOAD_CONTEXT: module.LoadHookContext = {
  conditions: [],
  format: undefined,
  importAttributes: {},
};

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
  let deregister: jest.Mock;
  const registerHooksDescriptor = Object.getOwnPropertyDescriptor(module, 'registerHooks');

  // Jest refuses `module.registerHooks`, Node before 22.15 has none; e2e covers the real loader.
  function stubRegisterHooks(registerHooks: typeof module.registerHooks | undefined) {
    Object.defineProperty(module, 'registerHooks', {
      configurable: true,
      writable: true,
      value: registerHooks,
    });
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-fingerprint-hook-'));
    deregister = jest.fn();
    stubRegisterHooks(jest.fn(() => ({ deregister })));
  });

  afterEach(() => {
    hook?.uninstall();
    hook = null;
    if (registerHooksDescriptor) {
      Object.defineProperty(module, 'registerHooks', registerHooksDescriptor);
    } else {
      delete (module as { registerHooks?: unknown }).registerHooks;
    }
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

  it('should register a load hook that captures a required ES module and deregister it on uninstall', () => {
    hook = installModuleCaptureHook();
    expect(module.registerHooks).toHaveBeenCalledWith({ load: expect.any(Function) });

    // Node passes the source of an ES module that `require()` loads as a string.
    const load = jest.mocked(module.registerHooks).mock.lastCall?.[0].load;
    const filename = path.join(tmpDir, 'with-plugin.mjs');
    const content = 'export default (config) => config;';
    load?.(pathToFileURL(filename).href, LOAD_CONTEXT, () => ({
      format: 'module',
      source: content,
    }));
    expect(hook.getCapturedModules()).toContainEqual({ id: filename, filename, content });

    hook.uninstall();
    hook = null;
    expect(deregister).toHaveBeenCalledTimes(1);
  });

  it('should patch _compile alone when Node has no module.registerHooks', () => {
    const moduleProto = (require('module') as { prototype: { _compile: unknown } }).prototype;
    const originalCompile = moduleProto._compile;
    stubRegisterHooks(undefined);

    hook = installModuleCaptureHook();
    expect(moduleProto._compile).not.toBe(originalCompile);
    const filename = path.join(tmpDir, 'plugin.js');
    requireString('module.exports = 1;', filename);
    expect(hook.getCapturedModules()).toContainEqual(expect.objectContaining({ filename }));

    hook.uninstall();
    hook = null;
    expect(moduleProto._compile).toBe(originalCompile);
  });
});

describe('createESModuleLoadHook', () => {
  it.each(['module', 'module-typescript'])(
    'should capture a %s file with its decoded source',
    (format) => {
      const capturedModules: CapturedModule[] = [];
      const filename = path.join(os.tmpdir(), 'with-plugin.mjs');
      const content = 'export default (config) => config;';
      const loaded = { format, source: new TextEncoder().encode(content) };

      const result = createESModuleLoadHook(capturedModules)(
        pathToFileURL(filename).href,
        LOAD_CONTEXT,
        () => loaded
      );

      expect(result).toBe(loaded);
      expect(capturedModules).toEqual([{ id: filename, filename, content }]);
    }
  );

  it('should leave a CommonJS module to the _compile hook', () => {
    const capturedModules: CapturedModule[] = [];
    const filename = path.join(os.tmpdir(), 'plugin.js');

    createESModuleLoadHook(capturedModules)(pathToFileURL(filename).href, LOAD_CONTEXT, () => ({
      format: 'commonjs',
      source: 'module.exports = 1;',
    }));

    expect(capturedModules).toEqual([]);
  });

  it('should skip a module that is not loaded from a file', () => {
    const capturedModules: CapturedModule[] = [];
    const load = createESModuleLoadHook(capturedModules);

    load('node:fs', LOAD_CONTEXT, () => ({ format: 'builtin', source: undefined }));
    load('data:text/javascript,export default 1', LOAD_CONTEXT, () => ({
      format: 'module',
      source: 'export default 1',
    }));

    expect(capturedModules).toEqual([]);
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
    const imports: ModuleImport[] = [];
    const resolution = { url: pathToFileURL(child).href };

    const result = createImportGraphResolveHook(imports)('plugin', context, () => resolution);

    expect(result).toBe(resolution);
    expect(imports).toEqual([{ parent, child, via: 'resolve' }]);
  });

  it('should record only the import that first resolves a file', () => {
    const imports: ModuleImport[] = [];
    const resolve = createImportGraphResolveHook(imports);
    const framework = path.join(os.tmpdir(), 'packages', 'config', 'index.js');
    const resolution = { url: pathToFileURL(child).href };

    resolve('plugin', { ...context, parentURL: pathToFileURL(framework).href }, () => resolution);
    resolve('plugin', context, () => resolution);

    expect(imports).toEqual([{ parent: framework, child, via: 'resolve' }]);
  });

  it('should not record a builtin or an import with no parent file', () => {
    const imports: ModuleImport[] = [];
    const resolve = createImportGraphResolveHook(imports);

    resolve('node:path', context, () => ({ url: 'node:path' }));
    resolve('plugin', { ...context, parentURL: undefined }, () => ({
      url: pathToFileURL(child).href,
    }));

    expect(imports).toEqual([]);
  });
});

describe('installImportGraphHook', () => {
  const registerHooksDescriptor = Object.getOwnPropertyDescriptor(module, 'registerHooks');

  // Jest refuses `module.registerHooks`, Node before 22.15 has none; e2e covers the real loader.
  function stubRegisterHooks(registerHooks: typeof module.registerHooks | undefined) {
    Object.defineProperty(module, 'registerHooks', {
      configurable: true,
      writable: true,
      value: registerHooks,
    });
  }

  afterEach(() => {
    if (registerHooksDescriptor) {
      Object.defineProperty(module, 'registerHooks', registerHooksDescriptor);
    } else {
      delete (module as { registerHooks?: unknown }).registerHooks;
    }
  });

  it('should register a resolve hook that records imports and deregister it on uninstall', () => {
    const deregister = jest.fn();
    stubRegisterHooks(jest.fn(() => ({ deregister })));

    const hook = installImportGraphHook();
    expect(module.registerHooks).toHaveBeenCalledWith({ resolve: expect.any(Function) });
    const resolve = jest.mocked(module.registerHooks).mock.lastCall?.[0].resolve;
    const parent = path.join(os.tmpdir(), 'app', 'app.config.js');
    const child = path.join(os.tmpdir(), 'packages', 'plugin', 'index.js');
    resolve?.(
      'plugin',
      { conditions: [], importAttributes: {}, parentURL: pathToFileURL(parent).href },
      () => ({ url: pathToFileURL(child).href })
    );
    expect(hook.getImports()).toEqual([{ parent, child, via: 'resolve' }]);

    hook.uninstall();
    expect(deregister).toHaveBeenCalledTimes(1);
  });

  it('should record the module whose code was running when a module compiled, without module.registerHooks', () => {
    stubRegisterHooks(undefined);
    const moduleProto = (
      require('module') as { prototype: { _compile: (...args: unknown[]) => unknown } }
    ).prototype;
    const originalCompile = moduleProto._compile;
    const parent = path.join(os.tmpdir(), 'app', 'app.config.js');
    const child = path.join(os.tmpdir(), 'packages', 'plugin', 'index.js');
    const sibling = path.join(os.tmpdir(), 'packages', 'constants', 'index.js');
    const compile = jest.fn((_content: unknown, filename: unknown) => {
      if (filename === parent) {
        moduleProto._compile.call({}, 'module.exports = 1;', child);
        moduleProto._compile.call({}, 'module.exports = 2;', sibling);
      }
    });
    moduleProto._compile = compile;
    try {
      const hook = installImportGraphHook();
      moduleProto._compile.call({}, "module.exports = require('plugin');", parent);
      expect(hook.getImports()).toEqual([
        { parent, child, via: 'compile' },
        { parent, child: sibling, via: 'compile' },
      ]);

      hook.uninstall();
      expect(moduleProto._compile).toBe(compile);
    } finally {
      moduleProto._compile = originalCompile;
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
  const imported = (
    parent: string,
    child: string,
    via: ModuleImport['via'] = 'resolve'
  ): ModuleImport => ({
    parent: filename(parent),
    child: filename(child),
    via,
  });

  it('should reach a workspace module the project imports, and the modules it imports', () => {
    const modules = captured([
      'app.config.js',
      '../../packages/plugin/index.js',
      '../../packages/plugin/label.js',
      '../../packages/plugin/colors.js',
      '../../packages/@expo/config/build/index.js',
    ]);
    const imports = [
      imported('app.config.js', '../../packages/plugin/index.js'),
      imported('../../packages/plugin/index.js', '../../packages/plugin/label.js'),
      imported('../../packages/plugin/index.js', '../../packages/plugin/colors.js'),
      imported(
        '../../node_modules/@expo/fingerprint/build/ExpoConfigLoader.js',
        '../../packages/@expo/config/build/index.js'
      ),
    ];

    expect(collectProjectModulePaths(modules, imports, projectRoot)).toEqual([
      '../../packages/plugin/colors.js',
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

  it('should take the module whose code compiled a module over a file that resolved it first', () => {
    const modules = captured([
      'app.config.js',
      '../../packages/plugin/index.js',
      '../../packages/@expo/config-plugins/build/index.js',
    ]);
    const framework = '../../packages/@expo/config/build/index.js';
    const imports = [
      imported(framework, '../../packages/plugin/index.js'),
      imported('app.config.js', '../../packages/plugin/index.js', 'compile'),
      imported('app.config.js', '../../packages/@expo/config-plugins/build/index.js'),
      imported(framework, '../../packages/@expo/config-plugins/build/index.js', 'compile'),
    ];

    expect(collectProjectModulePaths(modules, imports, projectRoot)).toEqual([
      '../../packages/plugin/index.js',
      'app.config.js',
    ]);
  });
});
