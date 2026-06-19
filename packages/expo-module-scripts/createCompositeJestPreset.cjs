'use strict';

const fs = require('node:fs');
const path = require('node:path');

const basePreset = require('./jest-preset.cjs');

// Builds a single multi-project Jest config for a package that has build sub-targets
// (e.g. `plugin`, `cli`, `utils`) with their own tests. The package's `src` tests run via
// the multi-platform module preset, and each sub-folder runs as its own project rooted at
// that folder — so a single `jest` invocation runs the whole package.
//
// Notes:
// - Jest forbids nesting `projects`, so the module preset's per-platform projects are
//   flattened in rather than added as one entry.
// - `watchPlugins`/`prettierPath` are root-only in multi-project mode, so they're kept at the
//   root (from the module preset) and stripped from each sub-project config.
// - `rootDir` is forced to the sub-folder so the sub-configs don't need to be invoked with an
//   external `--rootDir` (as `expo-module test <target>` does).
// `opts.srcProjects` overrides the default `src` projects — used by packages whose `src`
// tests are platform-specific (e.g. iOS-only) rather than the full multi-platform set.
module.exports = function createCompositeJestPreset(rootDir, subdirs = [], { srcProjects } = {}) {
  return {
    ...basePreset,
    projects: [
      // `src` — flattened per-platform projects from the module preset (or a custom set).
      ...(srcProjects ?? basePreset.projects),
      // Each build sub-target as its own project, rooted at its folder. Mirrors
      // `expo-module test <target>`: use the sub-folder's own `jest.config.js` if present,
      // otherwise fall back to the default preset for that target (`jest-preset-<target>`).
      ...subdirs.map((dir) => {
        const localConfig = path.join(rootDir, dir, 'jest.config.js');
        const { watchPlugins, prettierPath, ...config } = fs.existsSync(localConfig)
          ? require(localConfig)
          : require(`./jest-preset-${dir}.cjs`);
        // Name the project after its folder so failures are attributable in multi-project output.
        return { displayName: dir, ...config, rootDir: path.join(rootDir, dir) };
      }),
    ],
  };
};
