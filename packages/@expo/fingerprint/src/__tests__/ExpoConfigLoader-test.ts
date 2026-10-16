import fs from 'fs';
import module from 'module';
import os from 'os';
import path from 'path';
import requireString from 'require-from-string';
import { pathToFileURL } from 'url';

import {
  createESModuleLoadHook,
  installModuleCaptureHook,
  resolveLoadedModuleSourcesAsync,
  type CapturedModule,
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

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-fingerprint-hook-'));
    // Jest refuses `module.registerHooks`; the e2e suite covers the real ES module loader.
    deregister = jest.fn();
    jest.spyOn(module, 'registerHooks').mockReturnValue({ deregister });
  });

  afterEach(() => {
    hook?.uninstall();
    hook = null;
    jest.mocked(module.registerHooks).mockRestore();
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

  it('should register an ES module load hook and deregister it on uninstall', () => {
    hook = installModuleCaptureHook();
    expect(module.registerHooks).toHaveBeenCalledWith({ load: expect.any(Function) });

    hook.uninstall();
    hook = null;
    expect(deregister).toHaveBeenCalledTimes(1);
  });

  it('should leave _compile untouched when Node refuses the load hook', () => {
    const moduleProto = (require('module') as { prototype: { _compile: unknown } }).prototype;
    const originalCompile = moduleProto._compile;
    jest.mocked(module.registerHooks).mockImplementation(() => {
      throw new Error('registerHooks refused');
    });

    expect(() => installModuleCaptureHook()).toThrow('registerHooks refused');
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
