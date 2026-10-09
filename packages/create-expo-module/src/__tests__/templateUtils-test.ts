import ejs from 'ejs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  buildAugmentedData,
  getGeneratedWebStubSentinel,
  getTemplateDistTag,
  getTemplateVersion,
  normalizeNpmPackResult,
  updateWebStub,
} from '../templateUtils';
import type { SubstitutionData } from '../types';

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

describe(getTemplateVersion, () => {
  const cliTag = getTemplateDistTag(require('../../package.json').version);

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['a local module in a supported SDK', true, 56, 'sdk-56'],
    ['a local module in an unsupported SDK', true, 55, cliTag],
    ['a local module in an unknown SDK', true, null, 'latest'],
    ['a standalone module', false, null, cliTag],
  ])('selects the template for %s', (_label, isLocal, sdkVersion, expected) => {
    expect(getTemplateVersion(isLocal, sdkVersion)).toBe(expected);
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

const SNIPPETS_DIR = path.resolve(__dirname, '../../../expo-module-template/snippets');

async function renderTemplateFile(relativePath: string, data: object): Promise<string> {
  const template = await fs.promises.readFile(path.join(SNIPPETS_DIR, '..', relativePath), 'utf8');
  return ejs.render(template, data);
}

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
    const data = await buildAugmentedData(SNIPPETS_DIR, mockData);
    const podspec = await renderTemplateFile('ios/{%- project.name %}.podspec', {
      ...data,
      type: 'local',
    });
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
