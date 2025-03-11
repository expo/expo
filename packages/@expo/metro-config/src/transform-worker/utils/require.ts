import * as path from 'node:path';
import * as url from 'node:url';

export async function tryRequireThenImport<TModule>(moduleId: string): Promise<TModule> {
  try {
    return require(moduleId);
  } catch (requireError: any) {
    let importESM;
    try {
      // eslint-disable-next-line no-new-func
      importESM = new Function('id', 'return import(id);');
    } catch {
      importESM = null;
    }

    if (requireError?.code === 'ERR_REQUIRE_ESM' && importESM) {
      const moduleIdOrUrl = path.isAbsolute(moduleId) ? url.pathToFileURL(moduleId).href : moduleId;

      const m = await importESM(moduleIdOrUrl);
      return m.default ?? m;
    }

    throw requireError;
  }
}

export function requireUncachedFile(moduleId: string) {
  try {
    // delete require.cache[require.resolve(moduleId)];
  } catch {}
  try {
    return require(moduleId);
  } catch (error: unknown) {
    if (error instanceof Error) {
      error.message = `Cannot load file ${moduleId}: ${error.message}`;
    }
    throw error;
  }
}
