import { getConfig } from '@expo/config';

import { getRoutePaths, getRouterDirectoryWithManifest } from '../../start/server/metro/router';

export function removeSupportedExtensions(name: string): string {
  return name.replace(/(\+api)?\.[jt]sx?$/g, '');
}

// Remove any amount of `./` and `../` from the start of the string
export function removeFileSystemDots(filePath: string): string {
  return filePath.replace(/^(?:\.\.?\/)+/g, '');
}

export function getRouterFixtureFromProject(projectRoot: string) {
  const { exp } = getConfig(projectRoot);
  const appDir = getRouterDirectoryWithManifest(projectRoot, exp);

  const routePaths = getRoutePaths(appDir)
    .filter((routePath) => {
      return !routePath.match(/^\.\/\+html/) && !routePath.match(/\+api\.[jt]sx?$/);
    })
    .sort();

  return `renderRouter({
${routePaths
  .map((routePath) => {
    const keyId = removeFileSystemDots(removeSupportedExtensions(routePath));
    const v = keyId.match(/_layout$/) ? `() => <Stack />` : `() => <View />`;
    return `  "${keyId}": () => ${v},`;
  })
  .join('\n')}
});`;
}
