import path from 'path';

export function getTemplateFilesPath(platform: 'android' | 'ios') {
  const packagePath = path.dirname(require.resolve('expo-sharing/package.json'));
  return path.join(packagePath, '/plugin/template-files/ios');
}

export function getSharedFilesPath() {
  const packagePath = path.dirname(require.resolve('expo-sharing/package.json'));
  return path.join(packagePath, '/ios/shared');
}

const resolveUrlSchemeWarnings = new Set<string>();

export function resolveUrlScheme(scheme: string | string[] | undefined | null) {
  if (!Array.isArray(scheme)) {
    return scheme ?? undefined;
  }
  if (scheme.length > 1) {
    const message = `Expo sharing: The app config defines multiple schemes (${scheme.join(', ')}). Using the first one ("${scheme[0]}") for the share extension.`;
    if (!resolveUrlSchemeWarnings.has(message)) {
      resolveUrlSchemeWarnings.add(message);
      console.warn(message);
    }
  }
  return scheme[0];
}
