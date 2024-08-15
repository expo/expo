/* eslint-env node */
const path = require('node:path');

/** The root directory of `@expo/metro` */
const ROOT_DIR = __dirname;
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
function* tasks(task) {
  yield task.serial(['clean', 'vendor']);
}

/** Clean up the generated Metro files through `taskr clean` */
function* clean(task) {
  for (const packageName of METRO_PACKAGES) {
    yield task.clear(path.join(ROOT_DIR, packageName));
  }
}

/** Generate all vendored metro files through `taskr vendor` */
function* vendor(task) {
  for (const packageName of METRO_PACKAGES) {
    const packageFile = require.resolve(`${packageName}/package.json`);
    const packageDir = path.dirname(packageFile);
    const outputDir = path.join(ROOT_DIR, packageName);

    // Generate a simplified "package.json" file, which holds basic metadata of the vendored package.
    // This can be imported through `import { version } from '@expo/metro/metro/package.json'`
    yield task.source(packageFile).vendor({ packageName }).target(outputDir);

    // Generate the vendored files and type definitions
    yield task
      .source(`${packageDir}/src/**/*.js`, {
        ignore: [
          '**/*.flow.js',
          '**/__fixtures__/**',
          '**/__mocks__/**',
          '**/__tests__/**',
          '**/integration_tests/**',
        ],
      })
      .vendor({ packageName })
      .target(outputDir);
  }
}

module.exports = {
  default: tasks,
  clean,
  vendor,
};
