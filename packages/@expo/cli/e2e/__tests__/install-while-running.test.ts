/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 *
 * End-to-end coverage for https://github.com/expo/expo/issues/48950: package
 * installs, removals, and reinstalls while the dev server runs must reach
 * Metro's file map without a server restart.
 *
 * The setup mirrors the issue: a published-SDK project owned by a real
 * package manager, a running dev server, then several install-and-import
 * cycles. `expo install` picks the package manager from the lockfile, so the
 * `E2E_INSTALL_PM` environment variable selects the whole toolchain
 * (default bun, like the issue's project).
 *
 * On Linux and Windows the dev server watches files with `FallbackWatcher`.
 * On macOS it uses `NativeWatcher`, which currently loses install events the
 * same way — see the known-issue note below.
 */
import fs from 'fs/promises';
import path from 'path';

import { createExpoStart, executeExpoAsync } from '../utils/expo';
import { getTemporaryPath } from '../utils/path';
import { executeAsync } from '../utils/process';

jest.setTimeout(20 * 60 * 1000);

const FIXTURE_DIR = path.join(__dirname, '../fixtures/with-blank');

const PM = (process.env.E2E_INSTALL_PM ?? 'bun') as 'bun' | 'npm' | 'pnpm';
const PM_COMMANDS: Record<typeof PM, { install: string[]; remove: string[] }> = {
  bun: { install: ['bun', 'install'], remove: ['bun', 'remove'] },
  npm: {
    install: ['npm', 'install', '--no-audit', '--no-fund'],
    remove: ['npm', 'uninstall', '--no-audit', '--no-fund'],
  },
  pnpm: { install: ['pnpm', 'install'], remove: ['pnpm', 'remove'] },
};

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

// KNOWN ISSUE (macOS): `NativeWatcher` also loses install events, with what
// is likely a distinct root cause — intermittently (observed between 0 and 4
// stale cycles per run), and a restart with zero changes also fixes it
// there. The intermittency rules out `it.failing`, so the macOS CI job runs
// this suite with `continue-on-error` instead until that watcher is fixed.

// The dev server only watches files outside CI, and watching is the behavior
// under test, so remove the CI markers from the server's environment. An
// `undefined` value removes the variable from the child environment; an empty
// string would break the CLI's boolean environment parsing.
const WATCH_ENV = {
  CI: undefined,
  CONTINUOUS_INTEGRATION: undefined,
  GITHUB_ACTIONS: undefined,
  BUILD_NUMBER: undefined,
  RUN_ID: undefined,
} as unknown as Record<string, string>;

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

async function createProject(dependencies: Record<string, string>): Promise<string> {
  const projectRoot = getTemporaryPath();
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
          ...dependencies,
        },
      },
      null,
      2
    )
  );
  // The install writes the package manager's lockfile, which `expo install`
  // reads to pick the same package manager for later installs.
  await executeAsync(projectRoot, PM_COMMANDS[PM].install);
  return projectRoot;
}

async function pollBundle(
  expo: ReturnType<typeof createExpoStart>,
  isDone: (status: number) => boolean
): Promise<{ ok: boolean; lastError: Error | null; text: string | null }> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let lastError: Error | null = null;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    try {
      const response = await expo.fetchBundleAsync('/App.bundle?platform=ios');
      if (isDone(response.status)) {
        return { ok: true, lastError: null, text: await response.text() };
      }
    } catch (error: any) {
      lastError = error;
      // `fetchBundleAsync` throws on Metro error payloads; a thrown
      // resolution error is the "bundle fails" terminal state.
      if (isDone(500)) {
        return { ok: true, lastError: error, text: null };
      }
    }
  }
  return { ok: false, lastError, text: null };
}

describe(`installs while the dev server runs (${PM})`, () => {
  const expo = createExpoStart({ env: WATCH_ENV });
  let projectRoot: string;

  beforeAll(async () => {
    projectRoot = await createProject({});
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

      const result = await pollBundle(expo, (status) => status === 200);
      if (!result.ok) {
        staleCycles.push(
          `cycle ${cycleIndex + 1} (${packages.join(', ')}): ` +
            `${result.lastError?.message?.slice(0, 300)}`
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
});

// pnpm links `node_modules/<pkg>` into its `.pnpm` store and the file map
// stores the resolved target paths. `pnpm remove` deletes the link while the
// store contents linger until pruning, so a removal is legitimately still
// resolvable and these assertions do not apply.
const describeRemoval = PM === 'pnpm' ? describe.skip : describe;

describeRemoval(`removals and reinstalls while the dev server runs (${PM})`, () => {
  const expo = createExpoStart({ env: WATCH_ENV });
  let projectRoot: string;

  beforeAll(async () => {
    // The package under test is installed before the server starts, so the
    // walk discovers it and the app renders with it.
    projectRoot = await createProject({ 'expo-crypto': '~57.0.0' });
    await fs.writeFile(path.join(projectRoot, 'App.js'), appSource(['expo-crypto']));
    expo.options.cwd = projectRoot;
    await expo.startAsync();
  });

  afterAll(async () => {
    await expo.stopAsync();
  });

  it('stops resolving a package removed while the dev server runs', async () => {
    const warm = await expo.fetchBundleAsync('/App.bundle?platform=ios');
    expect(warm.status).toBe(200);

    await executeAsync(projectRoot, [...PM_COMMANDS[PM].remove, 'expo-crypto']);

    // The app still imports the removed package, so the delete events must
    // turn the bundle into a resolution failure — a server that keeps serving
    // the stale module never noticed the removal.
    const result = await pollBundle(expo, (status) => status !== 200);
    if (!result.ok) {
      throw new Error('The bundle kept resolving a package removed from node_modules.');
    }
  });

  // KNOWN ISSUE (npm): reinstalling at the same path leaves the file map
  // partially stale — the recreated `package.json` resolves but its `main`
  // target does not, deterministically in CI samples. Likely a stale watcher
  // entry: on Linux, deleting a watched directory emits no `error` and no
  // `close`, so a missed delete event leaves a dead handle in `#watched`
  // that blocks re-watching the recreated directory. Tracked as a follow-up;
  // `it.failing` flips this to an unexpected pass when it gets fixed.
  const itReinstall = PM === 'npm' ? it.failing : it;

  itReinstall('resolves a package reinstalled at the same path', async () => {
    // Reinstalling recreates directories at paths the watcher saw deleted,
    // which exercises the re-watch of a reused path end to end.
    await executeExpoAsync(projectRoot, ['install', 'expo-crypto']);

    const result = await pollBundle(expo, (status) => status === 200);
    if (!result.ok) {
      throw new Error(
        `The reinstalled package did not become resolvable before the deadline. ` +
          `Last error: ${result.lastError?.message?.slice(0, 300)}`
      );
    }
  });
});
