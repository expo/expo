import fs from 'node:fs';
import path from 'node:path';

import { createFakeProject, executePassing, projectRoot } from './utils';

afterAll(async () => {
  await fs.promises.rm(projectRoot, { recursive: true, force: true });
});

it('creates a standalone module at an absolute destination with repository metadata', async () => {
  const cwd = createFakeProject('caller');
  const target = path.join(projectRoot, 'absolute-module');
  await executePassing(
    [
      target,
      '--no-example',
      '--package-manager',
      'npm',
      '--name',
      'AbsoluteModule',
      '--author-name',
      'Test',
      '--author-email',
      'test@example.com',
      '--author-url',
      'https://example.com',
      '--repo',
      'https://example.com/module',
      '--module-version',
      '1.2.3',
      '--platform',
      'apple',
      'android',
      '--features',
      'Function',
      '--source',
      path.resolve(__dirname, '../../../expo-module-template'),
    ],
    { cwd }
  );

  const pkg = JSON.parse(await fs.promises.readFile(path.join(target, 'package.json'), 'utf8'));
  expect(pkg.version).toBe('1.2.3');
  const podspec = await fs.promises.readFile(
    path.join(target, 'ios/AbsoluteModule.podspec'),
    'utf8'
  );
  expect(podspec).toContain("s.version        = package['version']");
  expect(podspec).toContain("s.source         = { git: 'https://example.com/module' }");
  const gradle = await fs.promises.readFile(path.join(target, 'android/build.gradle'), 'utf8');
  expect(gradle).toContain("version = '1.2.3'");
  expect(gradle).toContain('versionName "1.2.3"');
  expect(fs.existsSync(path.join(cwd, target))).toBe(false);
  expect(fs.existsSync(path.join(target, 'build/index.d.ts'))).toBe(true);
});
