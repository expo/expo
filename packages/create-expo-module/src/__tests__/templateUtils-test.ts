import ejs from 'ejs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { copyFileSnippets } from '../snippets';
import {
  buildAugmentedData,
  getGeneratedWebStubSentinel,
  getLocalSdkMajorVersion,
  getTemplateDistTag,
  normalizeNpmPackResult,
  updateWebStub,
} from '../templateUtils';
import type { LocalSubstitutionData, SubstitutionData } from '../types';

const mockData: SubstitutionData = {
  project: {
    slug: 'my-module',
    name: 'MyModule',
    version: '0.1.0',
    description: 'Test',
    package: 'expo.modules.mymodule',
    moduleName: 'MyModuleModule',
    viewName: 'MyModuleView',
    swiftUIViewName: 'MyModuleSwiftUIView',
    swiftUIModifierName: 'MyModuleSwiftUIModifier',
    composeViewName: 'MyModuleComposeView',
    composeModifierName: 'MyModuleComposeModifier',
    sharedObjectName: 'MyModuleModuleSharedObject',
    platforms: ['apple', 'web'],
    features: [],
  },
  author: 'Test',
  license: 'MIT',
  repo: 'https://github.com/test/test',
  type: 'standalone',
};

async function writeMinimalWebTemplate(templateDir: string) {
  await fs.promises.mkdir(path.join(templateDir, 'src'), { recursive: true });
  await fs.promises.mkdir(path.join(templateDir, 'snippets'), { recursive: true });
  await fs.promises.writeFile(
    path.join(templateDir, 'src', '{%- project.moduleName %}.web.ts'),
    'export default class <%- project.moduleName %> {}\n'
  );
}

describe(normalizeNpmPackResult, () => {
  const packageInfo = { name: 'create-expo-module-template', filename: 'template.tgz' };

  it('supports the npm 11 and earlier array format', () => {
    expect(normalizeNpmPackResult([packageInfo])).toEqual([packageInfo]);
  });

  it('supports the npm 12 package-keyed object format', () => {
    expect(normalizeNpmPackResult({ 'create-expo-module-template': packageInfo })).toEqual([
      packageInfo,
    ]);
  });

  it('rejects non-container values', () => {
    expect(normalizeNpmPackResult(null)).toBeNull();
    expect(normalizeNpmPackResult('template.tgz')).toBeNull();
  });
});

describe('getTemplateDistTag', () => {
  it('maps an SDK-aligned version to its `sdk-<major>` tag', () => {
    expect(getTemplateDistTag('56.0.3')).toBe('sdk-56');
    expect(getTemplateDistTag('57.0.0')).toBe('sdk-57');
    expect(getTemplateDistTag('60.1.2')).toBe('sdk-60');
  });

  it('falls back to `latest` for versions from the old, non-SDK-aligned scheme', () => {
    expect(getTemplateDistTag('2.1.7')).toBe('latest');
    expect(getTemplateDistTag('1.0.15')).toBe('latest');
    expect(getTemplateDistTag('0.5.0')).toBe('latest');
  });

  it('falls back to `latest` for missing or unparsable versions', () => {
    expect(getTemplateDistTag(undefined)).toBe('latest');
    expect(getTemplateDistTag('')).toBe('latest');
    expect(getTemplateDistTag('not-a-version')).toBe('latest');
  });
});

describe('updateWebStub', () => {
  let tmpDir: string;
  let templateDir: string;
  let targetDir: string;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'template-utils-'));
    templateDir = path.join(tmpDir, 'template');
    targetDir = path.join(tmpDir, 'target');
    await writeMinimalWebTemplate(templateDir);
    await fs.promises.mkdir(path.join(targetDir, 'src'), { recursive: true });
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('refuses to overwrite a custom web implementation', async () => {
    const webFile = path.join(targetDir, 'src', 'MyModuleModule.web.ts');
    await fs.promises.writeFile(webFile, 'export default class CustomWebModule {}\n');

    await expect(updateWebStub(templateDir, targetDir, mockData)).rejects.toThrow(
      'does not look like the generated web stub'
    );
  });

  it('overwrites the generated web stub', async () => {
    const webFile = path.join(targetDir, 'src', 'MyModuleModule.web.ts');
    await fs.promises.writeFile(
      webFile,
      `// ${getGeneratedWebStubSentinel(mockData.project.moduleName)}.\n`
    );

    await updateWebStub(templateDir, targetDir, mockData);

    await expect(fs.promises.readFile(webFile, 'utf8')).resolves.toBe(
      'export default class MyModuleModule {}\n'
    );
  });
});

const TEMPLATE_DIR = path.resolve(__dirname, '../../../expo-module-template');
const SNIPPETS_DIR = path.join(TEMPLATE_DIR, 'snippets');

const localData: LocalSubstitutionData = {
  project: {
    slug: 'my-module',
    name: 'MyModule',
    package: 'expo.modules.mymodule',
    moduleName: 'MyModuleModule',
    viewName: 'MyModuleView',
    swiftUIViewName: 'MyModuleSwiftUIView',
    swiftUIModifierName: 'MyModuleSwiftUIModifier',
    composeViewName: 'MyModuleComposeView',
    composeModifierName: 'MyModuleComposeModifier',
    sharedObjectName: 'MyModuleModuleSharedObject',
    platforms: ['apple', 'android'],
    features: ['ComposeView', 'ComposeModifier'],
  },
  type: 'local',
};

async function renderTemplateFile(relativePath: string, data: object): Promise<string> {
  const template = await fs.promises.readFile(path.join(TEMPLATE_DIR, relativePath), 'utf8');
  return ejs.render(template, data);
}

describe(getLocalSdkMajorVersion, () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'sdk-version-'));
    await fs.promises.mkdir(path.join(projectDir, 'node_modules', 'expo'), { recursive: true });
    await fs.promises.writeFile(path.join(projectDir, 'package.json'), '{"name":"app"}');
  });

  afterEach(async () => {
    await fs.promises.rm(projectDir, { recursive: true, force: true });
  });

  it('returns the major version of the host project’s expo dependency as a number', async () => {
    await fs.promises.writeFile(
      path.join(projectDir, 'node_modules', 'expo', 'package.json'),
      '{"name":"expo","version":"55.0.3"}'
    );
    await expect(getLocalSdkMajorVersion(projectDir)).resolves.toBe(55);
  });

  it('rejects when the host project has no expo dependency', async () => {
    await expect(getLocalSdkMajorVersion(projectDir)).rejects.toThrow(
      'Could not find expo/package.json in node_modules'
    );
  });

  it('finds Expo hoisted to a parent workspace', async () => {
    await fs.promises.writeFile(
      path.join(projectDir, 'node_modules', 'expo', 'package.json'),
      '{"version":"55.0.3"}'
    );
    const appDir = path.join(projectDir, 'apps', 'app');
    await fs.promises.mkdir(appDir, { recursive: true });
    await expect(getLocalSdkMajorVersion(appDir)).resolves.toBe(55);
  });

  it('prefers the nearest installation over the parent workspace', async () => {
    await fs.promises.writeFile(
      path.join(projectDir, 'node_modules', 'expo', 'package.json'),
      '{"version":"57.0.0"}'
    );
    const appDir = path.join(projectDir, 'apps', 'app');
    const expoDir = path.join(appDir, 'node_modules', 'expo');
    await fs.promises.mkdir(expoDir, { recursive: true });
    await fs.promises.writeFile(path.join(expoDir, 'package.json'), '{"version":"55.0.3"}');
    await expect(getLocalSdkMajorVersion(appDir)).resolves.toBe(55);
  });

  it('follows a pnpm installation symlink', async () => {
    const storeDir = path.join(
      projectDir,
      'node_modules',
      '.pnpm',
      'expo@55.0.3',
      'node_modules',
      'expo'
    );
    await fs.promises.mkdir(storeDir, { recursive: true });
    await fs.promises.writeFile(path.join(storeDir, 'package.json'), '{"version":"55.0.3"}');
    const expoDir = path.join(projectDir, 'node_modules', 'expo');
    await fs.promises.rmdir(expoDir);
    await fs.promises.symlink(storeDir, expoDir, 'junction');
    await expect(getLocalSdkMajorVersion(projectDir)).resolves.toBe(55);
  });

  it('does not hide invalid package JSON', async () => {
    await fs.promises.writeFile(
      path.join(projectDir, 'node_modules', 'expo', 'package.json'),
      '{invalid'
    );
    await expect(getLocalSdkMajorVersion(projectDir)).rejects.toThrow(SyntaxError);
  });

  it('returns null when the expo version has a non-numeric major', async () => {
    await fs.promises.writeFile(
      path.join(projectDir, 'node_modules', 'expo', 'package.json'),
      '{"name":"expo","version":"unknown.0.0"}'
    );
    await expect(getLocalSdkMajorVersion(projectDir)).resolves.toBeNull();
  });
});

describe('buildAugmentedData', () => {
  it('exposes the SDK 55 overrides for a local module in an SDK 55 project', async () => {
    const augmented = await buildAugmentedData(SNIPPETS_DIR, { ...localData, sdkVersion: 55 });
    expect(augmented.compat.modernExpoUI).toBe(false);
    expect(augmented.compat.iosDeploymentTarget).toBe('15.1');
  });

  it('exposes no overrides for a standalone module', async () => {
    const augmented = await buildAugmentedData(SNIPPETS_DIR, mockData);
    expect(augmented.compat).toEqual({});
  });
});

describe('standalone SharedObject dependencies', () => {
  it('declares a direct development dependency and a host-compatible peer dependency', async () => {
    const data = await buildAugmentedData(SNIPPETS_DIR, {
      ...mockData,
      project: { ...mockData.project, features: ['SharedObject'] },
    });
    const pkg = JSON.parse(await renderTemplateFile('$package.json', data));
    expect(pkg.devDependencies['expo-modules-core']).toBe('~58.0.0');
    expect(pkg.peerDependencies['expo-modules-core']).toBe('*');
  });

  it('does not add the dependency when SharedObject is not selected', async () => {
    const data = await buildAugmentedData(SNIPPETS_DIR, mockData);
    const pkg = JSON.parse(await renderTemplateFile('$package.json', data));
    expect(pkg.devDependencies['expo-modules-core']).toBeUndefined();
    expect(pkg.peerDependencies['expo-modules-core']).toBeUndefined();
  });
});

describe('podspec module metadata', () => {
  it.each(['standalone', 'remote'])(
    'uses package metadata for the %s module type',
    async (type) => {
      const data = await buildAugmentedData(SNIPPETS_DIR, mockData);
      const podspec = await renderTemplateFile('ios/{%- project.name %}.podspec', {
        ...data,
        type,
      });
      expect(podspec).toContain("require 'json'");
      expect(podspec).toContain("s.version        = package['version']");
      expect(podspec).toContain("s.source         = { git: 'https://github.com/test/test' }");
    }
  );

  it('renders local metadata without a repository or package.json', async () => {
    const data = await buildAugmentedData(SNIPPETS_DIR, localData);
    const podspec = await renderTemplateFile('ios/{%- project.name %}.podspec', data);
    expect(podspec).not.toContain("require 'json'");
    expect(podspec).toContain("s.source         = { git: '' }");
  });
});

describe('Android module metadata', () => {
  it.each([
    ['standalone', '1.2.3'],
    ['remote', '1.2.3'],
    ['local', '0.1.0'],
  ])('uses the correct version for the %s module type', async (type, version) => {
    const data = await buildAugmentedData(SNIPPETS_DIR, {
      ...mockData,
      project: { ...mockData.project, version: '1.2.3' },
    });
    const gradle = await renderTemplateFile('android/build.gradle', { ...data, type });
    expect(gradle).toContain(`version = '${version}'`);
    expect(gradle).toContain(`versionName "${version}"`);
  });
});

describe('templates rendered by a CLI that does not supply `compat`', () => {
  // Older published CLIs render the template with only the substitution data. The output must
  // match the template's own SDK, the same as when a current CLI passes no overrides.
  const withoutCompat = { ...localData, usesCompose: true, usesSwiftUI: false, usesExpoUI: true };

  it('renders the podspec with the current deployment target', async () => {
    const podspec = await renderTemplateFile('ios/{%- project.name %}.podspec', withoutCompat);
    expect(podspec).toContain(":ios => '16.4'");
  });

  it('renders build.gradle with the current Compose versions', async () => {
    const gradle = await renderTemplateFile('android/build.gradle', withoutCompat);
    expect(gradle).toContain('foundation-android:1.10.6');
  });

  it('renders the Compose snippets for the current @expo/ui API', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'no-compat-snippets-'));
    try {
      await copyFileSnippets(SNIPPETS_DIR, localData.project.features, withoutCompat, tmpDir);
      const view = await fs.promises.readFile(
        path.join(tmpDir, 'src', 'MyModuleComposeView.tsx'),
        'utf8'
      );
      expect(view).toContain('extends PrimitiveBaseProps');
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('SDK-dependent template output', () => {
  let legacy: Awaited<ReturnType<typeof buildAugmentedData>>;
  let modern: Awaited<ReturnType<typeof buildAugmentedData>>;

  beforeAll(async () => {
    legacy = await buildAugmentedData(SNIPPETS_DIR, { ...localData, sdkVersion: 55 });
    modern = await buildAugmentedData(SNIPPETS_DIR, { ...localData, sdkVersion: 58 });
  });

  it('pins the SDK 55 Compose artifact versions in build.gradle', async () => {
    const gradle = await renderTemplateFile('android/build.gradle', legacy);
    expect(gradle).toContain('foundation-android:1.10.2');
    expect(gradle).toContain('material3-android:1.5.0-alpha13');
  });

  it('uses the current Compose artifact versions in build.gradle by default', async () => {
    const gradle = await renderTemplateFile('android/build.gradle', modern);
    expect(gradle).toContain('foundation-android:1.10.6');
    expect(gradle).toContain('material3-android:1.5.0-alpha17');
  });

  it('lowers the iOS deployment target to 15.1 for SDK 55', async () => {
    const podspec = await renderTemplateFile('ios/{%- project.name %}.podspec', legacy);
    expect(podspec).toContain(":ios => '15.1'");
    expect(podspec).toContain(":tvos => '15.1'");
  });

  it('keeps the iOS deployment target at 16.4 by default', async () => {
    const podspec = await renderTemplateFile('ios/{%- project.name %}.podspec', modern);
    expect(podspec).toContain(":ios => '16.4'");
  });

  it('registers the Compose view without a Content block on SDK 55', async () => {
    expect(legacy.moduleSnippetsKt).toContain('ExpoUIView<MyModuleComposeViewProps>');
    expect(legacy.moduleSnippetsKt).not.toContain('Content {');
  });

  it('registers the Compose view with a Content block by default', async () => {
    expect(modern.moduleSnippetsKt).toContain('Content { props ->');
  });

  it('generates a self-contained Compose view and modifier for SDK 55', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'legacy-snippets-'));
    try {
      await copyFileSnippets(SNIPPETS_DIR, localData.project.features, legacy, tmpDir);
      const view = await fs.promises.readFile(
        path.join(tmpDir, 'src', 'MyModuleComposeView.tsx'),
        'utf8'
      );
      const modifier = await fs.promises.readFile(
        path.join(tmpDir, 'src', 'MyModuleComposeModifier.ts'),
        'utf8'
      );
      expect(view).toContain(
        "import type { ExpoModifier } from '@expo/ui/jetpack-compose/modifiers'"
      );
      expect(view).toContain('function createViewModifierEventListener(');
      expect(view).not.toContain('PrimitiveBaseProps');
      expect(modifier).toContain("$type: 'myModuleComposeModifier'");
      expect(modifier).not.toContain('createModifier(');
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('generates a Compose view and modifier that use the @expo/ui helpers by default', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'modern-snippets-'));
    try {
      await copyFileSnippets(SNIPPETS_DIR, localData.project.features, modern, tmpDir);
      const view = await fs.promises.readFile(
        path.join(tmpDir, 'src', 'MyModuleComposeView.tsx'),
        'utf8'
      );
      const modifier = await fs.promises.readFile(
        path.join(tmpDir, 'src', 'MyModuleComposeModifier.ts'),
        'utf8'
      );
      expect(view).toContain('extends PrimitiveBaseProps');
      expect(view).toContain(
        "import { createViewModifierEventListener } from '@expo/ui/jetpack-compose/modifiers'"
      );
      expect(modifier).toContain("createModifier('myModuleComposeModifier', params)");
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
