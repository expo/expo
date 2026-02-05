import path from 'path';

export function getTemplateFilesPath(platform: 'android' | 'ios') {
  const packagePath = path.dirname(require.resolve('expo-sharing/package.json'));
  return path.join(packagePath, '/plugin/template-files/ios');
}

export function getSharedFilesPath() {
  const packagePath = path.dirname(require.resolve('expo-sharing/package.json'));
  return path.join(packagePath, '/ios/shared');
}
