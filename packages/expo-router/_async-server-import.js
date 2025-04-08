// Outside the build dir to preserve the import syntax.
export async function asyncServerImport(moduleId) {
  // Not running in cloudflare, use Node.js require.
  if (typeof caches === 'undefined') {
    return $$require_external(moduleId);
  }

  let mod = await import(/* @metro-ignore */ moduleId);

  // Unwrap exported `{ default: <mod> }` objects, where `<mod>` is another default exported ESM module
  if (
    'default' in mod &&
    typeof mod.default === 'object' &&
    mod.default &&
    (mod.default.default !== undefined || mod.default.__esModule === true)
  ) {
    mod = mod.default;
  }

  return mod;
}
