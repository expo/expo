/* eslint-env jest */
import execa from 'execa';
import fs from 'fs-extra';
import klawSync from 'klaw-sync';
import path from 'path';

import { projectRoot, bin } from './utils';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;

beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
  process.env._EXPO_E2E_USE_PATH_ALIASES = '1';
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
  delete process.env._EXPO_E2E_USE_PATH_ALIASES;
});

function ensureTesterReady(fixtureName: string): string {
  const root = path.join(__dirname, '../../../../../apps/router-e2e');
  // Clear metro cache for the env var to be updated
  // await fs.remove(path.join(root, "node_modules/.cache/metro"));

  // @ts-ignore
  process.env.E2E_ROUTER_SRC = fixtureName;

  return root;
}

it(
  'runs `npx expo export:embed --platform ios --eager`',
  async () => {
    const projectRoot = ensureTesterReady('static-rendering');
    const output = 'dist-export-embed-eager-source-maps';
    await fs.remove(path.join(projectRoot, output));
    await fs.ensureDir(path.join(projectRoot, output));

    await execa(
      'node',
      [
        bin,
        'export:embed',
        '--eager',
        '--bundle-output',
        `./${output}/output.js`,
        '--assets-dest',
        output,
        '--platform',
        'ios',
      ],
      {
        cwd: projectRoot,
        stdio: 'inherit',
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'static',
          E2E_ROUTER_SRC: 'static-rendering',
          E2E_ROUTER_ASYNC: 'development',
          EXPO_USE_FAST_RESOLVER: '1',
        },
      }
    );

    const outputDir = path.join(projectRoot, output);
    // List output files with sizes for snapshotting.
    // This is to make sure that any changes to the output are intentional.
    // Posix path formatting is used to make paths the same across OSes.
    const files = klawSync(outputDir)
      .map((entry) => {
        if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
          return null;
        }
        return path.posix.relative(outputDir, entry.path);
      })
      .filter(Boolean);

    // Ensure output.js is a utf8 encoded file
    const outputJS = fs.readFileSync(path.join(outputDir, 'output.js'), 'utf8');
    expect(outputJS.slice(0, 5)).toBe('var _');
    // Ensure no `//# sourceURL=` comment
    expect(outputJS).toContain('//# sourceURL=');
    // Ensure `//# sourceMappingURL=output.js.map`
    expect(outputJS).not.toContain('//# sourceMappingURL=output.js.map');

    // If this changes then everything else probably changed as well.
    expect(files).toEqual([
      'assets/__e2e__/static-rendering/sweet.ttf',
      'assets/__packages/@expo/metro-runtime/assets/alert-triangle.png',
      'assets/__packages/@expo/metro-runtime/assets/loader.png',
      'assets/__packages/expo-router/assets/error.png',
      'assets/__packages/expo-router/assets/file.png',
      'assets/__packages/expo-router/assets/forward.png',
      'assets/__packages/expo-router/assets/pkg.png',
      'assets/assets/icon.png',
      'output.js',
    ]);
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);

it(
  'runs `npx expo export:embed --platform ios --eager` with server actions',
  async () => {
    const projectRoot = ensureTesterReady('03-server-actions-only');
    const output = 'dist-export-embed-eager-dom-server-actions';
    await fs.remove(path.join(projectRoot, output));
    await fs.ensureDir(path.join(projectRoot, output));

    await execa(
      'node',
      [
        bin,
        'export:embed',
        '--eager',
        '--bundle-output',
        `./${output}/output.js`,
        '--assets-dest',
        output,
        '--platform',
        'ios',
      ],
      {
        cwd: projectRoot,
        stdio: 'inherit',
        env: {
          NODE_ENV: 'production',
          // EXPO_USE_STATIC: 'static',
          E2E_ROUTER_SRC: '03-server-actions-only',
          E2E_ROUTER_ASYNC: 'development',
          EXPO_USE_FAST_RESOLVER: '1',
          EXPO_USE_STATIC: 'single',
          EXPO_UNSTABLE_SERVER_ACTIONS: '1',
          E2E_ROUTER_JS_ENGINE: 'hermes',
          EXPO_USE_METRO_REQUIRE: '1',
          E2E_CANARY_ENABLED: '1',
          //   E2E_RSC_ENABLED: '1',
          TEST_SECRET_VALUE: 'test-secret',
          CI: '1',
        },
      }
    );

    const outputDir = path.join(projectRoot, output);
    // List output files with sizes for snapshotting.
    // This is to make sure that any changes to the output are intentional.
    // Posix path formatting is used to make paths the same across OSes.
    const files = klawSync(outputDir)
      .map((entry) => {
        if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
          return null;
        }
        return path.posix.relative(outputDir, entry.path);
      })
      .filter(Boolean);

    // Ensure output.js is a utf8 encoded file
    const outputJS = fs.readFileSync(path.join(outputDir, 'output.js'), 'utf8');
    expect(outputJS.slice(0, 5)).toBe('var _');
    // Ensure no `//# sourceURL=` comment
    expect(outputJS).toContain('//# sourceURL=');
    // Ensure `//# sourceMappingURL=output.js.map`
    expect(outputJS).not.toContain('//# sourceMappingURL=output.js.map');

    // If this changes then everything else probably changed as well.
    expect(files).toEqual([
      'assets/__e2e__/static-rendering/sweet.ttf',
      'assets/__packages/@expo/metro-runtime/assets/alert-triangle.png',
      'assets/__packages/@expo/metro-runtime/assets/loader.png',
      'assets/__packages/expo-router/assets/error.png',
      'assets/__packages/expo-router/assets/file.png',
      'assets/__packages/expo-router/assets/forward.png',
      'assets/__packages/expo-router/assets/pkg.png',
      'assets/assets/icon.png',
      'output.js',
    ]);
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);
