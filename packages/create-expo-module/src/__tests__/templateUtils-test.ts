import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { getGeneratedWebStubSentinel, updateWebStub } from '../templateUtils';
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
