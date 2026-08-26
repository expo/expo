/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 *
 * #48950: install while the dev server runs. Skips Darwin (NativeWatcher).
 */
import fs from 'fs/promises';
import path from 'path';

import { createExpoStart, executeExpoAsync } from '../utils/expo';
import { getTemporaryPath } from '../utils/path';
import { executeAsync } from '../utils/process';

jest.setTimeout(20 * 60 * 1000);

const FIXTURE_DIR = path.join(__dirname, '../fixtures/with-blank');

const PM = (process.env.E2E_INSTALL_PM ?? 'bun') as 'bun' | 'npm' | 'pnpm';
const PM_COMMANDS: Record<typeof PM, { install: string[] }> = {
  bun: { install: ['bun', 'install'] },
  npm: { install: ['npm', 'install', '--no-audit', '--no-fund'] },
  pnpm: { install: ['pnpm', 'install'] },
};

const CYCLES: string[][] = [
  ['@react-native-async-storage/async-storage', 'expo-haptics', 'expo-clipboard'],
  ['expo-crypto', 'expo-device', 'expo-network'],
  ['expo-battery', 'expo-brightness', 'expo-keep-awake'],
  ['expo-localization', 'expo-sharing', 'expo-blur'],
];

const POLL_TIMEOUT_MS = 45000;
const POLL_INTERVAL_MS = 3000;

const WATCH_ENV = {
  CI: undefined,
  CONTINUOUS_INTEGRATION: undefined,
  GITHUB_ACTIONS: undefined,
  BUILD_NUMBER: undefined,
  RUN_ID: undefined,
} as unknown as Record<string, string>;

const describeInstall = process.platform === 'darwin' ? describe.skip : describe;

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

async function createProject(): Promise<string> {
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
        },
      },
      null,
      2
    )
  );
  await executeAsync(projectRoot, PM_COMMANDS[PM].install);
  return projectRoot;
}

async function pollBundle(
  expo: ReturnType<typeof createExpoStart>
): Promise<{ ok: boolean; lastError: Error | null }> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let lastError: Error | null = null;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    try {
      const response = await expo.fetchBundleAsync('/App.bundle?platform=ios');
      if (response.status === 200) {
        return { ok: true, lastError: null };
      }
    } catch (error: any) {
      lastError = error;
    }
  }
  return { ok: false, lastError };
}

describeInstall(`installs while the dev server runs (${PM})`, () => {
  const expo = createExpoStart({ env: WATCH_ENV });
  let projectRoot: string;

  beforeAll(async () => {
    projectRoot = await createProject();
    expo.options.cwd = projectRoot;
    await expo.startAsync();
  });

  afterAll(async () => {
    await expo.stopAsync();
  });

  it('resolves packages installed while the dev server runs (#48950)', async () => {
    const warm = await expo.fetchBundleAsync('/App.bundle?platform=ios');
    expect(warm.status).toBe(200);

    const imported: string[] = [];
    const staleCycles: string[] = [];

    for (const [cycleIndex, packages] of CYCLES.entries()) {
      await executeExpoAsync(projectRoot, ['install', ...packages]);
      imported.push(...packages);
      await fs.writeFile(path.join(projectRoot, 'App.js'), appSource(imported));

      const result = await pollBundle(expo);
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
