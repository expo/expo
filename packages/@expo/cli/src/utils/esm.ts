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
      return await importESM(moduleId);
    }

    throw requireError;
  }
}
