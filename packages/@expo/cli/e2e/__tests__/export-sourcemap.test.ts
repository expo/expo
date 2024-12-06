import JsonFile from '@expo/json-file';
import execa from 'execa';
import type { BasicSourceMap } from 'metro-source-map';
import path from 'node:path';

import { bin, findProjectFiles, setupTestProjectWithOptionsAsync } from './utils';

it('runs `npx export -p ios --source-maps` with relative sourcemap file paths', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync('export-sourcemap', 'with-blank');

  // Create the export with source maps
  await execa('node', [bin, 'export', '-p', 'ios', '--source-maps'], { cwd: projectRoot });

  // Find the exported sourcemap
  const outputDir = path.join(projectRoot, 'dist');
  const files = findProjectFiles(outputDir).filter((file) => file.endsWith('.map'));

  // Ensure the source map is generated
  expect(files).not.toEqual([]);

  // Load the sourcemap and parse it as JSON
  const rawmap = await JsonFile.readAsync(path.resolve(outputDir, files[0]));
  const sourcemap = rawmap as unknown as BasicSourceMap;

  // Ensure the sourcemap does not contain absolute paths to the project directory
  expect(sourcemap.sources).not.toEqual(
    expect.arrayContaining([expect.stringContaining(projectRoot)])
  );
});
