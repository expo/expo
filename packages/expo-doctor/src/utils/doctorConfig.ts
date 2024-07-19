export function getDoctorConfig(pkg: any) {
  return pkg.expo?.doctor ?? {};
}

export function getDirectoryCheckExcludes(pkg: any) {
  const config = getDoctorConfig(pkg);
  return (config.directoryCheck?.exclude ?? []).map((ignoredPackage: string) => {
    if (
      typeof ignoredPackage === 'string' &&
      ignoredPackage.startsWith('/') &&
      ignoredPackage.endsWith('/')
    ) {
      // Remove the leading and trailing slashes
      return new RegExp(ignoredPackage.slice(1, -1));
    }
    return ignoredPackage;
  });
}
