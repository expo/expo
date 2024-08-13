/* eslint-env node */
import path from 'node:path';

/** The root directory of `@expo/metro` */
const ROOT_DIR = path.resolve(__dirname);
/** All Metro (sub)packages that are vendored inside `@expo/metro` */
const METRO_PACKAGES = [
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

/** The default Taskr jobs to run */
export default async function tasks(task) {
  await task.serial(['clean', 'vendor']);
}

/** Clean up the generated Metro files through `taskr clean` */
export async function test(task) {
  for (const packageName of METRO_PACKAGES) {
    const packageFile = require.resolve(`${packageName}/package.json`);
    const packageDir = path.dirname(packageFile);
    const outputDir = path.join(ROOT_DIR, packageName);

    // Generate the vendored files and type definitions
    await task
      .source(`${packageDir}/src/**/*.{js,d.ts}`, {
        ignore: ['**/*.flow.js', '**/__tests__/**', '**/__mocks__/**', '**/integration_tests/**'],
      })
      .augment({ packageName, packageDir })
      .target(outputDir);
  }
}

/** Clean up the generated Metro files through `taskr clean` */
export async function clean(task) {
  for (const packageName of METRO_PACKAGES) {
    await task.clear(path.join(ROOT_DIR, packageName));
  }
}

/** Generate all vendored metro files through `taskr vendor` */
export async function vendor(task) {
  for (const packageName of METRO_PACKAGES) {
    const packageFile = require.resolve(`${packageName}/package.json`);
    const packageDir = path.dirname(packageFile);
    const outputDir = path.join(ROOT_DIR, packageName);

    // Generate a simplified "package.json" file, which holds basic metadata of the vendored package.
    // This can be imported through `import { version } from '@expo/metro/metro/package.json'`
    await task.source(packageFile).vendor({ packageName }).target(outputDir);

    // Generate the vendored files and type definitions
    await task
      .source(`${packageDir}/src/**/*.{js,d.ts}`, {
        ignore: ['**/*.flow.js', '**/__tests__/**', '**/__mocks__/**', '**/integration_tests/**'],
      })
      .vendor({ packageName })
      .target(outputDir);
  }
}
