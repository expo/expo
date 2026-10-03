import fs from 'fs/promises';
import { vol } from 'memfs';
import path from 'path';
import { parseDocument } from 'yaml';

import { updatePnpmCatalogAsync } from '../updatePnpmCatalog';

it('updates default and named catalogs while preserving workspace configuration', async () => {
  const root = '/workspace';
  const appRoot = path.join(root, 'apps', 'app-one');
  const workspacePath = path.join(root, 'pnpm-workspace.yaml');
  try {
    vol.fromJSON({
      [workspacePath]:
        "# shared dependencies\npackages:\n  - 'apps/*'\ncatalog:\n  expo-constants: ~57.0.18\ncatalogs:\n  native:\n    expo-camera: ~16.0.0\n",
      [path.join(appRoot, 'package.json')]: '{}',
    });

    await updatePnpmCatalogAsync(appRoot, [
      { name: 'expo-constants', catalog: '', version: '~57.0.19' },
      { name: 'expo-camera', catalog: 'native', version: '~16.0.1' },
    ]);

    const workspace = await fs.readFile(workspacePath, 'utf8');
    expect(parseDocument(workspace).toJS()).toEqual({
      packages: ['apps/*'],
      catalog: { 'expo-constants': '~57.0.19' },
      catalogs: { native: { 'expo-camera': '~16.0.1' } },
    });
    expect(workspace).toContain('# shared dependencies');
  } finally {
    vol.reset();
  }
});
