/* eslint-env jest */
import execa from 'execa';
import fs from 'fs-extra';
import klawSync from 'klaw-sync';
import path from 'path';

import {
  expectChunkPathMatching,
  projectRoot,
  bin,
  setupTestProjectWithOptionsAsync,
} from './utils';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;

beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
});

it(
  'runs `npx expo export -p web`',
  async () => {
    const projectRoot = await setupTestProjectWithOptionsAsync(
      'expo-28016-export-async-imports',
      'with-circular-async-imports'
    );
    // `npx expo export:web`
    await execa('node', [bin, 'export', '-p', 'web', '--no-minify'], {
      cwd: projectRoot,
    });

    const outputDir = path.join(projectRoot, 'dist');
    const files = klawSync(outputDir)
      .map((entry) => {
        if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
          return null;
        }
        return path.posix.relative(outputDir, entry.path);
      })
      .filter(Boolean);

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
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);
