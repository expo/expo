/* eslint-env node */
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname);

const REEXPORT_PACKAGES = [
  'metro',
  'metro-babel-transformer',
  'metro-cache',
  'metro-cache-key',
  'metro-config',
  'metro-core',
  'metro-file-map',
  'metro-resolver',
  'metro-runtime',
  'metro-source-map',
  'metro-transform-plugins',
  'metro-transform-worker',
];

export default async function tasks(task) {
  await task.serial(['clean', 'vendor']);
}

export async function clean(task) {
  for (const packageName of REEXPORT_PACKAGES) {
    await task.clear(path.join(ROOT_DIR, packageName));
  }
}

export async function vendor(task) {
  for (const packageName of REEXPORT_PACKAGES) {
    const packageDir = path.dirname(require.resolve(`${packageName}/package.json`));
    const outputDir = path.join(ROOT_DIR, packageName);

    // Generate the re-exporting files and type definitions
    await task
      .source(`${packageDir}/src/**/*.{js,d.ts}`, {
        ignore: ['**/*.flow.js', '**/__tests__/**', '**/__mocks__/**', '**/integration_tests/**'],
      })
      .reexport({ packageName })
      .target(outputDir);
  }
}
