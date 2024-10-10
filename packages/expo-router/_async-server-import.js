// Outside the build dir to preserve the import syntax.
export async function asyncServerImport(moduleId) {
  // Not running in cloudflare, use Node.js require.
  if (typeof caches === 'undefined') {
    return $$require_external(moduleId);
  }

  const m = await import(/* @metro-ignore */ moduleId);

  if ('default' in m && typeof m.default === 'object' && m.default) {
    const def = m.default;
    if ('default' in def && typeof def.default === 'object' && def.default) {
      return def;
    }
  }
  return m;
}
