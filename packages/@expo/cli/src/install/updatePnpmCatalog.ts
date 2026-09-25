import fs from 'fs/promises';
import { parseDocument } from 'yaml';

import { findFileInParents } from '../utils/findUp';

export async function updatePnpmCatalogAsync(
  projectRoot: string,
  packages: { name: string; catalog: string; version: string }[]
) {
  if (!packages.length) return;

  const workspacePath = findFileInParents(projectRoot, 'pnpm-workspace.yaml');
  if (!workspacePath) {
    throw new Error('Cannot update pnpm catalog without pnpm-workspace.yaml');
  }

  const document = parseDocument(await fs.readFile(workspacePath, 'utf8'));
  if (document.errors.length) {
    throw document.errors[0];
  }

  for (const { name, catalog, version } of packages) {
    const key = catalog ? ['catalogs', catalog, name] : ['catalog', name];
    if (!document.hasIn(key)) {
      throw new Error(`Cannot find ${name} in ${catalog || 'default'} pnpm catalog`);
    }
    document.setIn(key, version);
  }

  await fs.writeFile(workspacePath, document.toString());
}
