import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { VIEWS_MODULE_FEATURES, type Feature } from '../features';
import type { ModulesApi } from '../modulesApi';
import { copyFileSnippets } from '../snippets';
import {
  buildAugmentedData,
  copyTemplateFiles,
  createSubstitutionData,
  getFilesAsync,
  type AugmentedData,
} from '../templateUtils';

const TEMPLATE_PATH = path.resolve(__dirname, '../../../expo-module-template');
const SNIPPETS_DIR = path.join(TEMPLATE_PATH, 'snippets');
const ANDROID_DIR = path.join('android', 'src', 'main', 'java', 'expo', 'modules', 'mymodule');
const roots: string[] = [];

function createData(features: Feature[]) {
  return createSubstitutionData(
    {
      slug: 'my-module',
      name: 'MyModule',
      package: 'expo.modules.mymodule',
      platforms: ['apple', 'android', 'web'],
      features,
    },
    null
  );
}

async function renderModule(
  data: AugmentedData
): Promise<{ files: string[]; read: (file: string) => string }> {
  const targetPath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'create-expo-module-'));
  roots.push(targetPath);
  await copyTemplateFiles(TEMPLATE_PATH, targetPath, data, {
    platforms: data.project.platforms,
    moduleType: 'local',
  });
  await copyFileSnippets(SNIPPETS_DIR, data.project.features, data, targetPath);
  return {
    files: (await getFilesAsync(targetPath)).sort(),
    read: (file) => fs.readFileSync(path.join(targetPath, file), 'utf8'),
  };
}

async function render(features: Feature[], modulesApi: ModulesApi) {
  return renderModule(await buildAugmentedData(SNIPPETS_DIR, createData(features), modulesApi));
}

afterAll(async () => {
  await Promise.all(roots.map((root) => fs.promises.rm(root, { recursive: true, force: true })));
});

describe('Expo Modules API 2.0 module', () => {
  it('declares the module members with the Expo Modules API 2.0', async () => {
    const { read } = await render(['Constant', 'Function', 'AsyncFunction', 'Event'], 'v2');

    const swift = read('ios/MyModule.swift');
    expect(swift).toContain('@ExpoModule("MyModule")');
    expect(swift).toContain('@Event("onChange")');
    expect(swift).toContain('onChange(ChangeEventPayload(value: value))');
    expect(swift).not.toContain('ModuleDefinition');

    const kotlin = read(path.join(ANDROID_DIR, 'MyModule.kt'));
    expect(kotlin).toContain('@ExpoModule("MyModule")');
    expect(kotlin).toContain('import io.github.expo.modules.v2.JS');
    expect(kotlin).toContain('@Event(name = "onChange")');
    expect(kotlin).toContain('suspend fun setValueAsync');
    expect(kotlin).not.toContain('ModuleDefinition');
  });

  it('imports only the Kotlin annotations that the selected features use', async () => {
    const kotlin = (await render([], 'v2')).read(path.join(ANDROID_DIR, 'MyModule.kt'));
    expect(kotlin).toContain('import io.github.expo.modules.v2.ExpoModule');
    expect(kotlin).not.toContain('import io.github.expo.modules.v2.JS');
    expect(kotlin).not.toContain('import io.github.expo.modules.v2.Event');
  });

  it('exposes the shared object class through the module annotation', async () => {
    const { read } = await render(['SharedObject'], 'v2');

    expect(read('ios/MyModule.swift')).toContain(
      '@ExpoModule("MyModule", classes: [MyModuleSharedObject.self])'
    );
    expect(read('ios/MyModule.swift')).not.toContain('Class(');
    expect(read('ios/MyModuleSharedObject.swift')).toContain('@SharedObject');
    expect(read(path.join(ANDROID_DIR, 'MyModule.kt'))).toContain(
      '@ExpoModule("MyModule", classes = [MyModuleSharedObject::class])'
    );
    expect(read(path.join(ANDROID_DIR, 'MyModuleSharedObject.kt'))).toContain('@ExpoSharedObject');
  });

  it('turns on the Expo Modules API 2.0 and lists its module only on Apple platforms', async () => {
    const { read } = await render(['Function'], 'v2');

    expect(read('android/build.gradle')).toContain('v2 true');
    expect(JSON.parse(read('expo-module.config.json'))).toEqual({
      platforms: ['apple', 'android', 'web'],
      apple: { modules: ['MyModule'] },
    });
  });

  it('defines the views and view modifiers in a views module', async () => {
    const { files, read } = await render(['Function', ...VIEWS_MODULE_FEATURES], 'v2');

    expect(files).toContain('ios/MyModuleViewsModule.swift');
    expect(files).toContain(path.join(ANDROID_DIR, 'MyModuleViewsModule.kt'));
    for (const viewsModule of [
      read('ios/MyModuleViewsModule.swift'),
      read(path.join(ANDROID_DIR, 'MyModuleViewsModule.kt')),
    ]) {
      expect(viewsModule).toContain('Name("MyModuleViews")');
      expect(viewsModule).toContain('Events("onTap")');
      expect(viewsModule).toContain('ModifierRegistry.register');
    }
    expect(read('ios/MyModule.swift')).not.toContain('View(');

    for (const view of ['MyModuleView', 'MyModuleSwiftUIView', 'MyModuleComposeView']) {
      expect(read(`src/${view}.tsx`)).toContain("'MyModuleViews'");
    }
    expect(JSON.parse(read('expo-module.config.json'))).toEqual({
      platforms: ['apple', 'android', 'web'],
      apple: { modules: ['MyModule', 'MyModuleViewsModule'] },
      android: { modules: ['expo.modules.mymodule.MyModuleViewsModule'] },
    });
  });

  it('creates the views module only on the platforms with view features', async () => {
    const { files, read } = await render(['SwiftUIView'], 'v2');

    expect(files).toContain('ios/MyModuleViewsModule.swift');
    expect(files).not.toContain(path.join(ANDROID_DIR, 'MyModuleViewsModule.kt'));
    expect(JSON.parse(read('expo-module.config.json'))).toEqual({
      platforms: ['apple', 'android', 'web'],
      apple: { modules: ['MyModule', 'MyModuleViewsModule'] },
    });
  });

  it('defines the view modifiers in a views module when the module has no views', async () => {
    const { read } = await render(['SwiftUIModifier', 'ComposeModifier'], 'v2');

    expect(read('ios/MyModuleViewsModule.swift')).toContain('ViewModifierRegistry.register');
    expect(read(path.join(ANDROID_DIR, 'MyModuleViewsModule.kt'))).toContain(
      'ModifierRegistry.register'
    );
  });
});

// Older CLI releases download the latest template for their SDK. They render the template files
// and the snippets they know without the values that this version adds, so these values must be
// optional in those files.
describe('older CLI releases', () => {
  it('render an Expo Modules API 1.0 module from the template', async () => {
    const features: Feature[] = [
      'Constant',
      'Function',
      'AsyncFunction',
      'Event',
      'SharedObject',
      ...VIEWS_MODULE_FEATURES,
    ];
    const data = await buildAugmentedData(SNIPPETS_DIR, createData(features), 'v1');
    const { viewsModuleSnippetsSwift, viewsModuleSnippetsKt, ...olderCliData } = data;
    const { modulesApi, viewsModule, ...olderCliProject } = data.project;

    const current = await renderModule(data);
    const olderCli = await renderModule({
      ...olderCliData,
      project: olderCliProject,
    } as unknown as AugmentedData);

    expect(olderCli.files).toEqual(current.files);
    for (const file of current.files) {
      expect(olderCli.read(file)).toBe(current.read(file));
    }
  });
});
