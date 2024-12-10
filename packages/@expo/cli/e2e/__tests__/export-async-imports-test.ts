/* eslint-env jest */
import fs from 'fs';
import path from 'path';

import {
  expectChunkPathMatching,
  projectRoot,
  setupTestProjectWithOptionsAsync,
  findProjectFiles,
} from './utils';
import { executeExpoAsync } from '../utils/expo';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;

beforeAll(async () => {
  await fs.promises.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
});

it('runs `npx expo export -p web`', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync(
    'expo-28016-export-async-imports',
    'with-circular-async-imports'
  );

  // `npx expo export:web`
  await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--no-minify']);

  const outputDir = path.join(projectRoot, 'dist');
  const files = findProjectFiles(outputDir);

  // If this changes then everything else probably changed as well.
  expect(files).toEqual(
    expect.arrayContaining([
      expectChunkPathMatching('AppEntry'),
      expectChunkPathMatching('a'),
      expectChunkPathMatching('b'),
      expectChunkPathMatching('c'),
    ])
  );

  const appEntryFile = files.find((name) => name?.startsWith('_expo/static/js/web/AppEntry-'))!;
  expect(appEntryFile).toEqual(expectChunkPathMatching('AppEntry'));

  // NOTE: We don't expect an async import depending on the entrypoint
  // Hence, we shouldn't see the entrypoint path any output chunk
  for (const file of files) {
    if (!file?.startsWith('_expo/static/js/web/') || !file.endsWith('.js')) continue;
    const contents = fs.readFileSync(path.join(outputDir, file), { encoding: 'utf8' });
    expect(contents).not.toMatch(new RegExp(appEntryFile.replace(/-\/\\\./g, '\\$&')));
  }
});
