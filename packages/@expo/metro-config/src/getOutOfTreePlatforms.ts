import { getPackageJson } from '@expo/config';

export function getOutOfTreePlatforms(projectRoot: string): { name: string; package: string }[] {
  const outOfTreePlatforms: { name: string; package: string }[] = [];
  const pkg = getPackageJson(projectRoot);

  if (pkg?.dependencies?.['react-native-macos']) {
    outOfTreePlatforms.push({ name: 'macos', package: 'react-native-macos' });
  }

  return outOfTreePlatforms;
}
