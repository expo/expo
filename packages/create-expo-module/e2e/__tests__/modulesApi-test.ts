import fs from 'node:fs';
import path from 'node:path';

import { createFakeApp, createFakeProject, execute, executePassing, projectRoot } from './utils';

const templatePath = path.resolve(__dirname, '../../../expo-module-template');
// The CLI derives the Android package from the folder name of a module without Android code.
const KOTLIN_DIR = 'android/src/main/java/expo/modules/probe';

function createModuleArgs(args: string[]) {
  return ['probe', '--local', '--name', 'Probe', '--source', templatePath, ...args];
}

function addPlatformArgs(moduleDir: string, args: string[], source = templatePath) {
  return ['add-platform-support', moduleDir, '--source', source, ...args];
}

/** Creates the `probe` local module in the app and returns its directory. */
async function createModule(app: string, args: string[] = []) {
  await executePassing(createModuleArgs(args), { cwd: app });
  return path.join(app, 'modules', 'probe');
}

function read(moduleDir: string, ...file: string[]) {
  return fs.readFileSync(path.join(moduleDir, ...file), 'utf8');
}

afterAll(async () => {
  await fs.promises.rm(projectRoot, { recursive: true, force: true });
});

describe('--modules-api', () => {
  it('creates an Expo Modules API 2.0 module by default', async () => {
    const moduleDir = await createModule(createFakeApp('modules-api-default', 58), [
      '--features',
      'Function',
      'View',
    ]);

    expect(read(moduleDir, 'ios', 'ProbeModule.swift')).toContain('@ExpoModule("Probe")');
    expect(read(moduleDir, 'ios', 'ProbeViewsModule.swift')).toContain('Name("ProbeViews")');
    expect(read(moduleDir, 'android', 'build.gradle')).toContain('v2 true');
  });

  it('creates an Expo Modules API 1.0 module with v1', async () => {
    const moduleDir = await createModule(createFakeApp('modules-api-v1', 58), [
      '--modules-api',
      'v1',
    ]);

    expect(read(moduleDir, 'ios', 'ProbeModule.swift')).toContain('ModuleDefinition');
    expect(read(moduleDir, 'android', 'build.gradle')).not.toContain('v2 true');
  });

  it('fails without creating the module when v2 is requested in an SDK older than 58', async () => {
    const app = createFakeApp('modules-api-v2-sdk-57', 57);
    await expect(
      execute(createModuleArgs(['--modules-api', 'v2']), { cwd: app })
    ).rejects.toMatchObject({
      status: 1,
      stderr: expect.stringContaining('--modules-api v1'),
    });
    expect(fs.existsSync(path.join(app, 'modules', 'probe'))).toBe(false);
  });
});

describe('add-platform-support with the Expo Modules API 2.0', () => {
  it('adds Android with the features of the iOS module and its views module', async () => {
    const moduleDir = await createModule(createFakeProject('add-android-to-v2'), [
      '--platform',
      'apple',
      '--features',
      'AsyncFunction',
      'Event',
      'SharedObject',
      'View',
      'ViewEvent',
    ]);
    await executePassing(addPlatformArgs(moduleDir, ['--platform', 'android']));

    const kotlin = read(moduleDir, KOTLIN_DIR, 'ProbeModule.kt');
    expect(kotlin).toContain('@ExpoModule("Probe", classes = [ProbeModuleSharedObject::class])');
    expect(kotlin).toContain('suspend fun setValueAsync');
    expect(kotlin).toContain('onChange(ChangeEventPayload(value))');
    expect(read(moduleDir, KOTLIN_DIR, 'ProbeViewsModule.kt')).toContain('Events("onTap")');
    expect(read(moduleDir, KOTLIN_DIR, 'ProbeModuleSharedObject.kt')).toContain(
      '@ExpoSharedObject'
    );
    expect(read(moduleDir, 'android', 'build.gradle')).toContain('v2 true');
    expect(JSON.parse(read(moduleDir, 'expo-module.config.json'))).toEqual({
      platforms: ['apple', 'android'],
      apple: { modules: ['ProbeModule', 'ProbeViewsModule'] },
      android: { modules: ['expo.modules.probe.ProbeViewsModule'] },
    });
  });

  it('adds iOS to an Android module that expo-module.config.json does not list', async () => {
    const moduleDir = await createModule(createFakeProject('add-apple-to-v2'), [
      '--platform',
      'android',
      '--features',
      'Constant',
      'Function',
    ]);
    await executePassing(addPlatformArgs(moduleDir, ['--platform', 'apple']));

    const swift = read(moduleDir, 'ios', 'ProbeModule.swift');
    expect(swift).toContain('@ExpoModule("Probe")');
    expect(swift).toContain('let PI: Double = .pi');
    expect(swift).toContain('func hello() -> String');
    expect(JSON.parse(read(moduleDir, 'expo-module.config.json'))).toEqual({
      platforms: ['android', 'apple'],
      apple: { modules: ['ProbeModule'] },
    });
  });

  it.each([
    ['v2', 'v1', 'Probe'],
    ['v1', 'v2', 'ProbeViews'],
  ])(
    'fails to add %s views to a %s module, whose view components load them from %s',
    async (modulesApi, existingModulesApi, viewsModuleName) => {
      const moduleDir = await createModule(
        createFakeProject(`add-${modulesApi}-views-to-${existingModulesApi}`),
        ['--platform', 'apple', '--features', 'View', '--modules-api', existingModulesApi]
      );
      await expect(
        execute(addPlatformArgs(moduleDir, ['--platform', 'android', '--modules-api', modulesApi]))
      ).rejects.toMatchObject({
        status: 1,
        stderr: expect.stringContaining(`load them from the "${viewsModuleName}" native module`),
      });
      expect(fs.existsSync(path.join(moduleDir, 'android'))).toBe(false);
    }
  );

  it('adds Android code with another API version to a module with only SwiftUI views', async () => {
    const moduleDir = await createModule(createFakeProject('add-v2-to-swiftui-v1'), [
      '--platform',
      'apple',
      '--features',
      'SwiftUIView',
      '--modules-api',
      'v1',
    ]);
    await executePassing(
      addPlatformArgs(moduleDir, ['--platform', 'android', '--modules-api', 'v2'])
    );

    expect(read(moduleDir, KOTLIN_DIR, 'ProbeModule.kt')).toContain('@ExpoModule("Probe")');
  });

  it('fails to match an Expo Modules API 2.0 module with a template that does not include it', async () => {
    const olderTemplate = path.join(projectRoot, 'older-template');
    await fs.promises.cp(templatePath, olderTemplate, {
      recursive: true,
      filter: (source) => !source.startsWith(path.join(templatePath, 'snippets', 'v2')),
    });
    const moduleDir = await createModule(createFakeProject('add-to-v2-older-template'), [
      '--platform',
      'apple',
    ]);
    await expect(
      execute(addPlatformArgs(moduleDir, ['--platform', 'android'], olderTemplate))
    ).rejects.toMatchObject({
      status: 1,
      stderr: expect.stringContaining('to match the existing code of the module'),
    });
  });

  it('adds Expo Modules API 2.0 code to an Expo Modules API 1.0 module with v2', async () => {
    const moduleDir = await createModule(createFakeProject('add-v2-to-v1'), [
      '--platform',
      'apple',
      '--features',
      'Function',
      '--modules-api',
      'v1',
    ]);
    await executePassing(
      addPlatformArgs(moduleDir, ['--platform', 'android', '--modules-api', 'v2'])
    );

    expect(read(moduleDir, KOTLIN_DIR, 'ProbeModule.kt')).toContain('@ExpoModule("Probe")');
    expect(read(moduleDir, 'ios', 'ProbeModule.swift')).toContain('ModuleDefinition');
    expect(JSON.parse(read(moduleDir, 'expo-module.config.json'))).toEqual({
      platforms: ['apple', 'android'],
      apple: { modules: ['ProbeModule'] },
    });
  });
});
