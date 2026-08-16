/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 *
 * End-to-end reproduction of https://github.com/expo/expo/issues/48950:
 * packages installed with `npx expo install` while the dev server runs must
 * become resolvable without a server restart.
 *
 * The setup mirrors the issue: a bun-owned published-SDK project (bun.lock
 * makes `expo install` shell out to `bun add`), a running dev server, then
 * several install-and-import cycles. The reporter's environment (Linux, no
 * watchman) watches files with `FallbackWatcher`, and the staleness hit 2 of
 * 4 cycles there, so this test runs 4 cycles and fails on any stale cycle.
 */
import fs from 'fs/promises';
import path from 'path';

import { createExpoStart, executeExpoAsync } from '../utils/expo';
import { getTemporaryPath } from '../utils/path';
import { executeAsync } from '../utils/process';

jest.setTimeout(15 * 60 * 1000);

const FIXTURE_DIR = path.join(__dirname, '../fixtures/with-blank');

// One trio per cycle; the first is the exact trio from the issue. Every
// cycle uses packages that no earlier cycle resolved, because a package
// that is already in the file map cannot go stale.
const CYCLES: string[][] = [
  ['@react-native-async-storage/async-storage', 'expo-haptics', 'expo-clipboard'],
  ['expo-crypto', 'expo-device', 'expo-network'],
  ['expo-battery', 'expo-brightness', 'expo-keep-awake'],
  ['expo-localization', 'expo-sharing', 'expo-blur'],
];

const POLL_TIMEOUT_MS = 45000;
const POLL_INTERVAL_MS = 3000;

// The dev server only watches files outside CI, and watching is the behavior
// under test, so remove the CI markers from the server's environment. An
// `undefined` value removes the variable from the child environment; an empty
// string would break the CLI's boolean environment parsing.
const expo = createExpoStart({
  env: {
    CI: undefined,
    CONTINUOUS_INTEGRATION: undefined,
    GITHUB_ACTIONS: undefined,
    BUILD_NUMBER: undefined,
    RUN_ID: undefined,
  } as unknown as Record<string, string>,
});

let projectRoot: string;

function appSource(packages: string[]): string {
  const imports = packages.map((name, index) => `import * as installed${index} from '${name}';`);
  const names = packages.map((_, index) => `installed${index}`).join(', ');
  return [
    ...imports,
    '',
    'export default function App() {',
    `  return [${names}].map((mod) => Object.keys(mod).length).join(',');`,
    '}',
    '',
  ].join('\n');
}

beforeAll(async () => {
  // A bun-owned project on the published SDK, like the issue's project. The
  // dev server still runs from the monorepo CLI, so the file map under test
  // comes from the monorepo source.
  projectRoot = getTemporaryPath();
  await fs.mkdir(projectRoot, { recursive: true });
  for (const file of ['index.js', 'app.json', 'metro.config.js']) {
    await fs.copyFile(path.join(FIXTURE_DIR, file), path.join(projectRoot, file));
  }
  await fs.writeFile(path.join(projectRoot, 'App.js'), appSource([]));
  await fs.writeFile(
    path.join(projectRoot, 'package.json'),
    JSON.stringify(
      {
        name: 'install-while-running',
        version: '1.0.0',
        main: 'index.js',
        private: true,
        dependencies: {
          expo: '~57.0.0',
          react: '19.2.3',
          'react-native': '0.86.2',
        },
        // The issue's project is the TypeScript template. The dependency
        // also keeps the CLI's TypeScript prerequisite deterministic.
        devDependencies: {
          typescript: '~6.0.3',
        },
      },
      null,
      2
    )
  );
  await fs.writeFile(
    path.join(projectRoot, 'tsconfig.json'),
    JSON.stringify({ extends: 'expo/tsconfig.base', compilerOptions: {} }, null, 2)
  );
  await executeAsync(projectRoot, ['bun', 'install']);

  expo.options.cwd = projectRoot;
  await expo.startAsync();
});

afterAll(async () => {
  await expo.stopAsync();
});

it('resolves packages installed while the dev server runs (#48950)', async () => {
  // The app must render before the first install, like the issue's step 2.
  const warm = await expo.fetchBundleAsync('/App.bundle?platform=ios');
  expect(warm.status).toBe(200);

  const imported: string[] = [];
  const staleCycles: string[] = [];

  for (const [cycleIndex, packages] of CYCLES.entries()) {
    // Install while the server runs, then import (issue steps 3 and 4).
    await executeExpoAsync(projectRoot, ['install', ...packages]);
    imported.push(...packages);
    await fs.writeFile(path.join(projectRoot, 'App.js'), appSource(imported));

    const deadline = Date.now() + POLL_TIMEOUT_MS;
    let bundled = false;
    let lastError: Error | null = null;
    while (!bundled && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      try {
        const response = await expo.fetchBundleAsync('/App.bundle?platform=ios');
        bundled = response.status === 200;
      } catch (error: any) {
        lastError = error;
      }
    }

    if (!bundled) {
      staleCycles.push(
        `cycle ${cycleIndex + 1} (${packages.join(', ')}): ${lastError?.message?.slice(0, 300)}`
      );
    }
  }

  if (staleCycles.length > 0) {
    throw new Error(
      `The file map went stale in ${staleCycles.length} of ${CYCLES.length} ` +
        `install cycles:\n${staleCycles.join('\n')}`
    );
  }
});
