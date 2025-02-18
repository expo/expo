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
      if (process.platform === 'win32') {
        moduleId = moduleId.replace(/\\/g, '/');
      }

      return (await importESM(moduleId)).default;
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
