// Outside the build dir to preserve the import syntax.
export async function asyncServerImport(moduleId) {
  // Not running in cloudflare, use Node.js require.
  if (typeof caches === 'undefined') {
    return $$require_external(moduleId);
  }

  let mod = await import(/* @metro-ignore */ moduleId);

  // Return the default export, or nested default export
  if ('default' in mod && typeof mod.default === 'object' && mod.default) {
    mod = mod.default;
    if ('default' in mod && typeof mod.default === 'object' && mod.default) {
      mod = mod.default;
    }
  }

  return mod;
}
