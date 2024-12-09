/* eslint-env jest */
import fs from 'fs';
import path from 'path';

import { projectRoot, findProjectFiles } from './utils';
import { executeExpoAsync } from '../utils/expo';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;

beforeAll(async () => {
  await fs.promises.mkdir(projectRoot, { recursive: true });
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

it('runs `npx expo export:embed --platform ios --eager`', async () => {
  const projectRoot = ensureTesterReady('static-rendering');
  const output = 'dist-export-embed-eager-source-maps';
  await fs.promises.rm(path.join(projectRoot, output), { force: true, recursive: true });
  await fs.promises.mkdir(path.join(projectRoot, output));

  // `npx expo export:embed`
  await executeExpoAsync(
    projectRoot,
    [
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

  // Ensure output.js is a utf8 encoded file
  const outputJS = fs.readFileSync(path.join(outputDir, 'output.js'), 'utf8');
  expect(outputJS.slice(0, 5)).toBe('var _');
  // Ensure no `//# sourceURL=` comment
  expect(outputJS).toContain('//# sourceURL=');
  // Ensure `//# sourceMappingURL=output.js.map`
  expect(outputJS).not.toContain('//# sourceMappingURL=output.js.map');

  // If this changes then everything else probably changed as well.
  expect(findProjectFiles(outputDir)).toEqual([
    'assets/__e2e__/static-rendering/sweet.ttf',
    'assets/__packages/@expo/metro-runtime/assets/alert-triangle.png',
    'assets/__packages/@expo/metro-runtime/assets/loader.png',
    'assets/__packages/expo-router/assets/error.png',
    'assets/__packages/expo-router/assets/file.png',
    'assets/__packages/expo-router/assets/forward.png',
    'assets/__packages/expo-router/assets/logotype.png',
    'assets/__packages/expo-router/assets/pkg.png',
    'assets/__packages/expo-router/assets/sitemap.png',
    'assets/__packages/expo-router/assets/unmatched.png',
    'assets/assets/icon.png',
    'output.js',
  ]);
});
