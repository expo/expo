import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { getGeneratedWebStubSentinel, getTemplateDistTag, updateWebStub } from '../templateUtils';
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
