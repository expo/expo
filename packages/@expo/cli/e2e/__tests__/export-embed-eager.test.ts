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
    // Expo Log Box -> only with dev true
    'assets/__packages/@expo/log-box/assets/alert-triangle.png',
    'assets/__packages/@expo/log-box/assets/loader.png',
    'assets/__packages/expo-router/assets/arrow_down.png',
    'assets/__packages/expo-router/assets/error.png',
    'assets/__packages/expo-router/assets/file.png',
    'assets/__packages/expo-router/assets/forward.png',
    'assets/__packages/expo-router/assets/logotype.png',
    'assets/__packages/expo-router/assets/pkg.png',
    'assets/__packages/expo-router/assets/sitemap.png',
    'assets/__packages/expo-router/assets/unmatched.png',
    'assets/assets/icon.png',
    'output.js',
    // Expo Log Box -> only with dev true
    'www.bundle/6ccecc6f90fbf607e4040a467eb50f23.html',
    'www.bundle/_expo/static/css/CodeFrame.module-7d2406223d5c27c6302aacfd94b51292.css',
    'www.bundle/_expo/static/css/Global-fbc9d229bd076ede2e9a4c74cc86d132.css',
    'www.bundle/_expo/static/css/Header.module-bf0e4a8128b6312268d6c1030a1c021f.css',
    'www.bundle/_expo/static/css/Overlay.module-f60436ce3d449d676489ad561084cc0e.css',
    'www.bundle/_expo/static/css/StackTraceList.module-08f8edc405530b254607272260b9fa03.css',
    'www.bundle/_expo/static/js/web/entry-d41d8cd98f00b204e9800998ecf8427e.js',
    'www.bundle/assets/__packages/@expo/log-box/assets/alert-triangle.4f355ba1efca4b9c0e7a6271af047f61.png',
    'www.bundle/assets/__packages/@expo/log-box/assets/loader.817aca47ff3cea63020753d336e628a4.png',
  ]);
});
