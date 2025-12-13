/** Accepts a package name (scoped or unscoped) and optionally with a specifier */
export function parsePackageSpecifier(specifier: string): string | null {
  let idx = -1;
  if (specifier[0] === '@') {
    idx = specifier.indexOf('/', 1);
    if (idx === -1 || specifier.length - 1 <= idx) {
      return null;
    }
  }
  idx = specifier.indexOf('@', idx + 1);
  const packageName = idx > -1 ? specifier.slice(0, idx) : specifier;
  return packageName.length > 0 ? packageName : null;
}
