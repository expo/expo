/* eslint-env jest */
import fs from 'fs/promises';
import path from 'path';
import { parseDocument } from 'yaml';

import { executeExpoAsync, executePnpmAsync } from '../utils/expo';
import { getTemporaryPath } from '../utils/path';

const projectRoot = getTemporaryPath();
const catalogApps = ['app-one', 'app-two'];
const independentApp = 'app-three';

beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  await fs.writeFile(
    path.join(projectRoot, 'package.json'),
    JSON.stringify({ name: 'expo-install-catalog-workspace', private: true })
  );
  await fs.writeFile(
    path.join(projectRoot, 'pnpm-workspace.yaml'),
    "packages:\n  - 'apps/*'\ncatalog:\n  expo-constants: 57.0.18\n"
  );

  for (const app of [...catalogApps, independentApp]) {
    const appRoot = path.join(projectRoot, 'apps', app);
    await fs.mkdir(appRoot, { recursive: true });
    await fs.writeFile(
      path.join(appRoot, 'package.json'),
      JSON.stringify({
        name: app,
        private: true,
        dependencies: {
          expo: '57.0.25',
          'expo-constants': app === independentApp ? '57.0.18' : 'catalog:',
        },
      })
    );
    await fs.writeFile(
      path.join(appRoot, 'app.json'),
      JSON.stringify({ expo: { name: app, slug: app } })
    );
  }

  await executePnpmAsync(projectRoot, ['install']);
});

it('updates catalog consumers without changing an independent dependency', async () => {
  const appRoot = path.join(projectRoot, 'apps', 'app-two');
  await executeExpoAsync(appRoot, ['install', '--fix', '--pnpm']);

  const workspace = await fs.readFile(path.join(projectRoot, 'pnpm-workspace.yaml'), 'utf8');
  expect(parseDocument(workspace).getIn(['catalog', 'expo-constants'])).toBe('~57.0.19');
  for (const app of catalogApps) {
    const appRoot = path.join(projectRoot, 'apps', app);
    const pkg = JSON.parse(await fs.readFile(path.join(appRoot, 'package.json'), 'utf8'));
    expect(pkg.dependencies['expo-constants']).toBe('catalog:');
    const check = await executeExpoAsync(appRoot, ['install', '--check', '--pnpm']);
    expect(check.stdout).toContain('Dependencies are up to date');
  }

  const independentRoot = path.join(projectRoot, 'apps', independentApp);
  const independentPkg = JSON.parse(
    await fs.readFile(path.join(independentRoot, 'package.json'), 'utf8')
  );
  expect(independentPkg.dependencies['expo-constants']).toBe('57.0.18');
  const installedPkg = JSON.parse(
    await fs.readFile(
      path.join(independentRoot, 'node_modules', 'expo-constants', 'package.json'),
      'utf8'
    )
  );
  expect(installedPkg.version).toBe('57.0.18');

  await executeExpoAsync(independentRoot, ['install', '--fix', '--pnpm']);
  const updatedIndependentPkg = JSON.parse(
    await fs.readFile(path.join(independentRoot, 'package.json'), 'utf8')
  );
  expect(updatedIndependentPkg.dependencies['expo-constants']).toBe('57.0.19');
  expect(await fs.readFile(path.join(projectRoot, 'pnpm-workspace.yaml'), 'utf8')).toBe(workspace);
});
