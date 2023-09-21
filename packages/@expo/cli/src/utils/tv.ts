import fs from 'fs';
import path from 'path';

/**
 *
 * @param dependencies The project package.json dependencies.
 * @param params isTV is true if we are building for TV.
 * @returns true if isTV is true, and the react-native dependency is not the TV fork.
 */
export function needsReactNativeDependencyChangedForTV(
  dependencies: any,
  params?: { isTV?: boolean }
) {
  const rnVersion: string | undefined = dependencies['react-native'];
  if (!params?.isTV) {
    return false;
  }
  // If the package currently has no react-native dependency, prebuild will add
  // the template version anyway
  if (rnVersion === undefined) {
    return false;
  }
  // Return true if the existing version is not the TV fork
  return (rnVersion?.indexOf('npm:react-native-tvos') ?? -1) !== 0;
}

/**
 *
 * @param projectRoot The project root path.
 * @param params isTV is true if we are building for TV.
 * @returns true if we are building for TV, but there is an existing Podfile configured for phone, or vice versa.
 */
export function needsIosProjectChangedForTV(projectRoot: string, params?: { isTV?: boolean }) {
  const podFilePath = path.join(projectRoot, 'ios', 'Podfile');
  if (!fs.existsSync(podFilePath)) {
    return false;
  }
  const podFileText = fs.readFileSync(podFilePath, { encoding: 'utf-8' });
  const podFileConfiguredForTV = podFileText.indexOf(':tvos') !== -1;
  return (params?.isTV ?? false) !== podFileConfiguredForTV;
}
