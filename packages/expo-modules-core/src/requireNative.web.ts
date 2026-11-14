export function requireNative<PackageType = any>(packageName: string): PackageType {
  const nativePackage = requireOptionalNative<PackageType>(packageName);
  if (nativePackage != null) {
    return nativePackage;
  }
  if (typeof window === 'undefined') {
    // For SSR, we expect not to have native modules available, but to avoid crashing from SSR resolutions, we return an empty object.
    return {} as PackageType;
  }
  throw new Error(
    `Cannot find native modules of the '${packageName}' package. ` +
      `Native modules are only available on web inside DOM components, so check the platform before requiring them.`
  );
}

export function requireOptionalNative<PackageType = any>(packageName: string): PackageType | null {
  if (typeof globalThis.ExpoDomWebView === 'object' && globalThis?.expo?.packages != null) {
    return globalThis.expo?.packages?.[packageName] ?? null;
  }
  return null;
}
