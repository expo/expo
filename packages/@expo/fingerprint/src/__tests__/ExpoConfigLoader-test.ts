import fs from 'fs';
import os from 'os';
import path from 'path';
import requireString from 'require-from-string';

import {
  installModuleCaptureHook,
  resolveLoadedModuleSourcesAsync,
  type CapturedModule,
} from '../ExpoConfigLoader';

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

    const captured: CapturedModule[] = [
      { id: ignoredFile, filename: ignoredFile, content: 'x' },
    ];
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
});
