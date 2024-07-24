import resolveFrom from 'resolve-from';

export function canResolveDevClient(projectRoot: string): boolean {
  try {
    // we check if `expo-dev-launcher` is installed instead of `expo-dev-client`
    // because someone could install only launcher.
    resolveFrom(projectRoot, 'expo-dev-launcher');
    return true;
  } catch {
    return false;
  }
}
