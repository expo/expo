export function getFullBundlerUrl(): string {
  const currentScript = document?.currentScript;
  const bundleUrl = new URL(
    currentScript && 'src' in currentScript ? currentScript.src : location.href,
    location.href
  );

  if (!bundleUrl.searchParams.has('platform')) {
    bundleUrl.searchParams.set('platform', process.env.EXPO_OS ?? 'web');
  }

  return bundleUrl.toString();
}
