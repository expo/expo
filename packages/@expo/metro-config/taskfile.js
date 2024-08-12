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
    const packageFile = require.resolve(`${packageName}/package.json`);
    const packageDir = path.dirname(packageFile);
    const outputDir = path.join(ROOT_DIR, packageName);

    // Generate a re-exported "package.json" file, to import as `@expo/metro-config/metro-*/package.json`.
    // This can be used to determine the version of the re-exported package.
    await task.source(packageFile).reexport({ packageDir, packageName }).target(outputDir);

    // Generate the re-exporting files and type definitions
    await task
      .source(`${packageDir}/src/**/*.{js,d.ts}`, {
        ignore: ['**/*.flow.js', '**/__tests__/**', '**/__mocks__/**', '**/integration_tests/**'],
      })
      .reexport({ packageDir, packageName })
      .target(outputDir);

    this.$.log('> Re-exported files for', packageName);
  }
}
